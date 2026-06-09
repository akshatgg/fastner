"""Request-ID middleware.

Generates a unique ``request_id`` per incoming HTTP request and:
  * stashes it in ``scope["state"]["request_id"]``,
  * adds it to the response as the ``X-Request-ID`` header,
  * sets it in the logging contextvar so EVERY log line emitted during the
    request automatically carries it (see ``app/core/logging_config.py``).

Implemented as pure ASGI (not Starlette's BaseHTTPMiddleware) so it never
buffers the response body — streaming endpoints flush each chunk immediately.
"""

import time
import uuid

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.logging_config import clear_request_id, get_logger, set_request_id

logger = get_logger(__name__)


class RequestIDMiddleware:
    """Pure-ASGI middleware that tags each request with a UUID4 request id and
    binds it to the logging context for the duration of the request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = str(uuid.uuid4())
        state = scope.setdefault("state", {})
        state["request_id"] = request_id
        set_request_id(request_id)

        method = scope.get("method", "?")
        path = scope.get("path", "?")
        status_code = 0
        start = time.perf_counter()

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("latin-1")))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.error("%s %s -> 500 (%.0fms) - %s", method, path, elapsed_ms, exc)
            raise
        else:
            # One line per request so page loads / API fetches are visible.
            # Skip CORS preflights (OPTIONS) to cut browser noise.
            if method != "OPTIONS":
                elapsed_ms = (time.perf_counter() - start) * 1000
                logger.info("%s %s -> %s (%.0fms)", method, path, status_code, elapsed_ms)
        finally:
            clear_request_id()
