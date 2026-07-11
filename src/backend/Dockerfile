FROM python:3.13.0-slim-bookworm AS builder

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_LINK_MODE=copy

RUN pip install --no-cache-dir uv==0.6.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev libffi-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN uv venv "$VIRTUAL_ENV"

WORKDIR /backend

COPY pyproject.toml uv.lock ./
RUN uv pip install --no-cache -r pyproject.toml

FROM python:3.13.0-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core libpq5 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /backend

COPY --from=builder /opt/venv /opt/venv

COPY . .

FROM base AS migrations
RUN useradd -m appuser
USER appuser
CMD ["alembic", "upgrade", "head"]

FROM base AS backend
ENV FORWARDED_ALLOW_IPS=172.16.0.0/12
ENV GUNICORN_WORKERS=4
ENV GUNICORN_TIMEOUT=60
ENV GUNICORN_GRACEFUL_TIMEOUT=30
ENV GUNICORN_MAX_REQUESTS=1000
ENV GUNICORN_MAX_REQUESTS_JITTER=100
RUN useradd -m appuser
USER appuser
CMD ["sh", "-c", "gunicorn main:app -k uvicorn.workers.UvicornWorker -w \"$GUNICORN_WORKERS\" -b 0.0.0.0:8000 --forwarded-allow-ips \"$FORWARDED_ALLOW_IPS\" --timeout \"$GUNICORN_TIMEOUT\" --graceful-timeout \"$GUNICORN_GRACEFUL_TIMEOUT\" --max-requests \"$GUNICORN_MAX_REQUESTS\" --max-requests-jitter \"$GUNICORN_MAX_REQUESTS_JITTER\""]

FROM base AS backend-dev
RUN useradd -m appuser
USER appuser
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS worker
RUN useradd -m appuser
USER appuser
CMD ["python", "-m", "worker.main"]

FROM base AS worker-dev
RUN useradd -m appuser
USER appuser
CMD ["watchfiles", "python -m worker.main", "/backend"]
