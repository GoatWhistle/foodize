#!/bin/bash

set -e

echo "Waiting for postgres..."

DB_HOST="pg"
DB_PORT="5432"

while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

exec "$@"
