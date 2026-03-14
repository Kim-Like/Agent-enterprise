# Samlino Master Architecture

Parent: `father`

## Owned Program
- `samlino-seo-agent-playground`

## Runtime Model
- Control-plane-hosted routes under `backend/routes/samlino.py`
- Domain services under `backend/system/samlino_service.py`
- Program-local datastore `programs/ian-agency/contexts/samlino/seo-agent-playground/data/samlino.db`
- Runtime modules under `programs/ian-agency/contexts/samlino/seo-agent-playground/runtime/`

## Specialist Set
- `spec.samlino.product_ops`
- `spec.samlino.competitor_research`
- `spec.samlino.keyword_analysis`
- `spec.samlino.content_writer`
- `spec.samlino.content_composer`
- `spec.samlino.content_analyst`
- `spec.samlino.performance_reviewer`
- `spec.samlino.opportunity_explorer`
- `spec.samlino.schema_generator`
- `spec.samlino.prototyper`
- `spec.samlino.seo_auditor`

## Routing Rule
All Samlino objectives must target `programs/ian-agency/contexts/samlino/seo-agent-playground` and delegate using boundary matrix contracts.

## Governance
- Warn-only contract mode is permanent.
- Structured result/escalation packets are mandatory interface targets.
- Engineer is escalation authority for platform and reliability incidents.
