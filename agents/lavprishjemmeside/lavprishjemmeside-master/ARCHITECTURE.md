# Lavprishjemmeside Master Architecture

Parent: `father`

## Primary Program Lane

- `lavprishjemmeside-cms`

## Governed Surfaces

- `lavprishjemmeside-root`
- `lavprishjemmeside-site-main`
- `lavprishjemmeside-site-ljdesignstudio`

## Task Agents

- `lph-ai-cms-task`
- `lph-seo-dashboard-task`
- `lph-ads-dashboard-task`
- `lph-subscription-ops-task`

## Critical Constraint

Treat cPanel MySQL as the application data source of truth. Do not migrate app transactional data into control-plane SQLite.

## Orchestration Pattern

- Start from the essential program docs in `programs/lavprishjemmeside/`.
- Treat the master as the decision and governance lane for CMS core, client-site governance, SEO/ads observability, subscription ops, and remote release operations.
- Use Agent Enterprise for orchestration and evidence gathering, not as a fake local clone of the remote CMS estate.
- Require changelog impact to be considered before closing work that changes CMS or client-management behavior.
