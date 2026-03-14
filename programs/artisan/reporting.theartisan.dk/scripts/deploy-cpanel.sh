#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_DIR}/../../.." && pwd)"

GLOBAL_ENV="${IAN_GLOBAL_ENV_PATH:-${REPO_ROOT}/.env}"
if [[ -f "${GLOBAL_ENV}" ]]; then
  # shellcheck disable=SC1090
  source "${GLOBAL_ENV}"
fi

SKIP_MIGRATE=0
SKIP_RESTART=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrate) SKIP_MIGRATE=1; shift ;;
    --skip-restart) SKIP_RESTART=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

require_var() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env var: ${key}" >&2
    exit 1
  fi
}

require_var CPANEL_SSH_HOST
require_var CPANEL_SSH_USER
require_var CPANEL_SSH_KEY_PATH
require_var ARTISAN_REPORTING_DB_NAME
require_var ARTISAN_REPORTING_DB_USER
require_var ARTISAN_REPORTING_DB_PASSWORD

CPANEL_SSH_PORT="${CPANEL_SSH_PORT:-22}"
ARTISAN_REPORTING_DB_HOST="${ARTISAN_REPORTING_DB_HOST:-127.0.0.1}"
ARTISAN_REPORTING_DB_PORT="${ARTISAN_REPORTING_DB_PORT:-3306}"
CPANEL_REPORTING_REPO_PATH="${CPANEL_REPORTING_REPO_PATH:-/home/${CPANEL_SSH_USER}/repositories/reporting.theartisan.dk}"
CPANEL_REPORTING_APP_PATH="${CPANEL_REPORTING_APP_PATH:-/home/${CPANEL_SSH_USER}/reporting.theartisan.dk}"
CPANEL_REPORTING_NODEVENV_PATH="${CPANEL_REPORTING_NODEVENV_PATH:-/home/${CPANEL_SSH_USER}/nodevenv/repositories/reporting.theartisan.dk/22/bin/activate}"
CPANEL_REPORTING_HEALTH_URL="${CPANEL_REPORTING_HEALTH_URL:-https://reporting.theartisan.dk/health}"

SSH_BASE=(ssh -i "${CPANEL_SSH_KEY_PATH}" -p "${CPANEL_SSH_PORT}" "${CPANEL_SSH_USER}@${CPANEL_SSH_HOST}")
RSYNC_SSH=(-e "ssh -i ${CPANEL_SSH_KEY_PATH} -p ${CPANEL_SSH_PORT}")

echo "Deploying from ${APP_DIR}"
echo "Remote repo: ${CPANEL_REPORTING_REPO_PATH}"
echo "Remote app : ${CPANEL_REPORTING_APP_PATH}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "Dry run enabled: rsync only."
fi

rsync -az "${RSYNC_SSH[@]}" \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'stderr.log' \
  --exclude 'stdout.log' \
  "${APP_DIR}/" "${CPANEL_SSH_USER}@${CPANEL_SSH_HOST}:${CPANEL_REPORTING_REPO_PATH}/"

rsync -az "${RSYNC_SSH[@]}" \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'stderr.log' \
  --exclude 'stdout.log' \
  "${APP_DIR}/" "${CPANEL_SSH_USER}@${CPANEL_SSH_HOST}:${CPANEL_REPORTING_APP_PATH}/"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "Dry run complete."
  exit 0
fi

"${SSH_BASE[@]}" env \
  ARTISAN_REPORTING_DB_HOST="${ARTISAN_REPORTING_DB_HOST}" \
  ARTISAN_REPORTING_DB_PORT="${ARTISAN_REPORTING_DB_PORT}" \
  ARTISAN_REPORTING_DB_NAME="${ARTISAN_REPORTING_DB_NAME}" \
  ARTISAN_REPORTING_DB_USER="${ARTISAN_REPORTING_DB_USER}" \
  ARTISAN_REPORTING_DB_PASSWORD="${ARTISAN_REPORTING_DB_PASSWORD}" \
  BILLY_API_TOKEN="${BILLY_API_TOKEN:-}" \
  CPANEL_REPORTING_REPO_PATH="${CPANEL_REPORTING_REPO_PATH}" \
  CPANEL_REPORTING_APP_PATH="${CPANEL_REPORTING_APP_PATH}" \
  CPANEL_REPORTING_NODEVENV_PATH="${CPANEL_REPORTING_NODEVENV_PATH}" \
  SKIP_MIGRATE="${SKIP_MIGRATE}" \
  SKIP_RESTART="${SKIP_RESTART}" \
  'bash -s' <<'EOS'
set -euo pipefail

upsert_env() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "${env_file}" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${env_file}"
  else
    echo "${key}=${value}" >> "${env_file}"
  fi
}

for dir in "${CPANEL_REPORTING_REPO_PATH}" "${CPANEL_REPORTING_APP_PATH}"; do
  [[ -f "${dir}/.env" ]] || touch "${dir}/.env"
  upsert_env "${dir}/.env" "ARTISAN_REPORTING_DB_HOST" "${ARTISAN_REPORTING_DB_HOST}"
  upsert_env "${dir}/.env" "ARTISAN_REPORTING_DB_PORT" "${ARTISAN_REPORTING_DB_PORT}"
  upsert_env "${dir}/.env" "ARTISAN_REPORTING_DB_NAME" "${ARTISAN_REPORTING_DB_NAME}"
  upsert_env "${dir}/.env" "ARTISAN_REPORTING_DB_USER" "${ARTISAN_REPORTING_DB_USER}"
  upsert_env "${dir}/.env" "ARTISAN_REPORTING_DB_PASSWORD" "${ARTISAN_REPORTING_DB_PASSWORD}"
  if [[ -n "${BILLY_API_TOKEN:-}" ]]; then
    upsert_env "${dir}/.env" "BILLY_API_TOKEN" "${BILLY_API_TOKEN}"
  fi
done

cd "${CPANEL_REPORTING_REPO_PATH}"
rm -rf node_modules
source "${CPANEL_REPORTING_NODEVENV_PATH}"
npm install

if [[ "${SKIP_MIGRATE}" != "1" ]]; then
  npm run db:schema
  npm run rules:seed
  npm run accounts:sync
  npm run rules:verify
fi

if [[ "${SKIP_RESTART}" != "1" ]]; then
  mkdir -p "${CPANEL_REPORTING_REPO_PATH}/tmp" "${CPANEL_REPORTING_APP_PATH}/tmp"
  touch "${CPANEL_REPORTING_REPO_PATH}/tmp/restart.txt" "${CPANEL_REPORTING_APP_PATH}/tmp/restart.txt"
fi
EOS

echo "Remote deploy complete. Verifying health..."
curl -fsS "${CPANEL_REPORTING_HEALTH_URL}" | sed -n '1,5p'
echo "Done."
