#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SSH_ALIAS="cp10-theartis"

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 1
  fi
}

load_env() {
  local env_files=(
    "${PROJECT_ROOT}/.env.local"
    "${PROJECT_ROOT}/.env"
  )
  local loaded=0

  for env_file in "${env_files[@]}"; do
    if [ ! -f "${env_file}" ]; then
      continue
    fi

    # shellcheck disable=SC1090
    set -a
    source "${env_file}"
    set +a
    loaded=1
  done

  if [ "${loaded}" -ne 1 ]; then
    echo "Missing env file. Expected ${PROJECT_ROOT}/.env.local or ${PROJECT_ROOT}/.env" >&2
    exit 1
  fi

  : "${CPANEL_SSH_HOST:?CPANEL_SSH_HOST is required}"
  : "${CPANEL_SSH_PORT:?CPANEL_SSH_PORT is required}"
  : "${CPANEL_SSH_USER:?CPANEL_SSH_USER is required}"
  : "${CPANEL_SSH_KEY_PATH:?CPANEL_SSH_KEY_PATH is required}"
  : "${LAVPRIS_CMS_REPO_PATH:?LAVPRIS_CMS_REPO_PATH is required}"
  : "${LAVPRIS_CLIENT_REPO_PATH:?LAVPRIS_CLIENT_REPO_PATH is required}"
  : "${LAVPRIS_CMS_SITE_ROOT:?LAVPRIS_CMS_SITE_ROOT is required}"
  : "${LAVPRIS_CLIENT_SITE_ROOT:?LAVPRIS_CLIENT_SITE_ROOT is required}"

  if [ -z "${CPANEL_NODE_BIN:-}" ] && [ -n "${LAVPRIS_NODE_BIN:-}" ]; then
    CPANEL_NODE_BIN="${LAVPRIS_NODE_BIN}"
  fi

  : "${CPANEL_NODE_BIN:?CPANEL_NODE_BIN is required}"

  ARTISAN_WP_REPO_PATH="${ARTISAN_WP_REPO_PATH:-/home/${CPANEL_SSH_USER}/repositories/the-artisan}"
  ARTISAN_WP_SITE_ROOT="${ARTISAN_WP_SITE_ROOT:-/home/${CPANEL_SSH_USER}/public_html}"
  ARTISAN_WP_DOMAIN_ROOT="${ARTISAN_WP_DOMAIN_ROOT:-/home/${CPANEL_SSH_USER}/theartisan.dk}"
  ARTISAN_REPORTING_REPO_PATH="${ARTISAN_REPORTING_REPO_PATH:-/home/${CPANEL_SSH_USER}/repositories/reporting.theartisan.dk}"
  ARTISAN_REPORTING_SITE_ROOT="${ARTISAN_REPORTING_SITE_ROOT:-/home/${CPANEL_SSH_USER}/reporting.theartisan.dk}"
  THIRDWAVE_SITE_ROOT="${THIRDWAVE_SITE_ROOT:-/home/${CPANEL_SSH_USER}/thirdwave.dk}"
  THIRDWAVE_AUDIT_PROXY_PATH="${THIRDWAVE_AUDIT_PROXY_PATH:-${THIRDWAVE_SITE_ROOT}/seo-auditor/audit_proxy.php}"
}

ssh_alias() {
  printf '%s\n' "${SSH_ALIAS}"
}

ssh_config_path() {
  printf '%s\n' "${HOME}/.ssh/config"
}

ensure_ssh_alias_defined() {
  local config_path
  config_path="$(ssh_config_path)"

  if [ ! -f "${config_path}" ]; then
    echo "Missing SSH config: ${config_path}" >&2
    exit 1
  fi

  if ! awk '
    /^[[:space:]]*Host[[:space:]]+/ {
      for (i = 2; i <= NF; i += 1) {
        if ($i == "cp10-theartis") {
          found = 1
        }
      }
    }
    END { exit found ? 0 : 1 }
  ' "${config_path}"; then
    echo "Missing SSH alias cp10-theartis in ${config_path}" >&2
    exit 1
  fi
}

resolve_ssh_field() {
  local field="$1"
  ssh -G "$(ssh_alias)" 2>/dev/null | awk -v key="${field}" '$1 == key { print $2; exit }'
}

ssh_exec() {
  ensure_ssh_alias_defined
  ssh \
    -F "$(ssh_config_path)" \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=20 \
    "$(ssh_alias)" \
    "$@"
}

default_surfaces() {
  printf '%s\n' \
    "lavprishjemmeside.dk" \
    "ljdesignstudio.dk" \
    "reporting.theartisan.dk" \
    "theartisan.dk" \
    "thirdwave.dk"
}

surface_stack() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk|ljdesignstudio.dk)
      printf '%s\n' "astro-node-mysql"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "node-express-ejs"
      ;;
    theartisan.dk)
      printf '%s\n' "wordpress-woocommerce-b2b"
      ;;
    thirdwave.dk)
      printf '%s\n' "wordpress-plus-seo-auditor"
      ;;
    *)
      printf '%s\n' "unknown"
      ;;
  esac
}

surface_mode() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk|ljdesignstudio.dk)
      printf '%s\n' "repo-plus-live-site"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "repo-plus-live-node-app"
      ;;
    theartisan.dk)
      printf '%s\n' "repo-plus-live-wordpress"
      ;;
    thirdwave.dk)
      printf '%s\n' "live-root-only"
      ;;
    *)
      printf '%s\n' "unknown"
      ;;
  esac
}

surface_repo_path() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk)
      printf '%s\n' "${LAVPRIS_CMS_REPO_PATH}"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "${LAVPRIS_CLIENT_REPO_PATH}"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "${ARTISAN_REPORTING_REPO_PATH}"
      ;;
    theartisan.dk)
      printf '%s\n' "${ARTISAN_WP_REPO_PATH}"
      ;;
    thirdwave.dk)
      printf '%s\n' ""
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_site_root() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk)
      printf '%s\n' "${LAVPRIS_CMS_SITE_ROOT}"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "${LAVPRIS_CLIENT_SITE_ROOT}"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "${ARTISAN_REPORTING_SITE_ROOT}"
      ;;
    theartisan.dk)
      printf '%s\n' "${ARTISAN_WP_SITE_ROOT}"
      ;;
    thirdwave.dk)
      printf '%s\n' "${THIRDWAVE_SITE_ROOT}"
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_domain_root() {
  local surface="$1"
  case "${surface}" in
    theartisan.dk)
      printf '%s\n' "${ARTISAN_WP_DOMAIN_ROOT}"
      ;;
    *)
      surface_site_root "${surface}"
      ;;
  esac
}

surface_site_url() {
  local surface="$1"
  printf 'https://%s\n' "${surface}"
}

surface_health_url() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk)
      printf '%s\n' "https://api.lavprishjemmeside.dk/health"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "https://api.ljdesignstudio.dk/health"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "https://reporting.theartisan.dk/health"
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_wp_json_url() {
  local surface="$1"
  case "${surface}" in
    theartisan.dk|thirdwave.dk)
      printf 'https://%s/wp-json/\n' "${surface}"
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_extra_probe_url() {
  local surface="$1"
  case "${surface}" in
    thirdwave.dk)
      printf '%s\n' "https://thirdwave.dk/seo-auditor/audit_proxy.php"
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_note() {
  local surface="$1"
  case "${surface}" in
    theartisan.dk)
      printf '%s\n' "Live WordPress is served from public_html; /home/theartis/theartisan.dk is only the cPanel domain root."
      ;;
    thirdwave.dk)
      printf '%s\n' "No dedicated repo found on cp10; edits currently land directly in the live site root."
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "Independent reporting app shares the same cPanel account and remains repo-backed."
      ;;
    *)
      printf '%s\n' ""
      ;;
  esac
}

surface_write_paths() {
  local surface="$1"
  case "${surface}" in
    lavprishjemmeside.dk)
      printf '%s\n' "${LAVPRIS_CMS_REPO_PATH}" "${LAVPRIS_CMS_REPO_PATH}/api" "${LAVPRIS_CMS_SITE_ROOT}"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "${LAVPRIS_CLIENT_REPO_PATH}" "${LAVPRIS_CLIENT_REPO_PATH}/api" "${LAVPRIS_CLIENT_SITE_ROOT}"
      ;;
    reporting.theartisan.dk)
      printf '%s\n' "${ARTISAN_REPORTING_REPO_PATH}" "${ARTISAN_REPORTING_SITE_ROOT}"
      ;;
    theartisan.dk)
      printf '%s\n' "${ARTISAN_WP_REPO_PATH}" "${ARTISAN_WP_SITE_ROOT}" "${ARTISAN_WP_SITE_ROOT}/wp-content"
      ;;
    thirdwave.dk)
      printf '%s\n' "${THIRDWAVE_SITE_ROOT}" "${THIRDWAVE_SITE_ROOT}/wp-content" "${THIRDWAVE_SITE_ROOT}/seo-auditor"
      ;;
    *)
      ;;
  esac
}

runtime_only_status_line() {
  local line="$1"
  case "${line}" in
    "?? api/stderr.log"|"?? api/tmp/"|"?? api/tmp/"*|"?? tmp/"|"?? stderr.log")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
