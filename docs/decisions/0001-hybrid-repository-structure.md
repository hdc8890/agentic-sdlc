# ADR 0001: Hybrid repository structure

## Status

Accepted

## Context

The repository began as a small collection of strategy and specification documents. As the Agentic SDLC platform evolves, it needs room for layer-specific material, schemas, examples, and governance without losing clarity about which artifacts are normative.

## Decision

Use a hybrid repository structure with:

- top-level orientation in `README.md`
- normative docs under `docs/specs/`
- strategy material under `docs/strategy/`
- implementation-facing material grouped by layer under `layers/`
- machine-readable contracts under `schemas/`
- reference implementations under `examples/`
- governance material under `governance/`

## Consequences

### Positive

- The semantic layer remains easy to discover.
- Examples stay separate from the standard.
- Cross-cutting governance and schemas have a clear home.

### Negative

- The repository is slightly more complex than a single-folder-per-layer design.
- Some concepts appear in both explanatory docs and machine-readable contracts and must be kept aligned.
