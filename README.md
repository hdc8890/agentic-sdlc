# Agentic SDLC Platform

This repository defines a **framework-agnostic Agentic SDLC model** and the supporting contracts needed for autonomous and semi-autonomous systems to participate in software delivery.

It is organized to keep three things separate:

1. **Normative platform contracts**: the shared semantic model and versioned schemas.
2. **Layer-specific guidance**: orchestration, capabilities, and experience boundaries.
3. **Reference implementations**: examples that prove the model without becoming the standard.

## Start here

- Platform strategy: [`docs/strategy/platform-alignment.md`](docs/strategy/platform-alignment.md)
- Core spec: [`docs/specs/agentic-sdlc-v1.md`](docs/specs/agentic-sdlc-v1.md)
- Layer interaction overview: [`docs/architecture/layers-overview.md`](docs/architecture/layers-overview.md)
- Cross-layer contracts: [`docs/specs/interface-contracts.md`](docs/specs/interface-contracts.md)
- Evaluation and promotion model: [`docs/specs/evaluation-promotion.md`](docs/specs/evaluation-promotion.md)
- Governance and conformance: [`governance/README.md`](governance/README.md)
- Reference flow example: [`examples/reference-flow/README.md`](examples/reference-flow/README.md)

## Repository layout

```text
/
  README.md
  docs/
    strategy/
    specs/
    architecture/
    decisions/
  layers/
    semantic/
    orchestration/
    capabilities/
    experience/
  schemas/
    v1/
  examples/
    reference-flow/
    adapters/
  governance/
```

## Layer model

### Semantic

Defines the shared language of the platform: `Task`, `Plan`, `ExecutionUnit`, `Artifact`, `Evaluation`, `Memory`, and `Promotion`.

### Orchestration

Executes workflows, manages state transitions, coordinates retries, and determines when replanning is required.

### Capabilities

Provides shared services such as memory, evaluation, and tool integrations.

### Experience

Defines how human users and developer-facing surfaces interact with the platform through CLIs, UIs, and workflows.

## What this repo is not

- It is **not** a mandate for a single orchestration framework.
- It is **not** a production implementation of every layer.
- It is **not** a UI specification.

## Near-term direction

The current focus is to:

1. stabilize the semantic layer as versioned contracts
2. define the interfaces between layers
3. add one thin end-to-end reference flow
4. establish governance for compatibility and evolution
