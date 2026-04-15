# Cross-Layer Interface Contracts

This document defines the minimum contracts between the four platform layers.

## Design rules

1. The **semantic layer** defines canonical entities and shared vocabulary.
2. The **orchestration layer** may coordinate work, but it must not redefine semantic entities.
3. The **capability layer** exposes services behind stable interfaces that can be reused across orchestrators.
4. The **experience layer** must send enough context for execution while preserving approval boundaries and user intent.

## Semantic to orchestration

The orchestration layer consumes versioned semantic contracts and is responsible for:

- translating an inbound task into executable workflow state
- maintaining step status and dependencies
- deciding whether to continue, retry, or replan

Minimum orchestration inputs:

- `Task`
- selected autonomy mode
- execution constraints
- available capability bindings

Minimum orchestration outputs:

- `Plan`
- ordered or dependency-aware `ExecutionUnit` records
- execution state transitions
- references to produced `Artifact` and `Evaluation` records

## Orchestration to capabilities

The orchestration layer invokes capabilities through stable service contracts.

Required capability categories:

- **memory**: retrieve and persist contextual state
- **evaluation**: score outputs and return pass/fail plus retryability
- **tooling**: execute external integrations such as Git, CI, or ticketing systems
- **repo adapters**: expose existing-repo metadata, constraints, and validation surfaces for brownfield workflows

Required properties for capability calls:

- explicit input payload
- explicit output payload
- trace identifier
- failure mode and retry guidance

### Brownfield repo adapter contract

For existing-repo workflows, the orchestration layer may depend on a repo adapter that provides:

- a repo profile with stable metadata
- working roots and important paths
- protected paths and approval hints
- canonical validation commands
- changed file and CI/PR context

When the repo profile is exchanged as a machine-readable contract, it should conform to `schemas/v1/repo-profile.schema.json`.

## Capabilities to orchestration

Capabilities must return results that are machine-actionable.

At minimum, responses should include:

- `status`
- `evidence`
- `feedback`
- `retryable`
- `trace_id`

The orchestration layer should never infer silent success from an empty response.

## Experience to orchestration

The experience layer is responsible for carrying human intent into the system.

Minimum request contract:

- task description
- acceptance criteria
- constraints
- approval mode or autonomy level
- relevant user and session context
- repo selection or repo profile reference for brownfield execution

## Orchestration to experience

User-facing outputs should expose:

- current plan state
- execution progress
- evaluation outcomes
- promotion readiness
- human decisions required, if any
- brownfield-specific constraints such as protected paths or required approvals when they affect execution

## Traceability and audit

Every cross-layer exchange must be traceable.

Required audit metadata:

- `trace_id`
- `task_id`
- `step_id` when applicable
- actor identity
- timestamp
- contract version

## Replanning boundary

Replanning is an orchestration concern triggered by capability feedback.

Typical triggers:

- non-retryable evaluation failure
- dependency invalidation
- changed constraints or acceptance criteria
- missing capability support

## Promotion boundary

Promotion decisions depend on:

- artifact completeness
- evaluation outcomes
- risk state
- required approvals

The experience layer may present promotion state, but the canonical record should conform to the semantic `Promotion` contract.
