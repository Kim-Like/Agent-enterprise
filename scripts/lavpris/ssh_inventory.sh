#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd ssh
load_env

ssh_exec 'bash -s' -- "${LAVPRIS_NODE_BIN}" "${LAVPRIS_CMS_REPO_PATH}" "${LAVPRIS_CLIENT_REPO_PATH}" "${LAVPRIS_CMS_SITE_ROOT}" "${LAVPRIS_CLIENT_SITE_ROOT}" <<'REMOTE'
set -euo pipefail
node_bin_dir="$1"
cms_repo="$2"
client_repo="$3"
cms_site_root="$4"
client_site_root="$5"

export PATH="${node_bin_dir}:$PATH"

echo "=== host ==="
hostname
whoami

echo
echo "=== remote surfaces ==="
printf 'cms_repo=%s\n' "${cms_repo}"
printf 'client_repo=%s\n' "${client_repo}"
printf 'cms_site_root=%s\n' "${cms_site_root}"
printf 'client_site_root=%s\n' "${client_site_root}"

echo
echo "=== node workers ==="
ps -eo pid,user,command | grep -E "lsnode:.*/repositories/(lavprishjemmeside.dk|ljdesignstudio.dk)/api/" | grep -v grep || true

echo
echo "=== active sites table ==="
cd "${cms_repo}/api"
node - <<'NODE'
const fs = require("fs");
const mysql = require("mysql2/promise");

function parseEnv(path) {
  const env = {};
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

(async () => {
  const env = parseEnv(".env");
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });
  const [rows] = await conn.query(
    "SELECT id, name, domain, api_url, admin_url, is_active, version FROM sites WHERE is_active = 1 ORDER BY id",
  );
  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
  await conn.end();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
NODE
REMOTE
