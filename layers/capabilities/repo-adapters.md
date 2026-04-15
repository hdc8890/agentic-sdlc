# Repo adapters

Repo adapters let the platform work against **existing repositories**.

They are capability-layer integrations that expose enough repo context for planning, execution, evaluation, and promotion without redefining the repo's own workflow.

## Responsibilities

A repo adapter should provide:

- repository identity and metadata
- important working directories
- protected paths and ownership boundaries
- canonical test, lint, and build commands
- changed file inspection
- CI and PR context
- approval requirements when they can be inferred

## Design rules

1. Prefer repo-native sources of truth.
2. Return machine-actionable payloads.
3. Make protected areas explicit.
4. Do not hide missing metadata behind success-shaped defaults.

## Minimum adapter surfaces

### Repo profile

Static or slowly changing information about the repo, such as:

- repository name
- primary language or ecosystems
- working roots
- protected paths
- validation commands
- PR and CI providers

### Repo state

Current execution context, such as:

- branch or ref
- changed files
- open PR or issue linkage
- latest CI status

### Validation hooks

The commands or external checks the platform can invoke or read:

- test
- lint
- build
- policy or quality gates

## Relationship to schemas

If a repo adapter needs to persist or exchange stable machine-readable repo metadata, it should use the `repo-profile` schema under `schemas/v1/`.

## Relationship to examples

See `examples/adapters/existing-repo/` for a minimal example of how a brownfield adapter can describe an existing repository without becoming the platform standard.
