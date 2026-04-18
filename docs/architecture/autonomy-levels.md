# Autonomy levels

This document defines the four autonomy levels used by the Agentic SDLC framework. Each team configures their default level in `.agentic/policy.json` and can override per task type.

The autonomy level determines which phase transitions require human approval and which proceed automatically. See [end-to-end-flow.md](./end-to-end-flow.md) for the full pipeline these gates apply to.

---

## Summary

| Level | Name | One-line description |
|---|---|---|
| 0 | Assistive | Agent advises, human does all work |
| 1 | Semi-autonomous | Agent works, human approves plan and PR |
| 2 | Bounded-autonomous | Agent works and auto-merges low-risk, human reviews high-risk |
| 3 | Fully-autonomous | Agent handles the full lifecycle, hard stops only |

---

## Level 0: Assistive

**Policy value:** `"autonomy_level": "assistive"`

### What the agent does
- Provides context about the codebase (explains code, finds references)
- Suggests approaches and trade-offs
- Drafts code snippets for the human to review and apply
- Answers questions about the task

### What the human does
- Writes all code
- Creates branches and PRs
- Runs tests and evaluates results
- Merges and deploys

### Human gates

| Phase | Gate |
|---|---|
| Triage | Human classifies the task type and priority |
| Planning | Human writes or approves the plan |
| Execution | Human performs each step (agent advises only) |
| Evaluation | Human runs checks and interprets results |
| Promotion | Human creates PR, requests review, merges |

### When to use
- Critical production systems where the blast radius of a mistake is high
- Security-sensitive repositories (auth, payments, PII handling)
- Teams brand new to the framework who want to build trust incrementally
- Regulated domains requiring human accountability for every change

### Policy example

```json
{
  "schema_version": "v1",
  "autonomy_level": "assistive",
  "require_human_review_on": ["all_changes"],
  "auto_merge": false,
  "max_execution_steps": 5
}
```

---

## Level 1: Semi-autonomous

**Policy value:** `"autonomy_level": "semi_autonomous"`

### What the agent does
- Creates plans from task descriptions
- Writes code, tests, and documentation
- Runs the repo's test/lint/build commands
- Creates PRs with evaluation evidence

### What the human does
- Approves the plan before execution begins
- Reviews every PR (code review, not just CI)
- Decides when to merge
- Handles evaluation failures the agent can't retry

### Human gates

| Phase | Gate |
|---|---|
| Triage | Automatic (agent resolves autonomy from policy) |
| Planning | **Human approves plan before execution** |
| Execution | Agent executes within `max_execution_steps` |
| Evaluation | Agent retries if `retryable: true`; **human handles non-retryable failures** |
| Promotion | **Human reviews PR and merges manually** |

### When to use
- Most teams starting out with the framework
- Feature development and refactoring work
- Repositories with moderate test coverage
- Cross-team or cross-service changes

### Policy example

```json
{
  "schema_version": "v1",
  "autonomy_level": "semi_autonomous",
  "require_human_review_on": [
    "protected_path_changes",
    "security_related",
    "dependency_changes",
    "schema_changes"
  ],
  "auto_merge": false,
  "max_execution_steps": 10
}
```

---

## Level 2: Bounded-autonomous

**Policy value:** `"autonomy_level": "bounded_autonomous"`

### What the agent does
- Everything from Level 1, plus:
- Auto-merges PRs for low-risk task types (`docs`, `ktlo`, `bugfix`) when all checks pass
- Skips plan approval for low-risk task types
- Retries evaluation failures autonomously when `retryable: true`

### What the human does
- Reviews plans for `feature` and `refactor` task types
- Reviews PRs that trigger any `require_human_review_on` condition
- Gets notified on all auto-merged changes (can revert)
- Handles escalations from evaluation failures and risk assessments

### Human gates

| Phase | Gate |
|---|---|
| Triage | Automatic |
| Planning | **Human approves plan for `feature` and `refactor` only** |
| Execution | Agent executes within `max_execution_steps` |
| Evaluation failure | Agent retries; **escalates to human if `retryable: false`** |
| Promotion (low-risk) | Auto-merge when CI passes and no `require_human_review_on` triggered |
| Promotion (high-risk) | **Human reviews PR** — triggered by protected paths, security, dependencies, features |
| Risk escalation | **`risk_level: high` or `critical` always requires human review** |

### Conditional logic

The "bounded" part means the boundary is explicit. Auto-merge happens only when ALL of these are true:
1. Task type is not `feature` or `refactor`
2. No files in `protected_paths` were changed
3. None of the `require_human_review_on` conditions match
4. Evaluation `risk_level` is `low` or `medium`
5. All CI checks pass
6. `auto_merge` is `true` in policy

If any condition fails, it falls back to human review.

### When to use
- Mature teams with comprehensive test suites and CI
- Repositories with well-defined CODEOWNERS and protected paths
- Teams that trust the evaluation pipeline for low-risk changes
- When you want to free up senior engineer review time for high-impact work

### Policy example

```json
{
  "schema_version": "v1",
  "autonomy_level": "bounded_autonomous",
  "require_human_review_on": [
    "protected_path_changes",
    "security_related",
    "dependency_changes"
  ],
  "auto_merge": true,
  "max_execution_steps": 15,
  "task_type_overrides": {
    "docs": {
      "autonomy_level": "fully_autonomous",
      "require_human_review_on": []
    },
    "feature": {
      "autonomy_level": "semi_autonomous",
      "require_human_review_on": ["all_changes"]
    }
  }
}
```

---

## Level 3: Fully-autonomous

**Policy value:** `"autonomy_level": "fully_autonomous"`

### What the agent does
- Handles the entire lifecycle: intake → plan → execute → evaluate → promote → merge
- Creates PRs and auto-merges when checks pass
- Retries evaluation failures and replans when needed
- Updates source system (closes JIRA ticket, etc.)

### What the human does
- Gets notified on all completed tasks (async review)
- Can intervene at any point via PR comment, dashboard, or revert
- Audits periodically — reviews metrics, patterns, failure rates
- Handles hard-stop escalations

### Human gates (hard stops — cannot be bypassed)

| Condition | What happens |
|---|---|
| Changes to `protected_paths` | PR created, **human review required** |
| `risk_level: critical` | PR created, **human review required** |
| `retryable: false` evaluation failure | Task paused, **human must resolve** |
| `max_execution_steps` exceeded | Plan paused, **human reviews scope** |
| Human comments on PR | Agent pauses, **waits for human direction** |

These hard stops exist at every autonomy level. At Level 3, they are the only gates.

### When to use
- Documentation repositories
- Internal tools with comprehensive test coverage
- Low-risk utilities and libraries
- Repos where the test suite genuinely catches problems before production

### Policy example

```json
{
  "schema_version": "v1",
  "autonomy_level": "fully_autonomous",
  "require_human_review_on": [
    "protected_path_changes",
    "security_related"
  ],
  "auto_merge": true,
  "max_execution_steps": 20,
  "task_type_overrides": {
    "feature": {
      "autonomy_level": "bounded_autonomous"
    }
  },
  "notification_channels": [
    {
      "type": "slack",
      "target": "#platform-agent-activity",
      "on_events": ["task_complete", "evaluation_failed", "promotion_blocked"]
    }
  ]
}
```

---

## Recommended rollout path

For an org with 24 teams, do not jump to Level 2 or 3.

### Phase 1: Pilot (2–3 teams)
Start all pilot teams at **Level 1 (semi-autonomous)**. This builds trust because:
- Humans see every plan before execution
- Humans review every PR
- The framework proves it produces quality output

### Phase 2: Expand (all teams)
Once pilot teams are comfortable:
- Onboard remaining teams at **Level 1**
- Pilot teams graduate to **Level 2** for `docs`, `ktlo`, and `bugfix` task types
- Keep `feature` and `refactor` at Level 1

### Phase 3: Mature
After teams have months of data:
- Teams with strong test coverage and low failure rates move to **Level 2** for most task types
- Documentation-only repos can go to **Level 3**
- Critical systems stay at **Level 1** (or even Level 0 for security-sensitive code)

### Phase 4: Full autonomy (selective)
- Individual repos earn **Level 3** based on:
  - Evaluation pass rate > 95%
  - Zero production incidents from agent-merged changes
  - Comprehensive protected paths coverage
  - Team explicitly opts in

---

## Task type × autonomy level matrix

This shows the effective behavior when `task_type_overrides` are used. A typical bounded-autonomous repo might configure:

| Task type | Effective level | Plan approval | PR review | Auto-merge |
|---|---|---|---|---|
| `feature` | Semi-autonomous | Required | Required | No |
| `bugfix` | Bounded-autonomous | Not required | Only if high-risk | Yes (if low-risk) |
| `refactor` | Semi-autonomous | Required | Required | No |
| `ktlo` | Bounded-autonomous | Not required | Only if high-risk | Yes (if low-risk) |
| `docs` | Fully-autonomous | Not required | Only protected paths | Yes |
| `research` | Assistive | N/A (no code changes) | N/A | N/A |

---

## Relationship to policy.json

The autonomy level definitions in this document are the specification. The `policy.json` file in each repo is the configuration that activates them. The orchestration engine reads `policy.json` and enforces the gates defined here.

Key fields in `policy.json`:
- `autonomy_level` — the repo's default level
- `task_type_overrides` — per-type level overrides
- `require_human_review_on` — additional conditions that force human review regardless of level
- `auto_merge` — whether auto-merge is permitted at all (even Level 3 respects `false`)
- `max_execution_steps` — hard limit on agent work per task
