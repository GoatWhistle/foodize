#!/usr/bin/env bash
set -euo pipefail

log() { echo "[restore] $*"; }
warn() { echo "[restore][WARN] $*" >&2; }
die() { echo "[restore][ERROR] $*" >&2; exit 1; }

CONFIRM_FLAG="no"
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --yes|-y) CONFIRM_FLAG="yes" ;;
    *) ARGS+=("$arg") ;;
  esac
done

FILE="${ARGS[0]:-}"
CONTAINER="${PG_CONTAINER:-foodize_pg}"
DB="${POSTGRES_DB:-foodize}"
DB_USER="${POSTGRES_USER:-foodize_user}"

if [[ -z "$FILE" ]]; then
  die "Usage: $0 <backup_file.dump[.enc]> [--yes]"
fi
if [[ ! -f "$FILE" ]]; then
  die "File not found: $FILE"
fi

command -v docker >/dev/null 2>&1 || die "docker CLI not found"

if [[ "${CONFIRM:-}" != "yes" && "$CONFIRM_FLAG" != "yes" ]]; then
  die "Refusing to run: this DROPs and recreates database '$DB'. Re-run with CONFIRM=yes or --yes."
fi

TMP=""
cleanup() { [[ -n "$TMP" ]] && rm -f "$TMP" 2>/dev/null || true; }
trap cleanup EXIT

RESTORE_SRC="$FILE"
if [[ "$FILE" == *.gpg ]]; then
  command -v gpg >/dev/null 2>&1 || die "gpg not found for decryption"
  log "Decrypting $FILE via gpg..."
  TMP="$(mktemp)"
  if ! gpg --batch --yes --output "$TMP" --decrypt "$FILE"; then
    die "gpg decryption failed (missing private key?)"
  fi
  RESTORE_SRC="$TMP"
elif [[ "$FILE" == *.enc ]]; then
  [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]] \
    || die "Encrypted backup but BACKUP_ENCRYPTION_PASSPHRASE is not set"
  command -v openssl >/dev/null 2>&1 || die "openssl not found for decryption"
  log "Decrypting $FILE..."
  TMP="$(mktemp)"
  if ! openssl enc -d -aes-256-cbc -pbkdf2 \
        -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
        -in "$FILE" -out "$TMP"; then
    die "decryption failed (wrong passphrase?)"
  fi
  RESTORE_SRC="$TMP"
fi

log "Restoring database '$DB' in container '$CONTAINER' from $FILE..."

log "Dropping database (FORCE) to terminate active connections..."
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB} WITH (FORCE);"
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d postgres \
  -c "CREATE DATABASE ${DB} OWNER ${DB_USER};"

log "Restoring dump..."
docker exec -i "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB" \
  --no-owner --role="$DB_USER" < "$RESTORE_SRC"

log "Done. Database '$DB' restored from $FILE."
