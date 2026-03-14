# Lavprishjemmeside CMS

> Reference-only: CMS authority context for internal/operator use. External sprint agents should execute from the root handoff pack instead.

This is the remote-first CMS authority for the Lavprishjemmeside program.

## Live Surfaces

- GitHub: `https://github.com/kimjeppesen01/lavprishjemmeside.dk`
- Bolt.new: `https://bolt.new`
- Site: `https://lavprishjemmeside.dk`
- API: `https://api.lavprishjemmeside.dk/health`
- cPanel repo: `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`

## Responsibilities

- CMS and AI workflow governance
- storefront, checkout, and order-management governance for the first-party shop module
- shared SEO and ads dashboard roadmap
- control database for governed client sites
- template/bootstrap authority for new client-site installs

## Operational Note

GitHub is the shared code-sync surface between Bolt.new and Agent Enterprise. Bolt.new can generate or evolve the app, but Agent Enterprise should only deploy code that is already in the GitHub repo. The cPanel repo is the live deployment mirror that Agent Enterprise may update over SSH.

New client-site installs should follow the SSH-first setup flow documented in `programs/lavprishjemmeside/local-mirror/docs/DEPLOY_NEW_DOMAIN.md` and `programs/lavprishjemmeside/local-mirror/docs/SSH_FIRST_OPERATIONS.md`. The installer now provisions the CMS plus the site's dedicated Agent Enterprise client agent together; do not treat the retired `ssh_client_install.sh` flow or the old CMS-side IAN stack as current authority.

This directory is not a checked-out working tree for the live CMS repo. It documents the authority surface inside `Agent Enterprise`.

The canonical local checkout for the GitHub-synced CMS code lives at `programs/lavprishjemmeside/local-mirror/`. Use `npm run lavpris:mirror-pull` from the Agent Enterprise root to create or update that checkout, and `npm run lavpris:sync-status` to compare GitHub, the local mirror, and the cPanel deployment repo before rollout.
