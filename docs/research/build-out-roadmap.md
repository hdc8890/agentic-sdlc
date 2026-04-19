# Agentic SDLC — System Build-Out Roadmap

## Context

Based on the research in `docs/research/orchestration-research-summary.md`, this roadmap covers building out the full system: hardening the platform repo (`agentic-sdlc`) and building a LangGraph-based orchestration engine in a separate repo.

**Key design constraint:** The engine is a separate repo and must be swappable. This repo defines what any engine must satisfy — through contracts, a protocol spec, and a conformance test suite. No engine-specific types leak into platform contracts.

**Architecture:** Level 9 (Contract-Driven Platform) wrapping a Level 4-5 engine (LangGraph + Shannon-inspired infra), with MetaGPT-inspired role modeling and Superpowers-inspired evaluation.

---

## Milestone A: Platform Interface & Schema Hardening

**Goal:** Make this repo the authoritative spec that any engine can implement against, with testable conformance.

**Repo:** `agentic-sdlc` (this repo)

### A1. Schema cleanup
- Add consistent `$id` and `$schema` to all 10 contracts in `contracts/v1/`
- Ensure all cross-references (`$ref`) resolve correctly
- Update CLI schema loading to handle bundled `$ref` resolution
- Verify `examples/onboarded-repo/` passes strict validation

### A2. Engine protocol spec
- Create `contracts/v1/engine-protocol.md` — an OpenAPI-style spec defining the behavioral contract any engine must implement:
  - `POST /tasks` — submit a task (intake)
  - `GET /tasks/{id}/status` — current run state (for `agentic status`)
  - `POST /tasks/{id}/approve` — approve a human gate
  - `POST /tasks/{id}/resume` — resume after pause
  - `POST /tasks/{id}/cancel` — cancel a running task
  - `GET /tasks/{id}/events` — event stream of phase transitions
- This is the **swappability contract** — swap the engine, keep the protocol

### A3. New schemas for engine communication
- `contracts/v1/run-status.schema.json` — snapshot of current task state (phase, step, status, last event, autonomy level in effect). This is what `agentic status` queries.
- `contracts/v1/event.schema.json` — phase transition events (timestamp, from_phase, to_phase, payload, validation_result). Append-only log.

### A4. Conformance test suite
- Language-neutral: golden JSON fixtures + a test runner script
- For each contract: valid examples, invalid examples, edge cases
- For the protocol: expected request/response pairs for each endpoint
- Any engine runs these tests to prove compliance
- Ship as `contracts/v1/conformance/` directory

### A5. Versioning & compatibility strategy
- Document versioning rules in `contracts/v1/VERSION.md`
- Engine manifest includes which contract version it targets
- Version handshake: engine declares `contracts_version: "v1"`, platform validates compatibility

### A6. CLI updates
- `agentic validate --strict` mode (full `$ref` resolution, required field enforcement)
- `agentic status` updated to query engine via protocol spec (run-status schema)
- Update CLI README with new commands

---

## Milestone B: Engine MVP (Single-Repo Vertical Slice)

**Goal:** A working LangGraph engine that processes a task through all 7 phases, validates against contracts at every boundary, and supports human-in-the-loop gates.

**Repo:** New repo `agentic-engine-langgraph` (Python)

### B1. Project scaffolding
- Python project with LangGraph, jsonschema, SQLite
- Load and validate against `contracts/v1/` schemas (git submodule or published package)
- Run conformance test suite from Milestone A4

### B2. 7-node StateGraph
- One node per pipeline phase: Intake → Triage → Planning → Execution → Evaluation → Promotion → Completion
- Contract validation at every phase transition (jsonschema against `contracts/v1/`)
- Conditional edges based on `policy.schema.json` autonomy level

### B3. State persistence
- SQLite for task state, execution history, event log
- Checkpoint/restore: task survives engine restart
- State model maps to `run-status.schema.json`

### B4. Human-in-the-loop gates
- LangGraph `interrupt()` at plan review and eval review
- Gate behavior driven by `policy.schema.json` autonomy levels:
  - `assistive` / `supervised`: interrupt at every gate
  - `semi_autonomous`: interrupt only on failure or low confidence
  - `fully_autonomous`: no interrupts
- Approve/resume/cancel via protocol endpoints

### B5. Execution subgraph
- Parse `plan.schema.json` `steps[].depends_on` into a DAG
- Execute steps respecting dependency ordering
- Each step produces an `execution-unit` validated against schema
- Track `tool_calls[]` per step

### B6. Protocol server
- HTTP server implementing the engine protocol spec from A2
- `agentic status` can query it
- Event stream endpoint for observability

### B7. End-to-end demo
- A sample task flowing through all 7 phases
- Document in engine repo README with screenshots/logs
- Validate the full flow passes conformance tests

---

## Milestone C: Production Hardening

**Goal:** Make the engine resilient, observable, and policy-governed. Improve evaluation quality.

**Repo:** Primarily engine repo, with some platform repo updates

### C1. Circuit breakers (Shannon-inspired)
- Wrap every LLM/external call with circuit breaker (closed → open → half-open)
- 5 consecutive failures = open circuit
- Prevent runaway costs when providers go down

### C2. Budget manager
- Token/cost tracking per task
- Hard budget ceiling (MetaGPT-style "NoMoneyException")
- Integrates with `policy.schema.json` `max_execution_steps`
- Extend to token-level budgets beyond step counts

### C3. Policy engine modes
- Three enforcement modes: `enforce` / `dry-run` / `off`
- `dry-run` logs what would be blocked without stopping execution
- Canary rollout support (per-task enforce percentage)

### C4. Observability
- Structured logging (JSON) for every phase transition
- Metrics: task duration, step count, token usage, failure rate
- Distributed tracing with trace_id propagation (matches `execution-unit.tool_calls[].trace_id`)
- Dashboard-ready output (compatible with Grafana/Prometheus or similar)

### C5. Two-stage evaluation (Superpowers-inspired)
- Stage 1: Spec compliance — does the artifact match `execution-unit.schema.json` expectations?
- Stage 2: Quality — code review, test coverage, security scan
- Each stage produces an `evaluation.schema.json` result independently
- Failures from each stage have different retry strategies

### C6. Retry & error compaction (12-factor #9)
- Failed evaluation → compact error into context window for retry
- `evaluation.schema.json` `retryable: bool` controls re-entry
- Exponential backoff with jitter for LLM retries
- Max retry count from policy

### C7. Memory service integration
- Implement `memory.schema.json` scopes: ephemeral, session, persistent
- Learnings from evaluation failures stored as persistent memory
- Context retrieval for planning phase (relevant past executions)

### C8. Rate control & degradation
- Rate limiting per LLM provider
- Graceful degradation: fall back to cheaper models when primary is down
- Queue backpressure when rate limits are hit

---

## Backlog (Future)

These are deferred until Milestones A-C are solid. Not sequenced.

- **Multi-repo coordination**: A2A protocol, `domain.schema.json` cross-repo deps realized
- **Multi-strategy routing**: Shannon-inspired strategy selection (Simple/DAG/ReAct per task type)
- **Engine registry**: Multiple engines register; platform selects per-task
- **MetaGPT-inspired role model**: Named agent roles (Triager, Planner, Executor, Evaluator) with pub/sub
- **Skills-as-methodology**: Superpowers-inspired SKILL.md distribution for pipeline methodology
- **Platform npm validation library**: Publishable package for JS/TS engines (after Python engine proves the model)
- **Temporal/Inngest migration**: Only if LangGraph checkpointing proves insufficient — design for migration-ability now (idempotent handlers, externalized state, clear checkpoint boundaries)

---

## Design Principles (from Research)

1. **Contracts are the skeleton** — the engine is just the function that runs between contract boundaries (12-factor #12: stateless reducer)
2. **Every external call is unreliable** — circuit breakers, budgets, rate limits on everything (Shannon)
3. **Context isolation by construction** — each execution unit gets only its inputs, never ambient session state (Superpowers)
4. **Two-stage review > single evaluator** — spec compliance and quality are separate concerns (Superpowers)
5. **Protocol > schema for behavior** — schemas validate data, protocols define interaction (rubber-duck critique)
6. **Plan for migration-ability, not migration** — idempotent handlers, externalized state, no engine-specific types in platform contracts

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Engine language | Python (LangGraph) | Best 1:1 pipeline mapping, largest ecosystem |
| Engine repo | Separate from platform | Swappability — engine is a plug point |
| State persistence | SQLite (MVP) | Zero infra deps for solo dev |
| Engine protocol | OpenAPI/JSON-over-HTTP | Simple, language-neutral, solo-dev friendly |
| Conformance | Golden fixtures + test runner | Language-neutral, any engine can run them |
| Temporal migration | Deferred | Design for it (idempotent, externalized state) but don't commit |
