# AI Platform Working Group

## Purpose

Maintain the shared Agentic SDLC platform contracts and coordinate changes across the orchestration engine, memory service, and experience tooling.

## Responsibilities

- steward the versioned contracts in `contracts/v1/`
- review proposed changes to schemas and platform entities
- approve breaking changes and version strategy
- coordinate alignment between orchestration, memory, and experience owners

## Suggested participants

- orchestration engine owners
- memory service owners
- experience tooling owner (CLI, developer surfaces)
- platform architect or repo maintainer

## Decision scope

The working group should review:

- contract changes under `contracts/v1/`
- new platform entities or fields
- changes that affect the onboarding process or domain model

## Operating principle

Prefer convergence on shared contracts over standardizing on a single implementation.
