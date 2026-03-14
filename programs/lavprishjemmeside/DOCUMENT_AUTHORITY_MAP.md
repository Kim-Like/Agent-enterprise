# Document Authority Map

This file classifies the Markdown surfaces inside `programs/lavprishjemmeside/` so a handoff agent can tell what is execution authority and what is only context.

## Canonical Execution Docs

- `README.md`
- `PROJECT_CONTEXT.md`
- `CHANGELOG.md`
- `EXTERNAL_AGENT_INSTRUCTIONS.md`
- `EXTERNAL_AGENT_PROMPT.md`
- `requirements.md`
- `design.md`
- `tasks.md`
- `CPANEL_HANDOFF_CONTRACT.md`
- `OUTSIDE_FOLDER_DEPENDENCIES.md`
- `ROLLBACK_AND_REPAIR.md`
- `BRAND_VISION.md`

## Internal / Operator Reference Docs

- `introduction.md`
- `techstack.md`
- `developer.md`
- `cms/README.md`
- `client-sites/lavprishjemmeside.dk/README.md`
- `client-sites/ljdesignstudio.dk/README.md`
- `local-mirror/README.md`
- `local-mirror/docs/README.md`
- `local-mirror/docs/SSH_FIRST_OPERATIONS.md`
- `local-mirror/docs/UPSTREAM_UPDATES.md`
- `local-mirror/docs/ROLLOUT_MANUAL.md`
- `local-mirror/docs/DEPLOY_NEW_DOMAIN.md`
- `local-mirror/docs/DEPLOY_HEALTHCHECK.md`
- `local-mirror/docs/SCHEMA_OVERVIEW.md`
- `local-mirror/docs/CLIENT_ASSISTANT_ARCHITECTURE.md`

These are trusted reference surfaces but are not the execution authority for the external sprint.

## Reference Specs And Strategy Docs

- `local-mirror/docs/COMPREHENSIVE_PLAN.md`
- `local-mirror/docs/MULTI_DOMAIN_CMS_PLAN.md`
- `local-mirror/docs/COMPONENT_LIBRARY_AND_DESIGN_SYSTEM_SPEC.md`
- `local-mirror/docs/SHOPPING_MODULE_PLAN.md`
- `local-mirror/docs/PEXELS_AUTOMATION_PLAN.md`
- `local-mirror/docs/COMPONENT_EDITOR.md`
- `local-mirror/docs/Future_implementations.md`
- `local-mirror/docs/ADMIN_DASHBOARD_UI_IMPLEMENTATION_GUIDE.md`
- `local-mirror/docs/CLAUDE_CODE_INTEGRATION.md`
- `local-mirror/docs/MUST_READ.md`
- `local-mirror/docs/VISUAL_PAGE_BUILDER_SPEC.md`

These may contain useful implementation detail, but they must not override the canonical in-folder trilogy or the root handoff contract.

## Generated / Library Documentation

- `local-mirror/api/Schema_markup.md`
- `local-mirror/api/src/component-docs/*.md`
- `local-mirror/api/src/content/*.md`
- `local-mirror/src/components/custom/README.md`

These explain components, schema, or generated content. They are not the sprint authority.

## Historical / Archival Task Docs

- `local-mirror/tasks/README.md`
- `local-mirror/tasks/cms/INDEX.md`
- `local-mirror/tasks/cms/BRAND_VISION.md`
- `local-mirror/tasks/cms/completed/*.md`
- `local-mirror/tasks/*/INDEX.md`

These retain task history or workflow context. They are not current sprint authority.
