#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-operator-only-command}"

echo "${command_name} is operator-only in the external Agent Enterprise monorepo." >&2
echo "Use OPERATOR_HANDOFF_CONTRACT.md and hand the required remote work back to the operator." >&2
exit 1
