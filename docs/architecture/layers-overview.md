# Layers Overview

The platform is organized around four layers that share one semantic contract.

## Layer responsibilities

| Layer | Role | Owns |
| --- | --- | --- |
| Semantic | shared language and contracts | entities, schemas, versioning |
| Orchestration | workflow coordination | state transitions, retries, replanning |
| Capabilities | reusable services | memory, evaluation, external tools |
| Experience | human-facing integration | CLI, UI, developer workflows |

## End-to-end flow

1. The experience layer submits a task and operating constraints.
2. The orchestration layer creates or updates a plan.
3. The orchestration layer invokes capabilities to execute work and gather context.
4. The capability layer returns evidence and evaluation outcomes.
5. The orchestration layer decides to continue, retry, replan, or block.
6. The experience layer presents progress and promotion readiness.

## Why the repo uses a hybrid structure

The semantic layer is partly specification and governance, not only implementation code. That is why the repository keeps normative documents and shared schemas visible at the top level while still grouping implementation-facing material by layer.

## Architectural constraints

- The semantic layer remains the source of truth.
- Capability services are reusable across orchestrators.
- Reference implementations must conform to the shared contracts instead of redefining them.
- Evaluation and auditability are mandatory parts of the model, not optional add-ons.
