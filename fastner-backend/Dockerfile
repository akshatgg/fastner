# Fastner backend (FastAPI) — Cloud Run container.
#
# Cloud Run injects $PORT (8080) and expects the process to listen on 0.0.0.0.
# Dependencies are installed from the Poetry lockfile in a separate layer so a
# code-only change does not re-resolve the dependency graph.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# psycopg2-binary ships its own libpq, so no build toolchain is needed here.
RUN pip install --no-cache-dir "poetry>=2.0,<3.0"

# Lockfile layer — cached until pyproject.toml / poetry.lock actually change.
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root --no-interaction --no-ansi

COPY . .

# Shell form so ${PORT} is expanded at runtime; exec keeps uvicorn as PID 1 so
# Cloud Run's SIGTERM reaches it and shutdown stays graceful.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
