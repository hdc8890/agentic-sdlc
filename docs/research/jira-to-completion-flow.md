# Example Flow: JIRA Ticket to Completed Output

This document captures a concrete example of how a centralized orchestration engine could take a ticket from an external system such as JIRA, plan it, execute it, evaluate it, and promote it through the delivery flow.

It is intentionally illustrative rather than normative. The exact API and payload shapes should eventually align with the engine protocol and contracts.

---

## Overview

```text
JIRA webhook or cron
  -> intake adapter
  -> engine API
  -> intake
  -> triage
  -> planning
  -> execution
  -> evaluation
  -> promotion
  -> completion
  -> update JIRA
```

In this model:

- the **team repo** contributes `.agentic/profile.json` and `.agentic/policy.json`
- the **centralized engine** owns planning, execution, evaluation, and state
- the **intake adapter** translates external systems into engine-compatible task submissions

---

## Example Ticket

**JIRA issue**

- Key: `PROJ-142`
- Title: `Add rate limiting to the payments API`
- Priority: `High`
- Labels: `backend`, `security`
- Status transition: `Ready for Dev`

That transition triggers the intake flow.

---

## Step 1: JIRA emits an intake signal

This can happen in one of two common ways:

1. **Webhook**
   - JIRA sends an HTTP payload when the ticket enters a specific state such as `Ready for Dev`
2. **Cron / polling**
   - A scheduled job queries JIRA for new tickets that match intake criteria

Either mechanism feeds the same downstream adapter.

---

## Step 2: Intake adapter normalizes the ticket

The intake adapter is a thin service or job that:

- receives the webhook or poll result
- maps JIRA fields into a task payload
- resolves which domain or repo the ticket belongs to
- fetches that repo's `.agentic/` configuration
- submits the normalized task to the engine API

### Example normalized task

```json
{
  "id": "task-proj-142",
  "schema_version": "v1",
  "title": "Add rate limiting to the payments API",
  "description": "Implement rate limiting for public payments API endpoints.",
  "source": {
    "system": "jira",
    "ref": "PROJ-142"
  },
  "priority": "high",
  "labels": ["backend", "security"],
  "status": "pending"
}
```

### Repo resolution

The adapter determines that:

- the issue belongs to the `payments-api` repo
- the relevant repo profile and policy should be loaded
- any domain-level cross-repo dependencies should be attached as context

---

## Step 3: Engine API accepts the task

The adapter calls the centralized engine:

```http
POST /tasks
Authorization: Bearer <engine-token>
Content-Type: application/json
```

Payload includes:

- normalized task data
- repo profile
- policy
- optional domain context

### Example response

```json
{
  "task_id": "task-proj-142",
  "status": "accepted"
}
```

At this point the engine creates durable state for the run and begins the pipeline.

---

## Step 4: Triage

The engine classifies the task and enriches it with execution metadata.

### Typical triage questions

- What kind of work is this: bug fix, feature, refactor, migration?
- How complex is it?
- What code areas are likely involved?
- Are there cross-repo effects?
- Does policy require a human review before planning or execution continues?

### Example outcome

- Task type: feature/security hardening
- Estimated complexity: medium
- Target areas:
  - `src/middleware/`
  - `src/routes/payments/`
- Cross-repo note:
  - mobile client depends on payments API behavior and may require integration checks

---

## Step 5: Planning

The engine generates a structured plan from the task, repo profile, and triage context.

### Example plan

```json
{
  "id": "plan-proj-142",
  "task_id": "task-proj-142",
  "steps": [
    {
      "id": "step-1",
      "title": "Create rate limiter middleware",
      "depends_on": []
    },
    {
      "id": "step-2",
      "title": "Apply rate limiter to payments routes",
      "depends_on": ["step-1"]
    },
    {
      "id": "step-3",
      "title": "Add unit tests for limiter behavior",
      "depends_on": ["step-1"]
    },
    {
      "id": "step-4",
      "title": "Add integration tests for rate-limited endpoints",
      "depends_on": ["step-2", "step-3"]
    }
  ]
}
```

### Human gate example

If the repo policy is `supervised`, the engine pauses here and waits for approval before executing the plan.

```http
POST /tasks/task-proj-142/approve
```

---

## Step 6: Execution

The engine expands the plan into execution units and runs them in dependency order.

### Execution order

```text
step-1 -> step-2 -> step-4
      \-> step-3 -/
```

### Example execution unit

```json
{
  "step_id": "step-1",
  "status": "done",
  "tool_calls": [
    {
      "tool": "file_write",
      "path": "src/middleware/rateLimiter.ts",
      "status": "success",
      "trace_id": "tr-abc123"
    }
  ],
  "artifacts": [
    {
      "path": "src/middleware/rateLimiter.ts",
      "type": "code"
    }
  ]
}
```

During this phase the engine:

- respects protected paths from the repo profile
- records tool calls for traceability
- writes intermediate state for recovery and visibility

---

## Step 7: Evaluation

The engine evaluates the produced output before promotion.

### Suggested two-stage evaluation

1. **Spec compliance**
   - Did the work match the plan?
   - Are expected files and outputs present?
2. **Quality**
   - Do tests pass?
   - Does the implementation meet correctness, security, and maintainability expectations?

### Example outcomes

```json
{
  "result": "pass",
  "retryable": false
}
```

If evaluation fails and the issue is retryable, the engine can:

- compact the failure into retry context
- regenerate a corrective execution unit
- re-run evaluation

If policy requires it, a human can review the evaluation evidence before promotion.

---

## Step 8: Promotion

Once evaluation passes, the engine promotes the work into the team's standard delivery workflow.

### Example promotion actions

- create branch: `agentic/proj-142-rate-limiting`
- open a pull request
- attach evaluation evidence
- link the PR back to JIRA

### Example promotion payload

```json
{
  "task_id": "task-proj-142",
  "stage": "pr_created",
  "pr_url": "https://github.com/org/payments-api/pull/287"
}
```

This preserves normal team controls such as CI, peer review, merge policy, and deployment approvals.

---

## Step 9: Completion

After promotion succeeds and the required downstream workflow completes, the engine marks the task complete.

### Example completion actions

- mark task as complete in engine state
- emit final events
- store durable execution history
- optionally store memory for future planning and evaluation
- update the source system

### Example source-system update

The intake adapter or completion handler posts back to JIRA:

- transition `PROJ-142` to `Done`
- add comment with PR URL and summary

---

## End-to-End Summary

```text
JIRA issue moves to Ready for Dev
  -> webhook or cron detects it
  -> intake adapter normalizes the ticket
  -> adapter submits task to engine API
  -> engine performs triage
  -> engine generates plan
  -> policy may require human approval
  -> engine executes steps in dependency order
  -> engine evaluates results
  -> policy may require human approval
  -> engine creates PR or other promotion artifact
  -> engine marks task complete
  -> JIRA is updated with the outcome
```

---

## Why this flow matters

This example shows the difference between a centralized engine and a repo-local orchestration system:

- the **engine** can evolve without rewriting orchestration code into every team repo
- **external systems** such as JIRA only need a stable intake contract
- **repo-local config** controls scope and autonomy without embedding the engine inside the repo
- **promotion** remains compatible with existing team workflows

For mature teams, this model can support fully automated execution through promotion into a staging or preview environment, while still preserving human approval at the final production boundary.
