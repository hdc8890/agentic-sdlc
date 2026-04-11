# Conformance Policy

Implementations conform to the Agentic SDLC platform when they honor the shared contracts and boundaries defined in this repository.

## Minimum conformance expectations

An implementation should:

1. declare the contract version it supports
2. emit or consume the canonical semantic entities without redefining their meaning
3. preserve traceability across layer boundaries
4. return machine-actionable evaluation results
5. expose promotion state in a way that maps to the canonical promotion model

## Evidence of conformance

Recommended evidence includes:

- example payloads
- schema validation
- interface mapping documentation
- end-to-end flow demonstrations

## Non-conformance examples

The following would be considered non-conformant:

- changing the meaning of `Task` or `Evaluation` while still claiming the same version
- hiding evaluation failure semantics behind opaque success messages
- coupling the platform definition to one framework-specific runtime model
