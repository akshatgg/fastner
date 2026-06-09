"""Centralized logging configuration (stdlib only) with request_id context.

Mirrors the vm-api setup: a single stdlib-``logging`` configuration that picks
its formatter by environment —

  * an interactive local terminal gets the colored, human-readable
    :class:`HumanColorFormatter` (``HH:MM:SS [LEVEL] logger.name: message``);
  * everything else (production, CI, piped/redirected output) gets
    :class:`JSONFormatter` so log-ingestion pipelines stay intact.

A :class:`ContextFilter` injects the per-request ``request_id`` (set by the
RequestIDMiddleware) into every record, and a :class:`PIIMaskingFilter` scrubs
accidentally-logged secrets. Call :func:`configure_logging` once at startup
(see ``app/main.py``); obtain module loggers with :func:`get_logger`.
"""

import json
import logging
import re
import sys
import threading
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict

from app.core.config import settings
from app.utils.data_masker import mask_log_message

# Thread-safe / async-safe context var carrying the current request id. Set by
# the RequestIDMiddleware so every log line in a request includes it.
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

# Render WARNING as "WARN" / CRITICAL as "CRIT" for a tidy fixed-width column.
logging.addLevelName(logging.WARNING, "WARN")
logging.addLevelName(logging.CRITICAL, "CRIT")


class PIIMaskingFilter(logging.Filter):
    """Safety-net filter that masks secrets in the rendered log message (NOT
    application data). Catches accidental leaks of AWS keys, tokens, JWTs and DB
    connection strings — see ``app/utils/data_masker.py``."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            if record.msg and isinstance(record.msg, str):
                record.msg = mask_log_message(record.msg)
            if record.args:
                record.args = tuple(
                    mask_log_message(a) if isinstance(a, str) else a
                    for a in record.args
                )
        except Exception:
            # Never let masking break logging — pass the record through as-is.
            pass
        return True


class ContextFilter(logging.Filter):
    """Adds the request_id (from the contextvar) plus thread info to records, so
    every log within a request carries its id without manual binding."""

    def filter(self, record: logging.LogRecord) -> bool:
        request_id = request_id_var.get()
        if request_id and request_id != "-":
            record.request_id = request_id
        record.thread_name = threading.current_thread().name
        return True


class HumanColorFormatter(logging.Formatter):
    """Human-readable colored formatter for local dev terminals.

    Only installed when the environment is local AND stderr is a TTY (see
    :func:`configure_logging`); non-TTY contexts keep the JSON formatter.

    Output shape::

        HH:MM:SS [WARN] logger.name: message text wrapped to the next
                        line with a hanging indent

    Color routing by logger name (first match wins):
      lifecycle anchors        → green
      app.*.router / app.main  → orange (the API / entrypoint layer)
      everything else          → grey (services, uvicorn, sqlalchemy, libraries)

    The body stays muted grey by default so the output reads calm — colour is
    reserved for level tags (yellow WARN / red ERROR), lifecycle beats (green)
    and the orange API layer.
    """

    # ANSI codes — inline so this module stays dependency-free.
    _GREEN = "\033[0;32m"
    _YELLOW = "\033[1;33m"
    _RED = "\033[0;31m"
    _ORANGE = "\033[38;5;208m"  # IBC brand-ish orange
    _WHITE = ""  # terminal default foreground
    _GREY = "\033[38;5;245m"
    _DIM = "\033[2m"
    _NC = "\033[0m"

    # "HH:MM:SS " — continuation lines align to this column.
    _HANGING_INDENT = " " * 9

    # Orange → the API / entrypoint layer (request handling + startup).
    _APP_ENTRY_SUFFIX = ".router"
    _APP_ENTRY_NAMES = ("app.main",)

    # Lifecycle anchors → rendered green so startup/shutdown beats stand out.
    _LIFECYCLE_RE = re.compile(
        r"^(?:"
        r"Starting IBC"
        r"|Application startup complete"
        r"|Shutting down"
        r"|Logging configured"
        r")"
    )

    def __init__(self) -> None:
        super().__init__()
        self._timefmt = "%H:%M:%S"

    def _color_for(self, name: str, msg: str) -> str:
        # Lifecycle wins over source so startup/shutdown always flash green.
        if self._LIFECYCLE_RE.search(msg):
            return self._GREEN
        # API / entrypoint layer → orange accent; everything else (service
        # business logic, libraries) stays muted grey.
        if name in self._APP_ENTRY_NAMES or name.endswith(self._APP_ENTRY_SUFFIX):
            return self._ORANGE
        return self._GREY

    def _wrap(self, text: str) -> list[str]:
        """Soft-wrap a flat message to terminal width with a hanging indent."""
        import shutil
        import textwrap

        width = shutil.get_terminal_size((120, 24)).columns
        content_width = max(40, width - len(self._HANGING_INDENT))
        return textwrap.wrap(text, width=content_width) or [""]

    def format(self, record: logging.LogRecord) -> str:
        ts = self.formatTime(record, self._timefmt)
        msg = " ".join(record.getMessage().splitlines())
        name = record.name
        color = self._color_for(name, msg)

        # Level tag only for warnings/errors — INFO is the common case (no tag).
        if record.levelno >= logging.ERROR:
            tag = f"{self._RED}ERROR{self._NC} "
        elif record.levelno >= logging.WARNING:
            tag = f"{self._YELLOW}WARN {self._NC} "
        else:
            tag = ""

        # Warnings/errors get the logger name prefixed to make the source clear.
        body = f"{name}: {msg}" if record.levelno >= logging.WARNING else msg

        wrapped = self._wrap(body)
        first = f"{self._DIM}{ts}{self._NC} {tag}{color}{wrapped[0]}{self._NC}"
        rest = [
            f"{self._HANGING_INDENT}{color}{line}{self._NC}" for line in wrapped[1:]
        ]
        out = "\n".join([first] + rest)

        if record.exc_info:
            tb = self.formatException(record.exc_info)
            out += "\n" + "\n".join(
                f"{self._HANGING_INDENT}{self._RED}{line}{self._NC}"
                for line in tb.splitlines()
            )
        return out


class JSONFormatter(logging.Formatter):
    """Clean JSON formatter (stdlib only) for non-TTY / production output."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if record.exc_info:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "value": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info),
            }
        else:
            log_record["exception"] = None
        log_record["thread"] = getattr(record, "thread_name", "MainThread")
        return json.dumps(log_record)


def configure_logging() -> None:
    """Configure the root logger with our formatter + filters.

    Idempotent in effect: clears existing handlers and installs a single console
    handler on stderr. The colored human formatter is used only on an
    interactive local terminal; everything else gets JSON. Verbose libraries are
    pinned down so app logs stay readable.
    """
    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    context_filter = ContextFilter()
    pii_masking_filter = PIIMaskingFilter()

    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(log_level)

    use_human_formatter = settings.IS_DEVELOPMENT and sys.stderr.isatty()
    console_handler.setFormatter(
        HumanColorFormatter() if use_human_formatter else JSONFormatter()
    )

    # Mask secrets first, then attach request context.
    console_handler.addFilter(pii_masking_filter)
    console_handler.addFilter(context_filter)

    root_logger.addHandler(console_handler)
    root_logger.setLevel(log_level)

    # Quiet commonly-verbose libraries so app logs aren't drowned out.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Route Python warnings (e.g. PyJWT's short-HMAC-key notice) through logging
    # so they render in our format instead of raw multi-line stderr dumps.
    logging.captureWarnings(True)

    logging.info("Logging configured successfully with stdlib logging")


def get_logger(name: str) -> logging.Logger:
    """Return a module logger. Use ``get_logger(__name__)`` in app modules."""
    return logging.getLogger(name)


def set_request_id(request_id: str) -> None:
    """Set the request_id for the current context (called by middleware)."""
    request_id_var.set(request_id)


def clear_request_id() -> None:
    """Clear the request_id from the current context (end of a request)."""
    request_id_var.set("-")


def get_request_id() -> str:
    """Return the current request_id from context."""
    return request_id_var.get()
