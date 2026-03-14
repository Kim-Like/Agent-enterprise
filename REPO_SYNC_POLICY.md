# Repo Sync Policy

This repo is the broad Agent Enterprise collaboration surface.

It is not automatically the deployment authority for every embedded subtree.

## Lavprishjemmeside Rule

`programs/lavprishjemmeside/local-mirror/` exists here as:

- context
- working copy
- integration surface with the broader Agent Enterprise codebase

But the dedicated `lavprishjemmeside.dk` GitHub repo remains the primary source of truth for that subtree.

## Required Behavior

If a PR changes `programs/lavprishjemmeside/local-mirror/**`:

1. mark the PR as affecting the CMS-primary subtree
2. include a sync note stating that the subtree must be mirrored into the primary CMS repo before deployment
3. do not describe the change as deployable from this monorepo alone

## Operator Note

The local nested `.git` metadata for `local-mirror/` is intentionally removed from this exported repo so the external monorepo remains a single Git repository.
