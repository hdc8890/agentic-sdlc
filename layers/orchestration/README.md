# Orchestration Layer

The orchestration layer coordinates workflow execution against the semantic model.

## Responsibilities

- plan decomposition and refinement
- execution state management
- retries and replanning
- coordination of capability calls
- honoring repo adapter constraints during brownfield execution

## Contract boundary

The orchestration layer consumes semantic contracts and capability interfaces but must not redefine platform entities.

See [`../../docs/specs/interface-contracts.md`](../../docs/specs/interface-contracts.md).

## Brownfield execution

For an existing-repo workflow, the orchestration layer is the component that consumes:

- a `Task`
- a repo profile or repo adapter reference
- execution policy such as autonomy mode and allowed capabilities

It then produces and coordinates:

- a `Plan`
- one or more `ExecutionUnit` records
- evaluation evidence and promotion readiness

See [`brownfield-execution.md`](brownfield-execution.md).
