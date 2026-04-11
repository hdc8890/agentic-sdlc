# Orchestration Layer

The orchestration layer coordinates workflow execution against the semantic model.

## Responsibilities

- plan decomposition and refinement
- execution state management
- retries and replanning
- coordination of capability calls

## Contract boundary

The orchestration layer consumes semantic contracts and capability interfaces but must not redefine platform entities.

See [`../../docs/specs/interface-contracts.md`](../../docs/specs/interface-contracts.md).
