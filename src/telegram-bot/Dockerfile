FROM python:3.13-slim-bookworm AS builder

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_SYSTEM_PYTHON=1

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends gcc libffi-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir uv==0.6.0

WORKDIR /bot

COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache -r pyproject.toml


FROM python:3.13-slim-bookworm AS production

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/* && pip install --no-cache-dir --upgrade pip

COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /bot

COPY . .

RUN useradd -m appuser && chown -R appuser:appuser /bot
USER appuser

CMD ["python", "main.py"]
