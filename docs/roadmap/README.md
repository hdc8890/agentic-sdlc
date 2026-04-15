# Roadmap and planning

This directory holds **persistent planning artifacts** for the Agentic SDLC platform.

Unlike the session plan used during live agent work, the files here are meant to be:

- versioned in the repository
- reviewed through normal Git workflows
- updated over time as direction changes
- reusable by both humans and agents

## What belongs here

- roadmap documents for major platform directions
- brownfield or greenfield rollout plans
- iteration plans for concrete implementation slices
- reusable planning templates

## What does not belong here

- scratch notes for one coding session
- agent-only temporary plans
- duplicate copies of canonical specs

## Current planning artifacts

- [`brownfield-adoption-plan.md`](brownfield-adoption-plan.md): the current rollout plan for making the platform work with existing repositories.
- [`templates/iteration-plan-template.md`](templates/iteration-plan-template.md): the default template for future roadmap and implementation planning.

## How to use this directory

1. Start with a roadmap or iteration document in this directory.
2. Link the plan to the relevant architecture, layer, spec, and example artifacts.
3. Update the plan as major decisions change.
4. Keep implementation details in the repo areas they affect; keep rationale and sequencing here.
