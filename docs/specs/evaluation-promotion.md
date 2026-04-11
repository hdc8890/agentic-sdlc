# Evaluation and Promotion Contract

Evaluation is the trust layer of the platform. Promotion is the controlled progression of work toward production readiness.

## Evaluation requirements

Every evaluation result must answer:

- Did the output pass?
- What evidence supports that conclusion?
- Is the failure retryable?
- What risk remains?
- What should happen next?

## Evaluation categories

Required categories may vary by workflow, but the model supports:

- automated tests
- static analysis
- policy and heuristic checks
- human review
- model-based critique

## Minimum evaluation record

An `Evaluation` should include:

- `id`
- `target_artifact_ids`
- `result`
- `score`
- `feedback`
- `retryable`
- `risk_level`
- `evidence`
- `evaluated_at`

## Retry semantics

### Retryable failures

Use retryable failures when the system should attempt another execution pass without redefining the plan.

Examples:

- flaky external tool failure
- formatting or lint violation
- incomplete artifact output

### Non-retryable failures

Use non-retryable failures when the current plan or assumptions are no longer sufficient.

Examples:

- missing requirements
- incompatible dependency assumptions
- architectural constraint violation

Non-retryable failures should trigger replanning or human intervention.

## Risk scoring

Risk scoring should be explicit and composable.

Recommended levels:

- `low`
- `medium`
- `high`
- `critical`

Risk may be derived from:

- code surface area
- production impact
- policy compliance gaps
- missing evidence
- unresolved review feedback

## Promotion stages

Recommended progression:

1. `draft`
2. `ready_for_pr`
3. `pr_created`
4. `approved`
5. `merged`
6. `deployed`

## Promotion gate

Promotion requires:

- required artifacts present
- required evaluations complete
- no blocking `high` or `critical` risk without explicit approval
- required human approvals recorded when autonomy mode requires it

## Minimum promotion record

A `Promotion` should include:

- `id`
- `task_id`
- `stage`
- `readiness`
- `blocking_issues`
- `required_approvals`
- `granted_approvals`
- `summary`
- `artifacts`
- `updated_at`

## Experience expectations

User-facing surfaces should render:

- why promotion is blocked or ready
- what evidence exists
- what approvals or actions are still required
