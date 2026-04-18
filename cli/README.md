# Agentic SDLC CLI

The `agentic` CLI is how teams onboard their repositories to the Agentic SDLC framework. It generates the `.agentic/` configuration directory, validates contracts, and bridges repos to the platform services.

## Installation

```bash
npm install -g @agentic-sdlc/cli
```

See the [Team Onboarding Guide](../docs/onboarding/team-onboarding.md) for the full adoption walkthrough.

## Commands

### `agentic init`

Scaffold `.agentic/` in the current repository with a starter profile and policy.

```bash
agentic init
agentic init --autonomy assistive    # Start conservative
agentic init --dry-run               # Preview without writing
```

Creates:
- `.agentic/profile.json` — repo identity, commands, and constraints
- `.agentic/policy.json` — autonomy level and human review requirements

### `agentic profile --generate`

Auto-discover repo context and update `.agentic/profile.json`.

```bash
agentic profile --generate
agentic profile --generate --dry-run   # Preview discovered values
```

Detects: package managers, test/lint/build commands, protected paths from CODEOWNERS, and CI configuration.

### `agentic validate`

Validate `.agentic/` files against the versioned contracts.

```bash
agentic validate
agentic validate --dir /path/to/repo
```

Exits non-zero if any required files are invalid. Safe to use as a CI gate.

### `agentic status`

Show the current Agentic SDLC configuration and active task status.

```bash
agentic status
```

## What gets created in your repo

```
your-repo/
  .agentic/
    profile.json    # Describes the repo: commands, ecosystems, protected paths
    policy.json     # Controls autonomy level, review requirements, auto-merge
```

These files should be committed to version control. The orchestration engine fetches them when planning and executing tasks for this repository.

## Development

```bash
cd cli/
npm install
npm run build
npm run dev -- init --dry-run
```
