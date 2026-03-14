# Export Sanitization Manifest

This file defines what was intentionally included, excluded, or downgraded for the external monorepo.

## Included Context

- `agents/**`
- `.agents/**`
- `client/**`
- `config/**`
- `docs/**`
- `programs/**`
- `scripts/**`
- `server/**`
- `tests/**`
- `.planning/**`
- root docs and package manifests

## Visible But Operator-Owned

- operator runbooks under `docs/**`
- blocked remote-operation package scripts
- `programs/lavprishjemmeside/local-mirror/**` as context/work copy

## Excluded

- `.env.local`
- `.data/**`
- `.logs/**`
- `node_modules/**`
- `.DS_Store`
- local machine helper artifacts
- nested Git metadata such as `programs/lavprishjemmeside/local-mirror/.git/`

## Notes

- This export is meant for external collaboration, not live deployment.
- The absence of secrets and runtime state is intentional.
- Remote execution must always be handled through `OPERATOR_HANDOFF_CONTRACT.md`.
