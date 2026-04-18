# End-to-end flow

This document describes the full pipeline from the moment a human creates a work request through to the shipped output. Every phase boundary is marked by a contract from `contracts/v1/`. Human gates are determined by the domain's autonomy level (see [autonomy-levels.md](./autonomy-levels.md)).

## Key concepts

**Domain**: The primary unit of onboarding. A domain is a bounded area of the business (e.g., "Payments", "Identity", "Notifications") that typically spans multiple repositories. Domains carry their own tribal knowledge, cross-repo dependencies, and ownership. See `contracts/v1/domain.schema.json`.

**Onboarding**: A manual process. Domains have years of accumulated tribal knowledge, outdated documentation, and implicit conventions that must be captured by humans working with the teams. Automation comes after onboarding, not during.

**State storage**: Project and domain state lives in a queryable store (vector DB or similar), not in JIRA or git repositories. JIRA remains an intake channel. The state store must support AI agent queries at scale — an agent processing a task needs to retrieve relevant domain context, prior task history, and cross-repo dependencies efficiently.

---

## Pipeline overview

```
                        ┌─────────────────────┐
                        │   HUMAN INTENT       │
                        │  (JIRA, GH Issue,    │
                        │   Slack, API, etc.)  │
                        └─────────┬───────────┘
                                  │
                          ┌───────▼───────┐
                   ───────┤  1. INTAKE    ├───────
                          └───────┬───────┘
                                  │ ← Task contract (with source)
                          ┌───────▼───────┐
                   ───────┤  2. TRIAGE    ├───────
                          └───────┬───────┘
                                  │ ← Task (enriched: resolved_autonomy_level)
                          ┌───────▼───────┐
                  ════════╡  3. PLANNING  ╞═══════  ← GATE at Levels 0, 1, 2*
                          └───────┬───────┘
                                  │ ← Plan contract
                          ┌───────▼───────┐
                   ───────┤  4. EXECUTION ├───────
                          └───────┬───────┘
                                  │ ← ExecutionUnit + Artifact contracts
                          ┌───────▼────────┐
                  ════════╡  5. EVALUATION ╞══════  ← GATE on failure (all levels)
                          └───────┬────────┘
                                  │ ← Evaluation contract
                          ┌───────▼────────┐
                  ════════╡  6. PROMOTION  ╞══════  ← GATE at Levels 0, 1, 2*
                          └───────┬────────┘
                                  │ ← Promotion contract
                          ┌───────▼────────┐
                   ───────┤ 7. COMPLETION  ├──────
                          └────────────────┘
                                  │ ← Memory contract (updated)
                                  │   Task status → closed

   ═══ = human gate (depends on autonomy level)
   ─── = automatic transition
   *   = conditional — see gate matrix below
```

---

## Phase 1: Intake

**Purpose:** Normalize a work request from any external system into the Task contract.

**Input:** Raw request from JIRA, GitHub Issues, Slack, an API call, or manual entry.

**Output:** `Task` contract — with a `source` block for traceability.

```json
{
  "schema_version": "v1",
  "id": "task-20260418-001",
  "type": "bugfix",
  "description": "Fix null pointer in payment service when card is declined",
  "acceptance_criteria": ["Declined cards return 402 without crashing", "Unit test covers the path"],
  "priority": "high",
  "constraints": ["Do not change the public API signature"],
  "source": {
    "system": "jira",
    "external_id": "PAY-1234",
    "url": "https://yourorg.atlassian.net/browse/PAY-1234"
  }
}
```

**How it works:**

An ingestion adapter reads from the external system and produces a Task. The adapter is responsible for:
- Mapping external fields to Task fields (type, priority, description, acceptance criteria)
- Preserving the `source` link so the original ticket is always traceable
- Deduplicating — if PAY-1234 was already ingested, skip or update

Adapters are intentionally source-specific. A JIRA adapter, a GitHub Issues adapter, and a Slack adapter are each their own integration. This repo defines the Task contract they all produce.

**JIRA's role changes:**

JIRA remains an intake channel but is no longer the source of truth for project state. The Task contract becomes the canonical representation. Status updates can flow back to JIRA via the adapter, but the pipeline owns the lifecycle. This eliminates the "every team configured JIRA differently" problem — all domains emit the same Task contract regardless of their intake system.

---

## Phase 2: Triage

**Purpose:** Classify the task, resolve its effective autonomy level, route it to the correct domain and repo(s).

**Input:** `Task` contract + `Domain` contract + repo `Policy`

**Output:** `Task` contract enriched with `resolved_autonomy_level`

**How it works:**

1. Identify which domain and repo(s) the task targets — using the Domain contract's repo list and the task description
2. Read the domain's policy and any repo-level policy overrides
3. Check if `task_type_overrides` has a specific autonomy level for this task type
4. If yes, use the override. If no, use the default `autonomy_level`
5. Set `resolved_autonomy_level` on the Task
6. At Level 0 (assistive), a human must manually confirm classification and priority

```
Task.type = "bugfix"
Domain policy → autonomy_level = "semi_autonomous"
Policy.task_type_overrides.bugfix.autonomy_level = "bounded_autonomous"
→ resolved_autonomy_level = "bounded_autonomous"
```

For multi-repo tasks, triage also determines whether the task should be decomposed into sub-tasks per repo or executed as a coordinated cross-repo change.

---

## Phase 3: Planning

**Purpose:** Decompose the task into an ordered set of steps with dependencies.

**Input:** `Task` (triaged) + `Domain` (cross-repo context, tribal knowledge) + repo `Profile` + `Memory` (relevant history)

**Output:** `Plan` contract

**How it works:**

1. The planning agent receives the Task, Domain context, and repo Profile(s)
2. The memory store provides relevant context — past similar tasks, known patterns, domain conventions, tribal knowledge captured during onboarding
3. The agent produces a Plan: ordered steps with descriptions and dependencies
4. For multi-repo tasks, the plan may include steps that span repos with explicit dependency ordering (e.g., "update shared library in `common-lib` before updating `payment-service`")
5. At Levels 0 and 1, a human must approve the plan before execution begins
6. At Level 2, human approves plans for `feature` and `refactor` types only

```json
{
  "schema_version": "v1",
  "id": "plan-001",
  "task_id": "task-20260418-001",
  "steps": [
    { "id": "s1", "description": "Add null check in PaymentProcessor.processDecline()", "status": "pending", "depends_on": [] },
    { "id": "s2", "description": "Write unit test for declined card null path", "status": "pending", "depends_on": ["s1"] },
    { "id": "s3", "description": "Run existing test suite to confirm no regressions", "status": "pending", "depends_on": ["s2"] }
  ],
  "success_criteria": ["All tests pass", "No changes to public API"]
}
```

---

## Phase 4: Execution

**Purpose:** Carry out each plan step, producing artifacts.

**Input:** `Plan` contract + repo Profile (for commands, working roots, protected paths)

**Output:** `ExecutionUnit` contracts (one per step) + `Artifact` contracts (code, tests, docs produced)

**How it works:**

1. For each step in the Plan, create an ExecutionUnit
2. The execution agent performs tool calls (code edits, file creation, command execution)
3. Each tool call is logged in the ExecutionUnit's `tool_calls` array
4. Produced files are registered as Artifacts
5. The repo's `max_execution_steps` from policy.json is enforced — if exceeded, escalate to human
6. At Level 0, the human performs each step manually (agent only advises)

---

## Phase 5: Evaluation

**Purpose:** Validate that artifacts meet quality standards using repo-native checks.

**Input:** `Artifact` contracts + repo Profile (for test/lint/build commands)

**Output:** `Evaluation` contract

**How it works:**

1. Run the repo's own validation commands from the repo Profile:
   - `commands.test` → run the test suite
   - `commands.lint` → run the linter
   - `commands.build` → verify it builds
2. Score the result (0.0–1.0) based on pass/fail
3. Assess risk level based on what changed (protected paths → higher risk, scope of changes → higher risk)
4. Set `retryable` — can the agent fix this and try again, or does it need human help?
5. **Evaluation failures escalate at ALL autonomy levels** — this is a hard stop

```json
{
  "schema_version": "v1",
  "id": "eval-001",
  "target_artifact_ids": ["artifact-s1", "artifact-s2"],
  "result": "pass",
  "score": 1.0,
  "feedback": [],
  "retryable": true,
  "risk_level": "low",
  "evidence": ["All 47 tests passed", "Lint clean", "Build succeeded"],
  "evaluated_at": "2026-04-18T12:00:00Z"
}
```

---

## Phase 6: Promotion

**Purpose:** Move validated artifacts toward production — create PR, get review, merge.

**Input:** `Evaluation` contract + `Policy` + `Task` (for resolved autonomy level)

**Output:** `Promotion` contract (tracks stage transitions)

**How it works:**

1. If evaluation passed, create a PR (stage: `draft` → `ready_for_pr` → `pr_created`)
2. The PR body includes: task description, plan summary, evaluation evidence, artifacts changed
3. Gate logic based on autonomy level:
   - **Levels 0–1:** Human must review and approve the PR. Merge is always manual.
   - **Level 2:** Human reviews if changes touch protected paths, are security-related, or are feature/refactor type. Otherwise auto-merge when CI passes.
   - **Level 3:** Auto-merge when CI passes. Hard stops for protected paths, critical risk, and non-retryable evaluation failures.
4. Promotion tracks `evaluation_ids` — which evaluations informed the promotion decision
5. After merge: stage → `merged`. If deploy is automated: stage → `deployed`.

```json
{
  "schema_version": "v1",
  "id": "promo-001",
  "task_id": "task-20260418-001",
  "stage": "pr_created",
  "readiness": "needs_review",
  "blocking_issues": [],
  "required_approvals": ["@payments-team"],
  "granted_approvals": [],
  "evaluation_ids": ["eval-001"],
  "summary": "Fix null pointer in PaymentProcessor.processDecline()",
  "artifacts": ["artifact-s1", "artifact-s2"],
  "updated_at": "2026-04-18T12:05:00Z"
}
```

---

## Phase 7: Completion

**Purpose:** Close the loop — update task status, persist learnings, emit metrics.

**Input:** `Promotion` (merged/deployed) + all prior contracts

**Output:** Updated `Memory` + task status closed

**How it works:**

1. Mark the Task as complete in the state store
2. Persist execution context to memory for future reference:
   - What worked (successful patterns)
   - What failed and how it was resolved (retry/replan history)
   - Domain-specific conventions learned
3. Sync status back to the source system (close the JIRA ticket, close the GH Issue)
4. Emit metrics: time-to-completion, autonomy level used, evaluation pass rate, number of retries

---

## Contract-at-each-boundary summary

| Phase boundary | Contract produced | Key fields |
|---|---|---|
| External → Intake | `Task` | source.system, source.external_id, type, priority |
| Intake → Triage | `Task` (enriched) | resolved_autonomy_level |
| Triage → Planning | `Plan` | steps[], success_criteria |
| Planning → Execution | `ExecutionUnit` | action, tool_calls[], status |
| Execution → Evaluation | `Artifact` + `Evaluation` | result, score, risk_level, evidence |
| Evaluation → Promotion | `Promotion` | stage, readiness, evaluation_ids |
| Promotion → Completion | `Memory` | scope, context, history |

---

## Gate matrix (by autonomy level)

See [autonomy-levels.md](./autonomy-levels.md) for full definitions.

| Phase | Assistive (L0) | Semi-autonomous (L1) | Bounded-autonomous (L2) | Fully-autonomous (L3) |
|---|---|---|---|---|
| Triage | Human classifies | Automatic | Automatic | Automatic |
| Plan approval | Human writes/approves | Human approves | Human approves features/refactors | Automatic |
| Execution | Human performs | Agent executes | Agent executes | Agent executes |
| Eval failure | Human fixes | Human fixes or agent retries | Agent retries, escalates if not retryable | Agent retries, escalates if not retryable |
| PR review | Human creates PR | Human reviews | Human reviews high-risk only | Auto unless hard stops |
| Merge | Human merges | Human merges | Auto-merge for low-risk | Auto-merge |
| Hard stops | — | — | Protected paths, critical risk | Protected paths, critical risk, max_steps exceeded |

---

## System integration map

```
  ┌────────────────────────────────────────────────────────────────┐
  │  Ingestion adapters                                            │
  │  ┌──────┐  ┌──────────┐  ┌───────┐  ┌─────┐                   │
  │  │ JIRA │  │ GH Issues│  │ Slack │  │ API │                   │
  │  └──┬───┘  └────┬─────┘  └───┬───┘  └──┬──┘                   │
  └─────┼───────────┼────────────┼─────────┼───────────────────────┘
        └───────────┴────────────┴─────────┘
                          │
                    Task contract
                          │
  ┌───────────────────────▼────────────────────────────────────────┐
  │  Orchestration engine                                          │
  │                                                                │
  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
  │  │  Triage  │→ │ Planning │→ │ Execution │→ │  Promotion   │  │
  │  └──────────┘  └──────────┘  └───────────┘  └──────────────┘  │
  │       ↕              ↕             ↕              ↕            │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  Policy enforcement (reads domain + repo policy)        │   │
  │  │  Gate checks at each phase boundary                     │   │
  │  └─────────────────────────────────────────────────────────┘   │
  └────────────┬───────────────────────┬───────────────────────────┘
               │                       │
               ↓                       ↓
  ┌────────────────────────┐  ┌────────────────────────────────────┐
  │  State store           │  │  Domain repos                      │
  │  (vector DB)           │  │                                    │
  │                        │  │  payments/                         │
  │  ┌──────────────────┐  │  │    payment-service/.agentic/       │
  │  │ Domain context   │  │  │    payment-gateway/.agentic/       │
  │  │ Task history     │  │  │    billing-api/.agentic/           │
  │  │ Tribal knowledge │  │  │                                    │
  │  │ Execution memory │  │  │  identity/                         │
  │  │ Project state    │  │  │    auth-service/.agentic/          │
  │  └──────────────────┘  │  │    user-service/.agentic/          │
  └────────────────────────┘  └────────────────────────────────────┘
```

---

## Onboarding vs. day-to-day operation

### Onboarding (manual, per domain)

Onboarding a domain is a human-driven knowledge capture process. It is not automated because:
- Domains carry years of tribal knowledge that no tool can discover automatically
- Existing documentation is often out of date or wrong
- Cross-repo dependencies and deployment ordering are implicit and known only by the team
- The policy choices (autonomy level, protected paths, review requirements) require team input

The onboarding process produces:
1. **Domain contract** (`domain.schema.json`) — repos, ownership, cross-repo deps, tribal knowledge
2. **Repo profiles** (`.agentic/profile.json` per repo) — commands, ecosystems, protected paths
3. **Repo policies** (`.agentic/policy.json` per repo) — autonomy level, review requirements
4. **State store entries** — domain context and captured knowledge seeded into the vector DB

### Day-to-day operation (agent-driven phase transitions)

After onboarding, AI agents drive phase transitions. An agent processing a task:
1. Queries the state store for domain context, task history, and tribal knowledge
2. Reads the relevant repo profiles and policies
3. Transitions through phases, respecting the gates defined by the autonomy level
4. Persists results back to the state store

Phase transitions are agent-driven, not CI-pipeline-driven. The 80/20 rule applies — agents should handle the common case and escalate the rest to humans.

---

## What this means for JIRA

JIRA becomes one of several intake adapters, not the source of truth. The benefits:

1. **Standardized intake**: Every domain's work enters the pipeline as the same Task contract, regardless of how their JIRA project is configured
2. **Pipeline owns state**: Task status, plan progress, evaluation results, and promotion stage live in the state store — JIRA shows a synced view
3. **Gradual migration**: Teams can keep using JIRA for intake while the framework proves itself. Once trust is established, teams can switch to GH Issues or direct API intake
4. **Configuration mess is irrelevant**: JIRA field mappings are the adapter's problem. The framework doesn't care if Team A uses "Story Points" and Team B uses "T-shirt Sizes" — the adapter normalizes to priority and type
