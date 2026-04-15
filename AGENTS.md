# AGENTS.md

## Project overview

This repository defines a **framework-agnostic Agentic SDLC platform**. Its purpose is to standardize how autonomous and semi-autonomous agents participate in software delivery without locking the platform to a single runtime, framework, or UI.

The repo separates:

- **normative platform contracts** that define the shared model
- **layer-specific guidance** for how parts of the system interact
- **reference examples** that prove the model without becoming the standard

If you are editing this repository, optimize for **clarity of the platform contract** over implementation detail.

## Core intent

The intent of this repo is to help multiple orchestration systems, capability services, and user-facing experiences interoperate through one shared semantic model.

That means:

- do not redefine core entities in framework-specific terms
- do not turn an example implementation into the platform standard
- keep evaluation, traceability, and promotion semantics explicit
- preserve the separation between normative specs and illustrative examples

## Start here

Before making changes, read these files in order:

1. `README.md`
2. `docs/specs/agentic-sdlc-v1.md`
3. `docs/architecture/layers-overview.md`
4. `docs/architecture/brownfield-integration.md`
5. `docs/roadmap/README.md`
6. `docs/specs/interface-contracts.md`
7. `docs/specs/evaluation-promotion.md`
8. `docs/specs/versioning.md`
9. `governance/conformance.md`

## Repository map

### Root files

- `README.md`: human entrypoint for what the platform is and how the repo is organized.
- `AGENTS.md`: agent-oriented working context and instructions.

### `docs/`

Human-readable design and decision material.

- `docs/strategy/`: why this platform exists and how it aligns multiple parallel efforts.
- `docs/specs/`: **normative** specifications. Treat these as the source of truth for shared concepts and contracts.
- `docs/architecture/`: explanatory architecture and end-to-end flow descriptions.
- `docs/decisions/`: architecture decision records and tradeoffs.
- `docs/roadmap/`: versioned planning artifacts, rollout plans, and reusable iteration templates.

### `layers/`

Implementation-facing guidance grouped by platform layer.

- `layers/semantic/`: canonical entities, schema guidance, and contract meaning.
- `layers/orchestration/`: workflow coordination boundaries, retries, and replanning concerns.
- `layers/capabilities/`: reusable shared services such as memory, evaluation, and tool integrations.
- `layers/experience/`: CLI, UI, and developer workflow integration points.

These directories explain responsibilities; they do **not** override the specs in `docs/specs/`.

### `schemas/`

Machine-readable contracts. These are **normative**.

- `schemas/v1/`: the current versioned JSON schemas for `Task`, `Plan`, `ExecutionUnit`, `Artifact`, `Evaluation`, `Memory`, and `Promotion`.

If you change a semantic contract, make the matching schema change here.

### `examples/`

Illustrative implementations and payloads. These are **not** the standard unless a file explicitly says otherwise.

- `examples/reference-flow/`: a thin end-to-end example showing task ingestion through promotion using the `v1` contracts.
- `examples/adapters/`: brownfield and framework-specific adapters that demonstrate conformance.

### `governance/`

Rules for how the platform evolves.

- `governance/conformance.md`: minimum requirements for claiming compatibility with the platform.
- `governance/working-group.md`: ownership and review model for the shared contracts.

## Working rules for agents

### 1. Preserve the hybrid repository structure

Do not collapse this repo into only layer folders. The semantic layer is partly specification and governance, so top-level docs and schemas must remain easy to discover.

### 2. Treat specs and schemas as canonical

When there is tension between an example and a spec, prefer the spec. Update examples to match the contract, not the other way around.

### 3. Keep normative and illustrative content aligned

If you change:

- `docs/specs/`, also check `schemas/`, `examples/`, and relevant `layers/` READMEs
- `schemas/`, also check the matching spec and example payloads
- `governance/`, also check whether README or specs need updated conformance guidance
- `docs/roadmap/`, also check whether README and AGENTS should reference the new planning artifact

### 4. Avoid framework lock-in

Do not introduce language that makes LangGraph, AutoGen, Microsoft tooling, or any custom runtime appear to be the required implementation model.

### 5. Keep evaluation and auditability explicit

Do not hide failure semantics behind vague success language. Evaluation results should remain machine-actionable, traceable, and usable for retry, replanning, and promotion decisions.

### 6. Respect versioning

This repo uses versioned contracts.

- breaking semantic changes require a new major version
- additive non-breaking changes are minor
- wording and example fixes are patch-level

Do not silently change the meaning of an existing `v1` field.

## Change guidance

### When adding a new concept

Add it in the narrowest correct place:

- shared semantic entity or contract: `docs/specs/` and `schemas/`
- roadmap, rollout, or iteration planning: `docs/roadmap/`
- layer-specific guidance: `layers/`
- explanatory rationale: `docs/architecture/` or `docs/decisions/`
- example flow or adapter: `examples/`
- compatibility or ownership rule: `governance/`

### When changing schemas

Make sure:

1. the human-readable spec says the same thing as the schema
2. example payloads still conform
3. versioning expectations remain correct
4. conformance guidance still makes sense

### When adding examples

Label examples clearly as examples. They should demonstrate conformance and good patterns, but they should not redefine the platform.

## Validation guidance

This repo currently does not define a full application build or test pipeline. For most changes, validate by checking consistency across docs, schemas, and examples.

Useful lightweight validation:

- ensure JSON files in `schemas/` and `examples/` parse correctly
- ensure README and spec links still point to valid files
- ensure examples reference the correct schema version
- ensure new text is consistent with `governance/conformance.md`

## Preferred editing behavior

- Keep changes precise and structural.
- Prefer updating existing canonical docs over creating duplicate explanations.
- Use the existing four-layer model consistently: semantic, orchestration, capabilities, experience.
- Keep the repo understandable to both humans and agents reading it for the first time.

## Non-goals

Do not use this repo to:

- prescribe a single orchestration framework
- bury the semantic layer inside implementation-specific folders
- present examples as mandatory platform behavior
- weaken evaluation, traceability, or promotion semantics for convenience
