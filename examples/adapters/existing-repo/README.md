# Existing repo adapter example

This example shows how the platform can describe and work with an **existing repository**.

It is intentionally narrow:

1. describe a target repo with a `repo-profile`
2. plan a bounded change against existing files
3. use repo-native validation commands
4. reflect readiness through platform evaluation and promotion records

## Why this example exists

The greenfield reference flow proves the clean semantic model. This example proves how the same model can be applied to a repo that already has:

- its own file layout
- its own test and build commands
- its own CI and PR process

## Files

- `repo-profile.example.json`

## Example use

The adapter profile can be used by an orchestration layer to:

- discover safe working roots
- avoid protected paths
- run canonical repo validation commands
- understand PR and CI requirements before promotion
