FROM python:3.13.0-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /backend

RUN apt-get update && apt-get install -y netcat-openbsd && apt-get clean

RUN pip install --upgrade pip wheel "poetry==2.1.1"
RUN poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock /backend/
RUN poetry install --no-interaction --no-ansi --no-root

COPY . /backend/
