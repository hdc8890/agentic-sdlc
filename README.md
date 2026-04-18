# Agentic SDLC Platform

A framework for integrating AI-driven workflows into existing engineering teams. The platform connects your repositories to orchestration and memory services through a lightweight `.agentic/` configuration directory — without replacing your existing build, test, CI, or PR workflows.

## How teams adopt this

Each team adds two files to their repo:

```
your-repo/
  .agentic/
    profile.json   # Describes your repo: commands, ecosystems, protected paths
    policy.json    # Controls autonomy level and human review requirements
```

The platform reads these files before doing anything in your repo. If they don't exist, nothing runs.

**Get started:** [Team Onboarding Guide](docs/onboarding/team-onboarding.md)

## Tools

| Tool | What it does |
|---|---|
| [`agentic` CLI](cli/README.md) | Scaffold `.agentic/`, auto-detect repo context, validate contracts |
| [GitHub Action](action/README.md) | CI-driven onboarding and validation — no global install needed |

```bash
# Onboard a repo in three commands
npm install -g @agentic-sdlc/cli
agentic init && agentic profile --generate
agentic validate
```

## Platform architecture

```
┌─────────────────────────────────────────────────────┐
│  agentic-sdlc (this repo)                           │
│  Publishes: CLI, GitHub Action, contracts           │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Team A repo      Team B repo    Team C repo
 .agentic/        .agentic/      .agentic/
 profile.json     profile.json   profile.json
 policy.json      policy.json    policy.json
        │              │              │
        └──────────────┼──────────────┘
                       ▼
         ┌─────────────────────────┐
         │  Platform services      │
         │  ├─ Orchestration engine│
         │  └─ Memory service      │
         └─────────────────────────┘
```

The orchestration engine and memory service are separate deployments. This repo defines the contracts they consume and the tools teams use to produce valid configuration.

## Repository layout

```
/
  README.md
  AGENTS.md
  cli/                    # agentic CLI source
  action/                 # GitHub Action source
  contracts/
    v1/                   # Versioned JSON schemas (the contracts)
  docs/
    onboarding/           # Team adoption guide
    architecture/         # Layer model, brownfield integration
    decisions/            # Architecture decision records
  examples/
    onboarded-repo/       # What a real .agentic/ looks like after onboarding
  governance/             # Ownership and working group
```

## Contracts

All versioned contracts live in [`contracts/v1/`](contracts/v1/):

| Contract | Purpose |
|---|---|
| `profile.schema.json` | Repo identity, commands, ecosystems, protected paths |
| `policy.schema.json` | Autonomy level, human review requirements, per-task overrides |
| `task.schema.json` | Work item flowing into the orchestration engine |
| `plan.schema.json` | Decomposed execution steps for a task |
| `execution-unit.schema.json` | Single step of a plan being executed |
| `artifact.schema.json` | Output produced by an execution step |
| `evaluation.schema.json` | Pass/fail evidence for an artifact |
| `promotion.schema.json` | Promotion readiness state through PR/merge stages |
| `memory.schema.json` | Context stored and retrieved by the memory service |

## Layer model

The platform uses four layers. Only the first two are needed for initial adoption:

- **Semantic** — shared vocabulary: Task, Plan, ExecutionUnit, Artifact, Evaluation, Memory, Promotion
- **Orchestration** — executes plans, manages retries, coordinates capability services
- **Capabilities** — memory, evaluation, and tool services used by the orchestrator
- **Experience** — CLI, GitHub Action, and developer-facing surfaces (this repo)

See [`docs/architecture/layers-overview.md`](docs/architecture/layers-overview.md) for detail.

## Governance

See [`governance/`](governance/) for the working group model and ownership structure.
