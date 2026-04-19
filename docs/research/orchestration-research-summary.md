# AI Orchestration Engine Research — Consolidated Summary

> Research conducted for the `agentic-sdlc` platform repository  
> April 2026

---

## Table of Contents

1. [Starting Point: What the Repo Needs](#1-starting-point-what-the-repo-needs)
2. [The 10 Levels of Agent Orchestration](#2-the-10-levels-of-agent-orchestration)
3. [Orchestration Engine Options Evaluated](#3-orchestration-engine-options-evaluated)
4. [The "Agent Harness" vs "Orchestration" Debate](#4-the-agent-harness-vs-orchestration-debate)
5. [Patterns Worth Stealing](#5-patterns-worth-stealing)
6. [Strategy Going Forward](#6-strategy-going-forward)
7. [Full Project Reference Table](#7-full-project-reference-table)

---

## 1. Starting Point: What the Repo Needs

The `agentic-sdlc` repo is a **contract-first platform** — 10 versioned JSON schemas in `contracts/v1/` that define the shared data model, a CLI for team onboarding, and no orchestration engine implementation. The engine is deliberately a plug point.

### The 7-Phase Pipeline

```
Intake → Triage → Planning → Execution → Evaluation → Promotion → Completion
```

Each phase transition is bounded by a contract. The contracts define what any engine must satisfy:

| Requirement | Source Contract | Detail |
|---|---|---|
| Stateful phase transitions | Task, Plan, ExecutionUnit | Status enums: pending → in_progress → done/failed |
| Human-in-the-loop gates | Policy (autonomy_level) | 4 levels: assistive → supervised → semi_autonomous → fully_autonomous |
| Step dependency ordering | Plan (steps[].depends_on) | DAG execution with explicit dependencies |
| Tool call tracking | ExecutionUnit (tool_calls[]) | Each call logged with tool name, status, trace_id |
| Evaluation-as-gate | Evaluation (result, retryable) | Hard stop on failure at all autonomy levels |
| Memory persistence | Memory (scope: ephemeral/session/persistent) | With optional embeddings |
| Max step enforcement | Policy (max_execution_steps) | Runaway guard: 1–50 steps |
| Multi-repo coordination | Domain (cross_repo_dependencies) | Relationship types: imports, calls_api, deploy_before |

---

## 2. The 10 Levels of Agent Orchestration

Surveyed 20+ trending GitHub projects and discovered that "agent orchestration" spans a massive range. Here's the taxonomy:

### Level 0: Single-Agent Loop
**One LLM in a ReAct/tool-calling loop. No coordination with other agents.**

- Example: **OpenAI Agents SDK** basic usage (★ 7.6K)
- Architecture: `User → [Think → Act → Observe → Repeat] → Output`
- No concept of "another agent" — one loop, one context window

### Level 1: Prompt Orchestration
**Structured prompt files telling a single LLM how to behave. The "agents" are markdown, not processes.**

- Example: **GSD (Get Shit Done)** — `gsd-build/get-shit-done` (★ 1.2K)
  - `gsd install` drops `.claude/`, `.gemini/`, `.cursor/` prompt directories into your repo
  - "Agents" like `boomerang-orchestrator.md` are system prompts, not running processes
- Also: Cursor rules files, `.cursorrules`, `AGENTS.md` convention, `CLAUDE.md`
- Architecture: `IDE Agent → reads prompt files → role-plays orchestration within single context`

### Level 2: Agent Harness / Routing
**A dispatcher that can spawn/route to multiple agent configurations. No durable state.**

- Examples:
  - **oh-my-openagent** — `code-yeongyu/oh-my-openagent` — OpenCode plugin with 11 named agents, IntentGate intent classifier, 52 lifecycle hooks, circuit breakers, and background agent execution. **Level 4, not a harness** — see the harness debate section.
  - **OpenAI Swarm** (★ 20K+) — lightweight "handoff" between agents, explicitly educational
- Architecture: `Dispatcher → [Agent A] or [Agent B] (context passing, no persistence)`

### Level 3: Parallel Agent Farm
**Multiple identical agent processes running concurrently, coordinated by locks/shared filesystem.**

- Examples:
  - **claude_code_agent_farm** — `Dicklesworthstone/claude_code_agent_farm` (★ 783) — 20-50+ Claude processes with file locks and tmux monitoring
  - **Claude-Code-Workflow** — `catlog22/Claude-Code-Workflow` (★ 1.8K) — JSON-driven cadence-team definitions
- Architecture: `Farm Manager → N agents (branch-per-agent, file locks prevent collision)`

### Level 4: Stateful Workflow Orchestration ⭐
**DAG-based execution with persistence, checkpointing, retries, human-in-the-loop gates. The "bread and butter" of production agent systems.**

- Examples:
  - **LangGraph** (★ 13K+) — StateGraph with nodes, edges, conditional routing, checkpointing
  - **Mastra** (★ 11K+) — TypeScript-native, step-based with suspend/resume
  - **CrewAI** (★ 28K+) — Agent + Task + Crew abstraction with memory
  - **KaibanJS** (★ 1.4K) — JavaScript multi-agent with Kanban state management
- Architecture: `Task → DAG Steps → [retry on fail, checkpoint state, human gate] → Output`
- **🎯 This is the level where the pluggable engine will operate**

### Level 5: Multi-Strategy Orchestration
**The system dynamically selects its execution strategy based on task characteristics.**

- Examples:
  - **Shannon** — `Kocoro-lab/Shannon` (★ 1.7K) — 8 strategies (Simple/DAG/ReAct/Research/Exploratory/BrowserUse/DomainAnalysis/Swarm), Temporal workflows, WASI sandboxing, token budgets
  - **Microsoft Agent Framework** (★ 9.5K) — graph-based with A2A, declarative, time-travel debugging
- Architecture: `Task → Strategy Router → selects Simple|DAG|ReAct|Research|Swarm → execute with shared infra`
- Shannon is a general-purpose production orchestration framework with multi-strategy routing and full observability

### Level 6: Organizational / SOP Orchestration
**Agents modeled as roles in an organization with standardized operating procedures.**

- Examples:
  - **MetaGPT** — `FoundationAgents/MetaGPT` (★ 67K) — `Code = SOP(Team)`, roles: PM/Architect/Engineer/QA
  - **ruflo** — `ruvnet/ruflo` (★ 32K) — Enterprise swarm intelligence with organizational hierarchy
- Architecture: `Shared Environment ← pub/sub → [ProductManager, Architect, Engineer, QA]`
- Coordination is organizational, not graph-based; work products are documents flowing between roles

### Level 7: Event-Driven Mesh / Protocol-Based
**Agents as independent services communicating via event broker or standardized protocol. Discoverable, loosely coupled.**

- Examples:
  - **Solace Agent Mesh** — `SolaceLabs/solace-agent-mesh` (★ 3.2K) — event broker + A2A protocol
  - **python-a2a** (★ 986) — Google's Agent-to-Agent protocol implementation
  - **Agent-MCP** — `rinadelph/Agent-MCP` (★ 1.2K) — multi-agent via Model Context Protocol
- Architecture: `Event Broker → topics → independently deployed agents subscribe/publish`

### Level 8: Emergent / Simulation Orchestration
**Agents with persistent memory, beliefs, and social behaviors. Coordination emerges from individual decision-making.**

- Examples:
  - **Generative Agents (Smallville)** — `joonspk-research/generative_agents` (★ 21K) — Stanford research, emergent social behavior
  - **Jido** (★ 1.6K) — autonomous agents in Elixir on BEAM VM
  - **Chidori** (★ 1.3K) — reactive durable runtime in Rust
- Architecture: `Environment ← agents observe, reflect, plan, act → coordination emerges`

### Level 9: Contract-Driven Platform Orchestration
**Full lifecycle management with versioned contracts at every phase boundary. Pluggable engines. Policy governance.**

- Example: **Your agentic-sdlc repo** — the target architecture
- Also: **[12-factor-agents](https://github.com/humanlayer/12-factor-agents)** (★ 19.4K) — the closest thing to a design specification for exactly this architecture. All 12 principles map directly to contracts in `contracts/v1/` — see Section 5 for the full mapping.
- Architecture: `Contracts govern every transition; engine is pluggable; policy controls autonomy`

### Comparison Matrix

| Level | Name | State | Multi-Agent | Strategy Select | Contracts | Emergent |
|:-----:|------|:-----:|:-----------:|:---------------:|:---------:|:--------:|
| 0 | Single-Agent Loop | ❌ | ❌ | ❌ | ❌ | ❌ |
| 1 | Prompt Orchestration | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | Agent Harness | ❌ | ✅ | ❌ | ❌ | ❌ |
| 3 | Parallel Farm | ⚠️ | ✅ | ❌ | ❌ | ❌ |
| 4 | Workflow Orchestration | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| 5 | Multi-Strategy | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| 6 | Organizational/SOP | ✅ | ✅ | ⚠️ | ❌ | ⚠️ |
| 7 | Event-Driven Mesh | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| 8 | Emergent/Simulation | ✅ | ✅ | N/A | ❌ | ✅ |
| 9 | Contract Platform | ✅ | ✅ | Pluggable | ✅ | ❌ |

### The "Is It Really Orchestration?" Litmus Test

| Capability | Description | First Appears At |
|---|---|---|
| Process isolation | Agents run as separate processes, not one LLM role-playing | Level 2 |
| State persistence | Execution state survives crashes and restarts | Level 4 |
| Conditional routing | Execution path changes based on runtime results | Level 4 |
| Resource governance | Token budgets, rate limits, circuit breakers | Level 5 |
| Contract enforcement | Every phase transition validated against a schema | Level 9 |

---

## 3. Orchestration Engine Options Evaluated

Seven engines were evaluated against the repo's contract requirements:

### Tier 1: Best Fit for Your Pipeline

| Engine | Stars | Language | Strengths | Gaps |
|--------|------:|----------|-----------|------|
| **LangGraph** | 13K+ | Python/JS | Best 1:1 pipeline mapping. StateGraph nodes = your 7 phases. Built-in checkpointing, `interrupt()` for human gates. | Python-first (JS is newer). No built-in budget/circuit breaker. |
| **Mastra** | 11K+ | TypeScript | TypeScript-native (matches your CLI). Step-based with suspend/resume. Built-in vector memory. | Younger ecosystem. Less battle-tested. |

### Tier 2: Production Durability

| Engine | Stars | Language | Strengths | Gaps |
|--------|------:|----------|-----------|------|
| **Temporal** | 12K+ | Go/polyglot | Industry-standard durable execution. Signal-based human gates. Temporal Cloud for ops. | Not AI-specific — you build agent logic yourself. Higher complexity. |
| **Inngest** | 5K+ | TypeScript | Serverless-friendly. Step functions with `waitForEvent()`. Built-in retries, concurrency. | Less community around AI agent patterns. |

### Tier 3: Multi-Agent Patterns

| Engine | Stars | Language | Strengths | Gaps |
|--------|------:|----------|-----------|------|
| **CrewAI** | 28K+ | Python | Accessible role-based agents. Sequential + hierarchical processes. Built-in memory. | Python-only. Higher abstraction = less contract control. |
| **OpenAI Agents SDK** | 7.6K | Python | Official OpenAI. Lightweight. Model-agnostic handoffs. | No persistence. Limited workflow control. |

### Tier 4: Fully Custom

| Approach | Strengths | Gaps |
|----------|-----------|------|
| **Custom engine** | Perfect contract alignment. No framework constraints. Full control. | More upfront work. Must build checkpointing, retries, observability yourself. |

### How Each Maps to the Pipeline

```
                    LangGraph    Mastra      Temporal    CrewAI
Intake              node         step        workflow    task input
Triage              cond. edge   branch      activity    crew delegation
Planning            node+gate    step+pause  activity    agent
Plan Review (HITL)  interrupt()  suspend()   signal      human_input
Execution           subgraph     parallel    child wf    task execution
Evaluation          node+gate    step+check  activity    agent
Promotion           cond. edge   step        activity    task
Memory              external     built-in    external    built-in
Checkpointing       built-in     built-in    built-in    ❌
```

---

## 4. The "Agent Harness" vs "Orchestration" Debate

Two projects were analyzed to clarify this distinction:

### GSD (Get Shit Done) — Level 1: Prompt Orchestration
- Installs structured prompt files into IDE-specific directories
- "Agents" are markdown templates, not processes
- No runtime, no state management — pure context engineering
- **Verdict:** Not orchestration. It's meta-prompting.

### oh-my-openagent — **Revised: Level 4: Stateful Plugin Orchestration**

The previous assessment (Level 2: Agent Harness) was based on the wrong repo. `code-yeongyu/oh-my-openagent` is a fundamentally different and far more sophisticated project:

- It's an **OpenCode plugin** (dual-published as `oh-my-opencode` / `oh-my-openagent` during a name transition) that extends Claude Code with a full multi-agent system
- **11 named specialized agents**: Sisyphus, Hephaestus, Oracle, Librarian, Explore, Atlas, Prometheus, Metis, Momus, Multimodal-Looker, Sisyphus-Junior — each with distinct roles
- **IntentGate classifier**: classifies user intent (research/implementation/investigation/evaluation/fix) before routing to the appropriate agent — this is real conditional routing, not prompt-layer dispatch
- **52 lifecycle hooks** across 4 tiers (Session → Tool-Guard → Transform → Continuation → Skill) — more sophisticated hook architecture than most standalone frameworks
- **Background agent execution** with 5 concurrent agents per model/provider, circuit breaker support
- **3-tier MCP system**: built-in remote MCPs + `.mcp.json` + skill-embedded MCPs
- **Session state with compaction**: context and todo preservation across compaction cycles
- 1766 TypeScript source files, 377k LOC — production-scale codebase

**Verdict:** This is **Level 4 (or arguably Level 4-5)** — not a harness. The binding to OpenCode's session lifecycle as a plugin is the main constraint vs. a free-standing workflow engine like LangGraph, but the richness of implementation (intent classification, named agents, circuit breakers, lifecycle hooks) is firmly Level 4 territory.

| Capability | oh-my-openagent | Level 2 (Harness) | Level 4 (Workflow) |
|---|:---:|:---:|:---:|
| Process isolation | plugin-bounded | ✅ | ✅ |
| State persistence | ✅ (session + compaction) | ❌ | ✅ |
| Conditional routing | ✅ (IntentGate) | ❌ | ✅ |
| Resource governance | ✅ (circuit breaker) | ❌ | varies |
| Named specialized agents | ✅ (11 agents) | ❌ | ✅ |

**Key innovation for your purposes:** The IntentGate + named-agent routing pattern is worth studying. It's essentially your Triage phase — classify intent, select the right agent configuration, then execute. The hook tier system (52 hooks in 4 tiers) is also a cleaner lifecycle model than most frameworks provide out of the box.

### Superpowers — Level 3: Methodology-as-Skills Orchestration

`obra/superpowers` (★ 158.9K — the most starred project in this entire survey) is fundamentally different from everything else in the table. It's not a workflow engine, not a code framework, not a plugin runtime. It's a **software development methodology packaged as composable SKILL.md files** that any AI coding agent reads and follows automatically.

- **Cross-tool by design**: ships as an official Claude Code marketplace plugin, OpenAI Codex plugin, Cursor plugin, OpenCode config, GitHub Copilot CLI plugin, and Gemini extension — same skills, every surface
- **14 skills covering the full dev lifecycle**: brainstorming → writing-plans → subagent-driven-development → test-driven-development → requesting-code-review → finishing-a-development-branch
- **Auto-triggering**: skills fire automatically based on context — the agent checks for relevant skills before any task; mandatory workflows, not suggestions
- **Subagent pipeline per task**: `write-plans` breaks work into 2-5 min tasks → `subagent-driven-development` dispatches a fresh subagent per task → two-stage review (spec compliance first, then code quality) → repeat until done
- **Context isolation is a first-class principle**: *"subagents should never inherit your session's context or history — you construct exactly what they need"* — prevents context drift across long autonomous runs
- **SessionStart hook**: single hook that triggers on startup/clear/compact to inject methodology context
- **Self-governing repo**: `.sisyphus/`-style workspace, 94% PR rejection rate, documented agent contribution rules in `AGENTS.md`

**Taxonomy placement:** The headline level is **3 (Structured Multi-Agent)** — explicit named agents (implementer, spec-reviewer, quality-reviewer), directed review pipeline, trigger conditions per skill. The plan-as-state model + `TodoWrite` tracking and session hook push toward Level 4 but without a persistent graph engine. It's best described as **Level 3 with a methodology layer above it** that very few projects have.

**Why it's different:** Most Level 3-4 projects orchestrate agents through *code* — state graphs, step functions, workflow definitions. Superpowers orchestrates agents through *methodology* — the skill files are the orchestration layer, interpreted by the agent's own reasoning rather than by a runtime. The agent *is* the runtime.

| Capability | Superpowers | Level 3 (Parallel Farm) | Level 4 (Workflow) |
|---|:---:|:---:|:---:|
| Named specialized agents | ✅ (implementer, 2 reviewers) | ❌ | ✅ |
| Directed review pipeline | ✅ (spec → quality → fix loop) | ❌ | ✅ |
| State persistence | ⚠️ (plan files + TodoWrite) | ⚠️ | ✅ |
| Auto-trigger conditions | ✅ (context-based skill selection) | ❌ | ❌ |
| Cross-tool portability | ✅ (6 platforms) | ❌ | ❌ |
| Framework dependency | None (skills = markdown) | varies | varies |

**Key innovation for your purposes:** The two-stage review loop (spec compliance → code quality → fix → re-review) is the most directly portable pattern for your Evaluation phase. Also: the skills-as-methodology model is a lightweight way to distribute methodology updates across teams without changing engine code.

### Why the term is so loose today
The community hasn't converged on terminology. Projects at Level 1-2 use "orchestration" because it sounds better than "prompt template" or "agent selector." The 10-level taxonomy gives you a precise vocabulary to cut through the marketing.

---

## 5. Patterns Worth Stealing

### From Shannon (Production multi-agent orchestration framework)

Shannon (`Kocoro-lab/Shannon`) is a production-ready multi-agent orchestration framework — not domain-specific. It ships with multi-strategy routing, Temporal-backed durable execution, WASI sandboxing, circuit breakers, token budgets, and full observability out of the box. Specific files to study:

| Pattern | File | What to Steal |
|---------|------|---------------|
| **Agent selection** | `workflows/agent_selection.go` | Epsilon-greedy + UCB1 algorithms for choosing which agent handles a task based on historical performance. Your triage phase could use this to route to the best-performing agent config. |
| **Execution state model** | `state/types.go` | `AgentState` with `PlanningState`, `ExecutionState`, `BeliefState`, `ToolResult[]`. Tracks current step, retry count, token usage, confidence, hypotheses. Basically what your `execution-unit.schema.json` becomes at runtime. Key methods: `CanRetry()`, `IsComplete()`, `GetTotalTokensUsed()`. |
| **Circuit breaker** | `circuitbreaker/circuit_breaker.go` | Classic closed→open→half-open pattern wrapping every LLM/DB/gRPC call. 5 consecutive failures = open circuit. Prevents runaway costs when a provider goes sideways. Has wrappers for HTTP, gRPC, Redis, and database calls. |
| **Policy engine** | `policy/config.go` | 3 enforcement modes: `off` / `dry-run` / `enforce`. **Canary rollout** with per-user/per-agent enforce percentage, SLO thresholds (max error rate, p95 latency, cache hit rate), and an emergency kill switch. Maps directly to your `policy.schema.json` autonomy levels. |
| **Budget manager** | `budget/manager.go` | Token/cost budgeting with idempotency and backpressure. Your `max_execution_steps` is a coarse version of this — Shannon does it at the token level with real cost tracking. |

**Key takeaway from Shannon:** Treat every external call (LLM, DB, API) as unreliable and wrap it with circuit breakers, budgets, rate controls, and policy gates. That's the production hardening layer most agent frameworks skip.

### From MetaGPT (Organizational SOP model)

MetaGPT's role-based model maps surprisingly well to the agentic-sdlc pipeline:

| File | What to Steal |
|------|---------------|
| `roles/role.py` | **Base agent class.** Defines `_think()` → `_act()` → `_react()` loop with message-based communication. Each role watches for specific message types. Clean abstraction — every role uses the same cognitive loop with different actions. |
| `team.py` | **The orchestrator.** `Team.run()` loops rounds: check budget → `env.run()` → repeat. `invest($10)` sets a hard cost ceiling; `NoMoneyException` kills the run. Simple but effective. |
| `strategy/planner.py` | **Human-in-the-loop planning.** `ask_review()` pauses for confirmation. Tasks can be confirmed, redone, or replanned based on feedback. Directly analogous to your 4 autonomy levels. `auto_run` mode = `fully_autonomous`; manual review = `supervised`. |
| `roles/engineer.py` | **Document-in → artifact-out.** Shows how a role receives a design doc and produces code — same pattern as your contract pipeline where each phase consumes the previous phase's output. |
| `strategy/task_type.py` | **Task classification.** Different guidance per task type, similar to Shannon's strategy routing but simpler. |

**How MetaGPT maps to your pipeline:**

```
Your Pipeline          →  MetaGPT Equivalent
────────────────────────────────────────────
Intake (task arrives)  →  team.run_project(idea)
Triage                 →  ProductManager._think()
Planning               →  strategy/planner.py — WritePlan + ask_review
Execution              →  Engineer._act() writes code
Evaluation             →  QAEngineer runs tests
Promotion              →  env.archive()
Budget gate            →  cost_manager + NoMoneyException
Human gate             →  planner.ask_review() with ReviewConst
```

**Key MetaGPT patterns:**
1. **Pub/sub message routing** — roles don't call each other directly; they publish `Message` objects
2. **`_think` → `_act` → `_react` loop** — every role uses the same cognitive loop
3. **Cost ceiling** — hard budget kills the run, not just warns
4. **Plan with human review** — supports both auto-run and manual modes

### From 12-Factor Agents — The Design Specification for Your Architecture

[12-factor-agents](https://github.com/humanlayer/12-factor-agents) (★ 19.4K) is not just "aligned" with agentic-sdlc — it reads like the design specification for what this repo builds. Written by Dex from HumanLayer after talking to 100+ production AI builders, it documents why the "bag of tools + loop" approach fails at 80% quality and what the engineering principles are to cross the line to production.

The core insight: **most successful production agents are mostly deterministic code, with LLM steps sprinkled in at exactly the right points.** That's what `contracts/v1/` formalizes — the deterministic skeleton that constrains where LLM steps can run.

**All 12 factors map directly to your contracts:**

| Factor | Principle | Your Contract / Design |
|--------|-----------|----------------------|
| 1 | Natural Language to Tool Calls | `execution-unit.schema.json` → `tool_calls[]` with name, status, trace_id |
| 2 | Own your prompts | Schema-driven inputs own the prompt surface; no framework black boxes |
| 3 | Own your context window | `memory.schema.json` — you control what enters context (ephemeral/session/persistent scope) |
| 4 | Tools are just structured outputs | `tool_calls[]` are structured outputs; the schema enforces shape |
| **5** | **Unify execution state and business state** | **Your contracts ARE the unified state — `task.status` is execution state; `plan.steps[]` is business state; one schema holds both** |
| **6** | **Launch/Pause/Resume with simple APIs** | **`policy.schema.json` autonomy_level gates — `interrupt()` at every HITL boundary** |
| **7** | **Contact humans with tool calls** | **The 4 autonomy levels in `policy.schema.json` are exactly this: human contact is a structured tool call, not a special mode** |
| **8** | **Own your control flow** | **Contract-driven phase transitions — the engine reads contracts, not the other way around** |
| 9 | Compact Errors into Context Window | `evaluation.schema.json` captures failure reason for retry context; `retryable: bool` controls re-entry |
| 10 | Small, Focused Agents | Each `execution-unit` is a single focused task; `max_execution_steps` enforces scope |
| 11 | Trigger from anywhere, meet users where they are | `task.schema.json` intake is channel-agnostic; `domain.schema.json` handles multi-repo triggers |
| **12** | **Make your agent a stateless reducer** | **Each pipeline phase is a pure function: contract-in → validate → transform → contract-out. No ambient state.** |

**The boldface factors are the ones where alignment is deepest — they're not just parallel ideas, they're the same idea expressed differently.**

Factor 6 deserves special attention: the 12-factor model says "Launch/Pause/Resume with simple APIs" — in your architecture this is `policy.schema.json`'s `autonomy_level` enum (`assistive → supervised → semi_autonomous → fully_autonomous`). The autonomy level IS the launch/pause/resume policy. At `supervised`, every plan is paused for human review before execution. At `fully_autonomous`, it runs straight through. The agent doesn't need to know which mode it's in — the contract enforces it.

Factor 12 is the deepest alignment: a stateless reducer takes input state, computes output state, with no side effects. That's what every node in your pipeline is — `task.schema.json` in + validation + LLM step = `plan.schema.json` out. The contracts define the input/output types. The engine is just the function that runs between them.

### From Superpowers (Skills-as-Methodology)

Superpowers (★ 158.9K) introduces patterns that no other project in this survey uses:

| Pattern | Mechanism | What to Steal |
|---------|-----------|---------------|
| **Two-stage review loop** | spec-reviewer → quality-reviewer → implementer fix → re-review | Direct template for your Evaluation phase. Run spec-compliance evaluation first (does the artifact match `execution-unit.schema.json` expectations?), then quality evaluation separately. |
| **Context isolation by construction** | Implementer subagent gets only what it needs; never inherits session context | When dispatching execution agents in your pipeline, construct their context from the contract inputs only. No ambient session state leaking in. |
| **Skills-as-methodology** | SKILL.md files the agent reads and follows automatically | A lightweight way to ship pipeline methodology updates to teams without changing engine code. Your `docs/onboarding/` could ship as skills that teams install alongside `.agentic/`. |
| **Auto-trigger conditions** | Agent checks for relevant skill before any task; triggers are context-based not manual | Replaces explicit routing tables. The agent self-selects the right workflow based on what phase it's in. |
| **Fresh-subagent-per-task principle** | Each task gets a clean context; coordinator holds the plan state | Maps directly to your `execution-unit.schema.json` — each unit gets only its inputs; the plan retains overall state. |

**Key Superpowers insight for your architecture:** The two-stage review (spec compliance → code quality) maps exactly to your Evaluation contract (`result: pass/fail`, `retryable: bool`). Run evaluation as two independent agents with different mandates rather than one combined evaluator — it catches more issues and makes failures more actionable.

### Complementary Strengths

| | Shannon | MetaGPT | Superpowers |
|---|---|---|---|
| **Strength** | Production infra (circuit breakers, budgets, policy, observability) | Agent design patterns (roles, SOPs, pub/sub, planning) | Review loop design, context isolation, cross-tool methodology distribution |
| **Weakness** | Infrastructure-heavy to adopt | No durability layer | Not a workflow engine — no persistent state graph |
| **What to steal** | How to make agents *resilient* | How to *model* agents as organizational roles | How to *review* agent output and isolate task context |

Shannon + MetaGPT + Superpowers + 12-factor-agents together cover production hardening, agent modeling, review quality, and foundational design principles — the four dimensions most frameworks handle poorly.

---

## 6. Strategy Going Forward

### Recommended Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Level 9: Contract-Driven Platform (your contracts/v1/)   │
│                                                           │
│   ┌───────────────────────────────────────────────────┐   │
│   │  Level 4-5: Workflow Engine                       │   │
│   │  (LangGraph + Shannon-inspired infra)             │   │
│   │                                                   │   │
│   │  ┌─────────────────────────────────────────────┐  │   │
│   │  │  MetaGPT-inspired role model                │  │   │
│   │  │  (Triager, Planner, Executor, Evaluator)    │  │   │
│   │  └─────────────────────────────────────────────┘  │   │
│   │                                                   │   │
│   │  Implements the 7-phase pipeline                  │   │
│   │  Validates against contracts/v1/ at every gate    │   │
│   │  Respects policy autonomy levels                  │   │
│   └───────────────────────────────────────────────────┘   │
│                                                           │
│   Future: Level 7 mesh for multi-repo coordination        │
└───────────────────────────────────────────────────────────┘
```

### Phase 1: Prototype (Now)

**Use LangGraph** — you've dabbled with it, and it has the best 1:1 mapping to your 7-phase pipeline.

- Each pipeline phase = a `StateGraph` node
- Gate logic = conditional edges
- `interrupt()` = human-in-the-loop gates from `policy.schema.json`
- Checkpointing = durable state that survives crashes
- Wrap each phase transition with contract validation (ajv against `contracts/v1/`)

```python
# Pseudocode for the integration pattern
graph = StateGraph(PipelineState)

graph.add_node("intake", intake_node)
graph.add_node("triage", triage_node)
graph.add_node("planning", planning_node)
graph.add_node("plan_review", human_gate)        # interrupt() if policy requires
graph.add_node("execution", execution_subgraph)   # DAG from plan.steps[].depends_on
graph.add_node("evaluation", evaluation_node)
graph.add_node("eval_review", human_gate)         # interrupt() based on autonomy level
graph.add_node("promotion", promotion_node)

# Every transition validates the output contract
graph.add_edge("intake", "triage")
graph.add_conditional_edges("triage", should_review_plan)  # checks autonomy_level
# ... etc
```

### Phase 2: Production Hardening

**Add Shannon-inspired infrastructure** around the LangGraph core:

| Component | Purpose | Shannon Reference |
|-----------|---------|-------------------|
| Circuit breakers | Wrap every LLM/external call | `circuitbreaker/circuit_breaker.go` |
| Budget manager | Token/cost tracking per task | `budget/manager.go` |
| Policy engine | Enforce/dry-run/off modes | `policy/config.go` + `policy/engine.go` |
| Observability | Metrics, tracing, logging | `metrics/`, `tracing/` |
| Rate control | Prevent LLM provider throttling | `ratecontrol/` |
| Degradation | Graceful fallback when providers are down | `degradation/` |

Consider migrating the durable execution layer to **Temporal** or **Inngest** at this stage if LangGraph's checkpointing proves insufficient.

### Phase 3: Multi-Repo Scale (Future)

**Adopt A2A protocol (Level 7)** when the platform spans multiple repositories:

- Each repo's engine becomes an A2A-compliant service
- `domain.schema.json` cross-repo dependencies realized through A2A endpoints
- Repo A's deployment agent notifies Repo B's integration agent
- Cross-repo evaluation (Repo A's change passes Repo B's tests)

### Anti-Pattern to Avoid

**Don't jump to Level 8 (Emergent orchestration).** Your contracts exist precisely to prevent unpredictable agent behavior. Emergent coordination is fascinating for research but antithetical to governed SDLC pipelines where you need deterministic, auditable phase transitions.

---

## 7. Full Project Reference Table

| Project | Stars | Language | Level | Key Innovation |
|---------|------:|----------|:-----:|---------------|
| [Superpowers](https://github.com/obra/superpowers) | 158.9K | Shell/MD | 3 | Skills-as-methodology: composable SKILL.md files that auto-trigger across 6 AI coding tools |
| [MetaGPT](https://github.com/geekan/MetaGPT) | 67.2K | Python | 6 | SOP-driven org model: `Code = SOP(Team)` |
| [AutoGen](https://github.com/microsoft/autogen) | 57.2K | Python/.NET | 5 | Graph-based + A2A + declarative + time-travel |
| [GSD](https://github.com/gsd-build/get-shit-done) | 54.7K | TypeScript | 1 | Meta-prompting / context engineering |
| [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | 52.6K | TypeScript | 4 | OpenCode plugin: 11 named agents, IntentGate classifier, 52 lifecycle hooks, circuit breakers |
| [CrewAI](https://github.com/crewAIInc/crewAI) | 49.2K | Python | 4 | Accessible agent + task + crew abstraction |
| [ruflo](https://github.com/ruvnet/ruflo) | 32.3K | TypeScript | 6 | Enterprise swarm intelligence for Claude |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 29.6K | Python/JS | 4 | StateGraph with checkpointing and human gates |
| [Mastra](https://github.com/mastra-ai/mastra) | 23.1K | TypeScript | 4 | TypeScript-native with suspend/resume |
| [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | 22.3K | Python | 0-2 | Official OpenAI agent primitives |
| [OpenAI Swarm](https://github.com/openai/swarm) | 21.3K | Python | 2 | Educational lightweight handoff pattern (superseded by Agents SDK) |
| [Generative Agents](https://github.com/joonspk-research/generative_agents) | 21.1K | Python | 8 | Emergent social behavior from memory/reflection |
| [12-factor-agents](https://github.com/humanlayer/12-factor-agents) | 19.4K | TypeScript/Docs | 9 | Design specification for contract-driven agents — all 12 principles map directly to `contracts/v1/` |
| [Swarms](https://github.com/kyegomez/swarms) | 6.2K | Python | 4-6 | Enterprise multi-agent with many topologies |
| [Solace Agent Mesh](https://github.com/SolaceLabs/solace-agent-mesh) | 3.2K | Python | 7 | Event broker mesh with A2A protocol |
| [Claude-Code-Workflow](https://github.com/catlog22/Claude-Code-Workflow) | 1.8K | JSON/MD | 3 | Cadence-team parallel agent coordination |
| [Shannon](https://github.com/Kocoro-lab/Shannon) | 1.7K | Go/Rust/Python | 5 | 8-strategy routing + Temporal + WASI sandbox |
| [jido](https://github.com/agentjido/jido) | 1.7K | Elixir | 8 | Distributed autonomous agents on BEAM VM |
| [KaibanJS](https://github.com/kaiban-ai/KaibanJS) | 1.4K | JavaScript | 4 | Kanban-inspired multi-agent state management |
| [Chidori](https://github.com/ThousandBirdsInc/chidori) | 1.3K | Rust | 8 | Reactive durable runtime with time-travel |
| [Agent-MCP](https://github.com/rinadelph/Agent-MCP) | 1.2K | TypeScript | 7 | Multi-agent via Model Context Protocol |
| [python-a2a](https://github.com/themanojdesai/python-a2a) | 986 | Python | 7 | Google A2A protocol implementation |
| [claude_code_agent_farm](https://github.com/Dicklesworthstone/claude_code_agent_farm) | 784 | Python | 3 | 20-50+ parallel Claude agents with locks |

---

*Research covered 22 GitHub projects across Go, Rust, Python, TypeScript, JavaScript, and Elixir ecosystems, ranging from 380 to 67K stars.*
