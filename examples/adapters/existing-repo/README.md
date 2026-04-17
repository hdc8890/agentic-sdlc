# Existing repo adapter example

This example uses **`meal-planner`** as the first concrete brownfield target.

`meal-planner` is an existing repository with:

- a Rust backend managed with Cargo
- a Vite/React frontend under `frontend/`
- GitHub-hosted source control and workflows
- repo-native validation commands across multiple ecosystems

## Scope

The example is intentionally narrow:

1. describe the target repo with a `repo-profile`
2. expose safe working roots and protected areas
3. capture repo-native validation commands
4. provide enough context for planning and promotion decisions

## Files

- `repo-profile.example.json`
- `task.json`
- `execution-request.json`
- `execution-session.json`
- `plan.json`
- `execution-unit.json`
- `artifact.json`
- `evaluation.json`
- `promotion.json`

## Why this example exists

The greenfield reference flow proves the clean semantic model. This example proves that the same model can be applied to a real repo that already has its own structure, tooling, and workflow boundaries.

## Notes

- The profile is based on the current observed structure of `meal-planner`.
- It is still an **example**, not a claim that every brownfield repo should look like this.
- Some governance values, such as exact required approvals or required checks, are intentionally left minimal unless they are directly visible in the target repo.

## Proof slice

The current proof slice models a bounded frontend task in `meal-planner`:

- target file: `frontend/src/routes/shopping-list/index.tsx`
- task: improve the shopping-list empty state so it directs users to generate a meal plan
- execution request: consume `task.json` with the meal-planner repo profile and brownfield execution policy
- validation: repo-native lint, build, and test commands represented through the repo profile

This gives the repository one concrete brownfield path from task intake through promotion readiness.
