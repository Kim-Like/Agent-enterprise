#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd git

branch="${1:-$(default_git_branch)}"
mirror_path="$(local_mirror_path)"
repo_url="$(github_repo_ssh)"
parent_dir="$(dirname "${mirror_path}")"

mkdir -p "${parent_dir}"

if [ -d "${mirror_path}" ] && [ ! -d "${mirror_path}/.git" ]; then
  if find "${mirror_path}" -mindepth 1 -maxdepth 1 | read -r _; then
    echo "Existing non-git directory blocks mirror path: ${mirror_path}" >&2
    exit 1
  fi
fi

if [ ! -d "${mirror_path}/.git" ]; then
  rm -rf "${mirror_path}"
  git clone --branch "${branch}" "${repo_url}" "${mirror_path}"
else
  if [ -n "$(git -C "${mirror_path}" status --porcelain)" ]; then
    echo "Local mirror has uncommitted changes; refusing to pull." >&2
    git -C "${mirror_path}" status --short >&2
    exit 1
  fi

  git -C "${mirror_path}" remote set-url origin "${repo_url}"
  git -C "${mirror_path}" fetch origin "${branch}" --prune

  if git -C "${mirror_path}" show-ref --verify --quiet "refs/heads/${branch}"; then
    git -C "${mirror_path}" checkout "${branch}"
  else
    git -C "${mirror_path}" checkout -b "${branch}" "origin/${branch}"
  fi

  git -C "${mirror_path}" pull --ff-only origin "${branch}"
fi

echo "mirror_path=${mirror_path}"
echo "branch=$(git -C "${mirror_path}" rev-parse --abbrev-ref HEAD)"
echo "head=$(git -C "${mirror_path}" rev-parse HEAD)"
echo "origin=$(git -C "${mirror_path}" remote get-url origin)"

