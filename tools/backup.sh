#!/usr/bin/env bash
set -euo pipefail

log() { echo "[backup] $*"; }
warn() { echo "[backup][WARN] $*" >&2; }
die() { echo "[backup][ERROR] $*" >&2; exit 1; }

DB="${POSTGRES_DB:-foodize}"
DB_USER="${POSTGRES_USER:-foodize_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP_LAST:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

command -v docker >/dev/null 2>&1 || die "docker CLI not found"

detect_container() {
  if [[ -n "${PG_CONTAINER:-}" ]] \
     && docker ps --format '{{.Names}}' | grep -qx "${PG_CONTAINER}"; then
    echo "${PG_CONTAINER}"
    return 0
  fi
  local found
  found=$(docker ps --filter "label=com.docker.compose.service=pg" \
                    --format '{{.Names}}' | head -n1)
  if [[ -n "$found" ]]; then
    echo "$found"
    return 0
  fi
  found=$(docker ps --format '{{.Names}}' | grep -E 'postgres|_pg' | head -n1 || true)
  if [[ -n "$found" ]]; then
    echo "$found"
    return 0
  fi
  echo "${PG_CONTAINER:-foodize_pg}"
}

CONTAINER=$(detect_container)

mkdir -p "$BACKUP_DIR"

BASENAME="foodize_${TIMESTAMP}.dump"
FINAL="${BACKUP_DIR}/${BASENAME}"
TMP="${BACKUP_DIR}/.${BASENAME}.tmp.$$"

cleanup() { rm -f "$TMP" 2>/dev/null || true; }
trap cleanup EXIT

log "Dumping database '$DB' from container '$CONTAINER'..."
if ! docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB" > "$TMP"; then
  die "pg_dump failed; partial dump discarded"
fi
if [[ ! -s "$TMP" ]]; then
  die "pg_dump produced an empty file; discarded"
fi

if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  command -v gpg >/dev/null 2>&1 || die "gpg not found but BACKUP_GPG_RECIPIENT is set"
  log "Encrypting dump with gpg for recipient '$BACKUP_GPG_RECIPIENT'..."
  ENC_TMP="${TMP}.gpg"
  if ! gpg --batch --yes --trust-model always \
        --recipient "$BACKUP_GPG_RECIPIENT" \
        --output "$ENC_TMP" --encrypt "$TMP"; then
    rm -f "$ENC_TMP" 2>/dev/null || true
    die "gpg encryption failed"
  fi
  rm -f "$TMP"
  TMP="$ENC_TMP"
  FINAL="${FINAL}.gpg"
  BASENAME="${BASENAME}.gpg"
elif [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]]; then
  command -v openssl >/dev/null 2>&1 || die "openssl not found but BACKUP_ENCRYPTION_PASSPHRASE is set"
  log "Encrypting dump with AES-256-CBC (pbkdf2)..."
  ENC_TMP="${TMP}.enc"
  if ! openssl enc -aes-256-cbc -pbkdf2 -salt \
        -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
        -in "$TMP" -out "$ENC_TMP"; then
    rm -f "$ENC_TMP" 2>/dev/null || true
    die "openssl encryption failed"
  fi
  rm -f "$TMP"
  TMP="$ENC_TMP"
  FINAL="${FINAL}.enc"
  BASENAME="${BASENAME}.enc"
else
  warn "no encryption key set (BACKUP_GPG_RECIPIENT / BACKUP_ENCRYPTION_PASSPHRASE); backup will be stored UNENCRYPTED"
fi

mv -f "$TMP" "$FINAL"
trap - EXIT
log "Saved to $FINAL ($(du -sh "$FINAL" | cut -f1))"

if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  S3_PREFIX="${BACKUP_S3_PREFIX:-foodize-backups}"
  DEST="s3://${BACKUP_S3_BUCKET}/${S3_PREFIX}/${BASENAME}"
  if command -v aws >/dev/null 2>&1; then
    log "Uploading to $DEST via aws cli..."
    aws s3 cp "$FINAL" "$DEST" || warn "aws s3 upload failed"
  elif command -v mc >/dev/null 2>&1; then
    MC_DEST="${BACKUP_S3_ALIAS:-s3}/${BACKUP_S3_BUCKET}/${S3_PREFIX}/${BASENAME}"
    log "Uploading to $MC_DEST via mc cli..."
    mc cp "$FINAL" "$MC_DEST" || warn "mc upload failed"
  else
    warn "BACKUP_S3_BUCKET set but neither aws nor mc CLI found; skipping offsite upload"
  fi
else
  log "BACKUP_S3_BUCKET not set; skipping offsite upload"
fi

log "Applying retention: keeping last $KEEP backups (incl. encrypted)..."
{ ls -t "$BACKUP_DIR"/foodize_*.dump "$BACKUP_DIR"/foodize_*.dump.enc \
       "$BACKUP_DIR"/foodize_*.dump.gpg 2>/dev/null || true; } \
  | tail -n +"$((KEEP + 1))" \
  | xargs -r rm -f --

log "Done."
