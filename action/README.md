# Agentic SDLC GitHub Action

A GitHub Action that onboards your repository to the Agentic SDLC framework and keeps its `.agentic/` configuration valid.

## Commands

| Command | What it does |
|---|---|
| `validate` (default) | Validates `.agentic/profile.json` and `policy.json` against the versioned contracts. Fails the job if invalid. |
| `profile-generate` | Inspects the repo and writes `.agentic/profile.json`. Detects ecosystems, commands, CODEOWNERS paths, and CI workflows. |
| `onboard` | Generates profile + policy, then opens a PR for the team to review. Requires `repo_token`. |

## Usage

### 1. Validate on every push to `.agentic/`

Add this to any repo that has already been onboarded:

```yaml
# .github/workflows/agentic-validate.yml
name: Agentic SDLC Validate

on:
  push:
    paths:
      - '.agentic/**'
  pull_request:
    paths:
      - '.agentic/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/agentic-sdlc@v1
        # command defaults to 'validate'
```

### 2. Onboard a new repository

Trigger manually once. The action inspects the repo, generates `.agentic/profile.json` and `policy.json`, and opens a PR for the team to review.

```yaml
# .github/workflows/agentic-onboard.yml
name: Agentic SDLC Onboard

on:
  workflow_dispatch:
    inputs:
      autonomy_level:
        description: 'Autonomy level'
        required: false
        default: 'semi_autonomous'
        type: choice
        options:
          - assistive
          - semi_autonomous
          - bounded_autonomous
          - fully_autonomous

jobs:
  onboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/agentic-sdlc@v1
        with:
          command: onboard
          autonomy_level: ${{ inputs.autonomy_level || 'semi_autonomous' }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Re-detect profile when repo structure changes

```yaml
# .github/workflows/agentic-profile-refresh.yml
name: Refresh Agentic Profile

on:
  push:
    paths:
      - 'package.json'
      - 'Cargo.toml'
      - 'go.mod'
      - 'pyproject.toml'
      - '.github/CODEOWNERS'
      - '.github/workflows/**'

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/agentic-sdlc@v1
        id: profile
        with:
          command: profile-generate

      - name: Commit updated profile
        if: steps.profile.outputs.profile_generated == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .agentic/profile.json
          git diff --staged --quiet || git commit -m "chore: refresh .agentic/profile.json"
          git push
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `command` | No | `validate` | `validate`, `profile-generate`, or `onboard` |
| `autonomy_level` | No | `semi_autonomous` | For `onboard` only. Sets initial autonomy in `policy.json`. |
| `repo_token` | No | — | GitHub token for `onboard` PR creation. Use `secrets.GITHUB_TOKEN`. |

## Outputs

| Output | Description |
|---|---|
| `validation_passed` | `true` if all `.agentic/` files passed validation |
| `profile_generated` | `true` if `.agentic/profile.json` was written |
| `profile_path` | Absolute path to `.agentic/profile.json` |

## What the action detects

**Ecosystems:** Node.js, Rust, Python, Go, Java (Maven/Gradle), Ruby, .NET

**Commands:** Read from `package.json` scripts, inferred from ecosystem conventions (`cargo test`, `pytest`, `go test ./...`, etc.)

**Protected paths:** Always includes `.github/workflows/**`. Adds any paths from `CODEOWNERS` (checks root, `.github/`, and `docs/`).

**CI checks:** Reads `.github/workflows/` and extracts job names as candidate required checks.

**Working roots:** Detects `packages/`, `apps/`, `services/`, `frontend/`, `backend/`, `api/`, `web/`. For mixed-ecosystem repos (e.g. Rust + Node), also checks for a frontend subdirectory with `package.json`.

## Development

```bash
cd action/
npm install
npm run build   # produces dist/index.js — commit this
```

The `dist/index.js` is committed to the repo so the action runs without a build step in CI.

