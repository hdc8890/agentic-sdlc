# Brownfield integration

This document explains how the Agentic SDLC platform integrates with an **existing repository**.

## Core idea

The platform does not replace the target repository's code layout, CI pipeline, PR workflow, or validation commands. Instead, it layers planning, execution tracking, evaluation aggregation, and promotion semantics on top of repo-native workflows.

## System boundary

### Existing repository remains authoritative for

- source code and file layout
- package and dependency configuration
- test, lint, and build commands
- CI execution
- pull request and merge process

### Agentic SDLC platform adds

- task intake
- plan construction
- execution-unit tracking
- evaluation aggregation
- promotion state
- cross-layer traceability

## Brownfield flow

1. The experience layer submits a task plus repo context.
2. The orchestration layer inspects the target repo through a repo adapter.
3. The orchestration layer builds a plan constrained by existing files, commands, and protected paths.
4. Execution units operate within those repo constraints.
5. Repo-native commands and CI results are collected as evaluation evidence.
6. Promotion state reflects the repo's actual PR and approval model.

In practice, this means the orchestration layer consumes `task.json` plus repo profile context and turns them into a plan, execution units, and evaluation-ready outputs.

## Repo adapter role

The repo adapter is the capability-layer boundary between the platform and the target repository.

It should provide:

- repo metadata
- important directories and protected paths
- canonical validation commands
- changed file inspection
- CI and PR context
- ownership and approval hints

## Evaluation in brownfield mode

Evaluation should prefer evidence from repo-native systems when available.

Examples:

- local test or lint commands
- CI run results
- code ownership or approval requirements
- policy checks tied to the repo

The platform should translate that evidence into canonical `Evaluation` and `Promotion` records without inventing a parallel source of truth.

## Brownfield constraints

The integration model must handle:

- incomplete or legacy test coverage
- repo-specific conventions
- protected directories
- partial ownership across teams
- uneven automation maturity

These constraints should be explicit in planning and evaluation rather than treated as hidden failures.

## What this architecture avoids

- requiring an existing repo to adopt the four-layer directory structure
- forcing one orchestration runtime
- redefining repo-native validation semantics
