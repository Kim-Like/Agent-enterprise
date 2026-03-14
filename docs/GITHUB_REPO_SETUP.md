# GitHub Repo Setup

This repo is intended to be published as a private GitHub repository.

## Required Settings

1. make the repository private
2. set `main` as the default branch
3. require pull requests for changes to `main`
4. require at least one review before merge
5. block force-push and branch deletion on `main`
6. enable CODEOWNERS review
7. use `.github/PULL_REQUEST_TEMPLATE.md`

## Operator Rule

PRs that require SSH, cPanel, DB, Roundcube, env, or live verification work must not be treated as complete without the corresponding operator packet from `OPERATOR_HANDOFF_CONTRACT.md`.
