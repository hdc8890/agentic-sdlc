# Capability Layer

The capability layer provides shared services reused across orchestrators.

## Shared capability domains

- memory
- evaluation
- external tool integrations
- brownfield repo adapters

## Contract expectations

Capabilities should expose stable interfaces with:

- explicit inputs and outputs
- trace metadata
- machine-actionable failure semantics

See:

- [`../../docs/specs/interface-contracts.md`](../../docs/specs/interface-contracts.md)
- [`../../docs/specs/evaluation-promotion.md`](../../docs/specs/evaluation-promotion.md)
- [`repo-adapters.md`](repo-adapters.md)
