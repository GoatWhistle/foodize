FROM python:3.13.0-bookworm AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_SYSTEM_PYTHON=1

COPY --from=ghcr.io/astral-sh/uv:0.6.0 /uv /uvx /bin/

WORKDIR /bot

COPY pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY . .

RUN useradd -m appuser
USER appuser

CMD ["python", "main.py"]
