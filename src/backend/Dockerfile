FROM python:3.13.0-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_SYSTEM_PYTHON=1

RUN pip install --no-cache-dir uv==0.6.0

WORKDIR /backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd fonts-dejavu-core gcc libpq-dev libffi-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY . .

FROM base AS migrations
RUN useradd -m appuser
USER appuser
CMD ["alembic", "upgrade", "head"]

FROM base AS backend
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
