# Brownfield adoption plan

## Objective

Make the Agentic SDLC platform usable with **existing repositories** without requiring those repos to adopt a new structure or runtime model.

## Why this matters

Greenfield examples are useful for clarity, but adoption will happen in repos that already have:

- existing code layouts
- repo-native test, lint, and build commands
- CI and PR workflows
- ownership boundaries
- architectural constraints

The platform should wrap and coordinate those realities rather than replacing them.

## Guiding principles

1. **Brownfield first**
   - existing repos are the primary adoption path
2. **Repo is system of record**
   - code, tests, CI, and PRs remain native to the repo
3. **Shared contracts on top**
   - the platform adds planning, evaluation, traceability, and promotion semantics
4. **Vertical-slice growth**
   - expand layer guidance only from proven brownfield examples

## Planned phases

### Phase 1: Planning foundations

- create a permanent roadmap area in the repo
- add a reusable iteration planning template
- document the brownfield integration architecture

### Phase 2: Brownfield capability model

- define repo adapter guidance
- define a repo profile contract for machine-readable repo context
- document how evaluation consumes repo-native validation results

### Phase 3: Existing-repo reference example

- create one example adapter for an existing repository
- show one bounded change from task through promotion state
- demonstrate repo inspection, constrained execution, and repo-native evaluation

Initial target:

- `meal-planner`, a brownfield repo with a Rust backend, a Vite/React frontend, GitHub workflows, and repo-native Cargo/npm validation commands

### Phase 4: Layer backfill

- update orchestration, capabilities, and experience guidance based on what the example proves
- avoid speculative layer content that lacks a concrete motivating example

## Success criteria

- a target repo can be described with a stable repo profile
- planning can reference existing files and repo constraints
- evaluation can aggregate repo-native checks into platform evaluation records
- promotion state can reflect repo-native PR and approval workflows

## Deliverables

- `docs/architecture/brownfield-integration.md`
- `layers/capabilities/repo-adapters.md`
- `schemas/v1/repo-profile.schema.json`
- `examples/adapters/existing-repo/README.md`
- `examples/adapters/existing-repo/repo-profile.example.json`

## Risks

- over-generalizing before proving the first repo adapter
- turning repo-specific conventions into platform-wide rules
- duplicating repo-native metadata in ways that drift from the source system

## Decision log

- Planning artifacts live in `docs/roadmap/`.
- The greenfield reference flow remains, but brownfield adoption is now the primary expansion path.
