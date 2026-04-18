# Agentic SDLC Platform

A framework for integrating AI-driven workflows into existing engineering teams. The platform organizes work around **domains** — bounded business areas that often span multiple repositories — and connects them to orchestration and memory services through a lightweight `.agentic/` configuration directory, without replacing your existing build, test, CI, or PR workflows.

## How teams adopt this

Adoption starts with **domain onboarding** — a collaborative process that captures tribal knowledge, maps repositories, and establishes cross-repo dependencies. Each domain produces a domain contract and per-repo configuration:

```
your-repo/
  .agentic/
    profile.json   # Describes your repo: commands, ecosystems, protected paths
    policy.json    # Controls autonomy level and human review requirements
```

The platform reads these files before doing anything in your repo. If they don't exist, nothing runs.

### Human onboarding

Follow the step-by-step guide to install the CLI, scaffold configuration, and tune it with your team.

**→ [Team Onboarding Guide](docs/onboarding/team-onboarding.md)**

### AI agent onboarding

If you have an AI coding agent (Copilot, Cursor, Cline, etc.), you can have it handle the entire onboarding. Copy and paste this prompt to your agent:

> Onboard this repository to the Agentic SDLC platform. Read the agent onboarding guide at `docs/onboarding/agent-onboarding.md` in the [agentic-sdlc repo](https://github.com/hdc8890/agentic-sdlc) and follow every step. Install the `@agentic-sdlc/cli`, scaffold `.agentic/`, auto-detect the repo profile, review and tune the generated files, then validate and commit. Do not guess the GitHub org, notification channels, or protected paths — ask me if you're unsure.

That's it. The agent guide has the exact steps, schemas, decision logic, and stop conditions your agent needs.

**→ [Agent Onboarding Guide](docs/onboarding/agent-onboarding.md)**

## CLI

The [`agentic` CLI](cli/README.md) helps teams scaffold, discover, and validate `.agentic/` configuration during the onboarding process.

```bash
npm install -g @agentic-sdlc/cli

agentic init                  # Scaffold .agentic/ with starter files
agentic profile --generate    # Auto-detect ecosystems, commands, protected paths
agentic validate              # Validate against the contracts
agentic status                # Show current configuration
```

## Platform architecture

The platform moves work from human intent through to shipped code. Each phase boundary is defined by a contract. Domains are the primary unit — a domain groups related repos and captures shared context like cross-repo dependencies, deployment order, and tribal knowledge.

**[End-to-end flow →](docs/architecture/end-to-end-flow.md)** — Full pipeline: Intake → Triage → Planning → Execution → Evaluation → Promotion → Completion

**[Autonomy levels →](docs/architecture/autonomy-levels.md)** — Concrete definitions for assistive, semi-autonomous, bounded-autonomous, and fully-autonomous with gate matrices

```
  JIRA / GH Issues / Slack / API
            │
      ┌─────▼──────┐
      │   Intake    │  → Task contract (normalized, with source traceability)
      └─────┬──────┘
      ┌─────▼──────┐
      │   Triage    │  → Task (enriched: resolved_autonomy_level from policy)
      └─────┬──────┘
      ┌─────▼──────┐
      │  Planning   │  → Plan contract   ← GATE (depends on autonomy level)
      └─────┬──────┘
      ┌─────▼──────┐
      │ Execution   │  → ExecutionUnit + Artifact contracts
      └─────┬──────┘
      ┌─────▼──────┐
      │ Evaluation  │  → Evaluation contract   ← GATE on failure (all levels)
      └─────┬──────┘
      ┌─────▼──────┐
      │ Promotion   │  → PR → Review → Merge   ← GATE (depends on autonomy level)
      └─────┬──────┘
      ┌─────▼──────┐
      │ Completion  │  → Memory updated, source system synced
      └────────────┘
```

## Repository layout

```
/
  README.md
  AGENTS.md
  cli/                    # agentic CLI source
  contracts/
    v1/                   # Versioned JSON schemas (the contracts)
  docs/
    onboarding/           # Team adoption guide
    architecture/         # End-to-end flow, autonomy levels, layer model
  examples/
    onboarded-repo/       # What a real .agentic/ looks like after onboarding
  governance/             # Ownership and working group
```

## Contracts

All versioned contracts live in [`contracts/v1/`](contracts/v1/):

| Contract | Purpose |
|---|---|
| `domain.schema.json` | Domain identity: repos, cross-repo dependencies, ownership, tribal knowledge |
| `profile.schema.json` | Repo identity, commands, ecosystems, protected paths |
| `policy.schema.json` | Autonomy level, human review requirements, per-task overrides |
| `task.schema.json` | Work item with source traceability and resolved autonomy level |
| `plan.schema.json` | Decomposed execution steps for a task |
| `execution-unit.schema.json` | Single step of a plan being executed |
| `artifact.schema.json` | Output produced by an execution step |
| `evaluation.schema.json` | Pass/fail evidence for an artifact |
| `promotion.schema.json` | Promotion readiness state with evaluation references |
| `memory.schema.json` | Context stored and retrieved by the memory service |

## Layer model

The platform uses four layers. Only the first two are needed for initial adoption:

- **Semantic** — shared vocabulary: Task, Plan, ExecutionUnit, Artifact, Evaluation, Memory, Promotion
- **Orchestration** — executes plans, manages retries, coordinates capability services
- **Capabilities** — memory, evaluation, and tool services used by the orchestrator
- **Experience** — CLI and developer-facing surfaces (this repo)

See [`docs/architecture/layers-overview.md`](docs/architecture/layers-overview.md) for detail.

## Governance

See [`governance/`](governance/) for the working group model and ownership structure.
