# Reference Flow Example

This example demonstrates a thin end-to-end flow against the `v1` contracts.

## Scope

The flow shows:

1. task ingestion
2. plan creation
3. execution of one step
4. evaluation of produced artifacts
5. promotion readiness

It is an example of conformance, not a prescribed implementation.

## Files

- `task.json`
- `plan.json`
- `execution-unit.json`
- `artifact.json`
- `evaluation.json`
- `promotion.json`

## Flow summary

1. A docs task is submitted with acceptance criteria and constraints.
2. The orchestration layer creates a small plan with one executable step.
3. The execution unit produces a documentation artifact.
4. Evaluation records passing evidence and low residual risk.
5. Promotion is marked ready for PR with no blocking issues.
