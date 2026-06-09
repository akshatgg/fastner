"""Data masking utility — a safety net for secrets in log output.

`mask_log_message()` is a fast, regex-only pass that scrubs accidentally-logged
secrets (AWS keys, tokens, JWTs, DB connection strings). It runs inside the
logging PII filter (see `app/core/logging_config.py`).

The primary defence is *not logging secrets in the first place* — this only
catches accidents. It deliberately does NOT touch application data, request
payloads or DB records; it only sanitises the rendered log string.
"""

import re

# Regex patterns for secret detection in logs.
SAFETY_NET_PATTERNS = {
    "aws_key": re.compile(r"\bAKIA[A-Z0-9]{16}\b"),
    "github_token": re.compile(r"\b(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{36,}\b"),
    "slack_token": re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]+\b"),
    "jwt": re.compile(r"\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"),
    "connection_string": re.compile(
        r"(?:postgresql|mysql|mongodb|redis)(?:\+\w+)?://[^\s]+",
        re.IGNORECASE,
    ),
}


def mask_secrets(text: str) -> str:
    """Fast regex-only masking for secrets in logs.

    A safety net — the primary defence is not logging secrets at all. Only
    catches AWS keys, GitHub/Slack tokens, JWTs and DB connection strings.
    """
    if not text or not isinstance(text, str):
        return text

    masked = text
    for name, pattern in SAFETY_NET_PATTERNS.items():
        masked = pattern.sub(f"[{name.upper()}]", masked)
    return masked


def mask_log_message(message: str) -> str:
    """Mask secrets in a log message. Fast regex-only."""
    return mask_secrets(message)
