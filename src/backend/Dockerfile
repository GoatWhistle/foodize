FROM python:3.13.0-bookworm AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /backend

RUN apt-get update && apt-get install -y netcat-openbsd && apt-get clean

RUN pip install --upgrade pip wheel "poetry==2.1.1"
RUN poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock /backend/
RUN poetry install --no-interaction --no-ansi --no-root

COPY . /backend/

FROM base AS migrations

RUN chmod +x /backend/entrypoint.sh
CMD ["/backend/entrypoint.sh"]

FROM base AS backend

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
