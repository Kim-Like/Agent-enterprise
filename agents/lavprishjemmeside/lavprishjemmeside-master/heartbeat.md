# Lavprishjemmeside Master Spawn Rules

1. Route core platform objectives to `lph-ai-cms-task` first unless explicit override.
2. Route SEO reporting objectives to `lph-seo-dashboard-task`.
3. Route paid media reporting objectives to `lph-ads-dashboard-task`.
4. Route client revenue and retention objectives to `lph-subscription-ops-task`.
5. Escalate MySQL, cPanel, infrastructure, and cross-domain dependencies to Engineer.
6. If the work changes CMS behavior, client-site management behavior, or release process, update `programs/lavprishjemmeside/CHANGELOG.md` before handoff.

## Current Routing Rules

1. Start from the essential program docs before reading deeper historical context.
2. Separate control-plane work from remote CMS repo work.
3. Treat enterprise-level CMS improvement requests as platform-governance work first, not just feature ideation.
