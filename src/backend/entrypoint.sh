#!/bin/sh
set -e

DB_HOST=$(echo "$DB__URL" | sed -E 's|.+@([^:/]+):.*|\1|')
DB_PORT=$(echo "$DB__URL" | sed -E 's|.+:([0-9]+)/.*|\1|')

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  echo "DB_URL: $DB__URL"
  echo "DB_HOST: $DB_HOST"
  echo "DB_PORT: $DB_PORT"
  echo "Database not available yet..."
  sleep 1
done

echo "Database is up!"

echo "Running Alembic migrations..."
alembic upgrade head
alembic current

echo "Migrations completed"

exec "$@"
