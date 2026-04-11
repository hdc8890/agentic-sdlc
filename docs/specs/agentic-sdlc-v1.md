# Agentic SDLC Specification (v1)

## Overview

The Agentic SDLC defines a standardized model for how autonomous and semi-autonomous agents participate in the software development lifecycle.

This specification establishes:

- Core abstractions
- Execution lifecycle
- System boundaries
- Contracts between orchestration, memory, and evaluation systems

This is a **framework-agnostic specification**.

---

## Core Principles

1. **Framework Agnostic**
   - Orchestration engines (LangGraph, AutoGen, custom) must conform to this model, not define it.
2. **Composable**
   - Each component (planning, execution, evaluation, memory) is independently replaceable.
3. **Observable**
   - All agent actions must be traceable, inspectable, and auditable.
4. **Progressive Autonomy**
   - Systems must support increasing levels of autonomy with human oversight.

---

## Core Abstractions

### 1. Task

A Task represents a unit of work derived from the SDLC.

Examples:

- Feature implementation
- Bug fix
- Refactor
- KTLO (keep-the-lights-on)

```text
Task {
  id
  type
  description
  acceptance_criteria
  priority
  constraints
}
```

### 2. Plan

A Plan is a structured decomposition of a Task into executable steps.

Properties:

- Ordered or DAG-based
- May include conditional branches
- Can be iteratively refined

```text
Plan {
  steps[]
  dependencies[]
  success_criteria
}
```

### 3. Execution Unit

The smallest actionable unit performed by an agent.

Examples:

- Generate code
- Modify file
- Write test
- Query system

```text
ExecutionUnit {
  input_context
  action
  tool_calls[]
  output_artifacts[]
}
```

### 4. Artifact

Artifacts are outputs produced during execution.

Types include:

- Source code
- Test files
- Documentation
- Config changes

```text
Artifact {
  type
  location
  content
  metadata
}
```

### 5. Evaluation

Evaluation determines whether outputs meet quality standards.

Types include:

- Test execution
- Static analysis
- LLM-based critique
- Diff scoring

```text
Evaluation {
  result (pass/fail)
  score
  feedback
  retryable (boolean)
}
```

### 6. Memory

Memory provides context across execution.

Layers:

- **Ephemeral**: current step context
- **Session**: task-level context
- **Persistent**: org-level knowledge

```text
Memory {
  context
  embeddings
  history
}
```

### 7. Promotion

Promotion represents progression toward production readiness.

Stages:

- Draft
- PR Created
- Approved
- Merged
- Deployed

---

## Execution Lifecycle

### 1. Task Ingestion

- Input from a ticketing system or manual trigger

### 2. Planning

- Task to Plan decomposition
- May involve iterative refinement

### 3. Execution Loop

```text
while not complete:
  execute step
  evaluate result

  if fail:
    retry or replan
```

### 4. Evaluation Gate

All artifacts must pass defined evaluation criteria, including:

- Tests
- Linting
- Heuristic checks
- Risk scoring

### 5. Promotion

- Create PR
- Attach artifacts
- Provide summary and reasoning
- Human or automated approval

---

## System Layers

### 1. Semantic Layer

Defines the shared abstractions and versioned contracts.

### 2. Orchestration Layer

Responsible for:

- Workflow execution
- State transitions
- Retry logic

### 3. Capability Layer

Shared services:

- Memory system
- Tool integrations (Git, CI, Jira)
- Evaluation engine

### 4. Experience Layer

User-facing systems:

- CLI
- UI
- Developer workflows

---

## Autonomy Levels

1. **Assistive**
   - Human-driven with agent suggestions
2. **Semi-Autonomous**
   - Agent executes, human approves
3. **Autonomous (Bounded)**
   - Agent operates within constraints
4. **Fully Autonomous**
   - End-to-end execution without intervention

---

## Non-Goals (v1)

- Defining a specific orchestration framework
- Locking into a specific memory implementation
- Defining UI/UX patterns

---

## Future Extensions

- Multi-agent coordination protocols
- Cross-task learning
- Organizational memory graphs
- Risk-aware deployment strategies

---

## Related documents

- Versioning policy: [`versioning.md`](versioning.md)
- Cross-layer contracts: [`interface-contracts.md`](interface-contracts.md)
- Evaluation and promotion: [`evaluation-promotion.md`](evaluation-promotion.md)
