# Brownfield execution

This document shows how the orchestration layer consumes a brownfield task and repo context to drive execution.

## Purpose

In a brownfield workflow, `task.json` is not executed directly. It is consumed by the orchestration layer together with repo context and execution policy.

The orchestration layer is responsible for:

- validating that the task can run against the target repo
- translating the task into a constrained plan
- creating execution units against real files and commands
- invoking repo-native validation through capabilities
- emitting evaluation and promotion state

## Minimum inputs

At minimum, a brownfield execution run needs:

1. a canonical `Task`
2. a repo profile or repo adapter reference
3. autonomy and approval policy
4. capability bindings for repo inspection, tooling, and evaluation

## Illustrative orchestration envelopes

The following are useful **illustrative** artifacts for a brownfield run:

- `execution-request.json`: the orchestration input envelope
- `execution-session.json`: the execution-layer state record tying inputs to outputs

These are examples of orchestration-facing records. They are not new normative semantic entities.

## Execution flow

1. Load `task.json`.
2. Resolve the repo profile for the target repo.
3. Check working roots, protected paths, and validation commands.
4. Produce `plan.json`.
5. Execute one or more `ExecutionUnit` records.
6. Collect evaluation evidence from repo-native commands.
7. Emit promotion readiness.

## Brownfield-specific checks

Before execution starts, the orchestration layer should confirm:

- the target files are inside allowed working roots
- the requested change does not require protected-path access
- the repo profile exposes suitable validation commands
- the task scope matches the selected autonomy level

## Relationship to examples

See `examples/adapters/existing-repo/` for a concrete meal-planner proof slice showing:

- task intake
- execution request
- execution session
- plan and execution unit records
- evaluation and promotion outputs
