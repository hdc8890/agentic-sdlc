# Versioning Policy

This repository treats the semantic model and machine-readable schemas as **versioned contracts**.

## Versioning rules

### Major

Increment the major version when a change:

- removes a field
- changes field meaning
- tightens validation in a breaking way
- changes required execution semantics

### Minor

Increment the minor version when a change:

- adds optional fields
- adds clarifying guidance without changing meaning
- adds non-breaking examples or extensions

### Patch

Increment the patch version when a change:

- fixes typos
- fixes examples
- improves wording without changing semantics

## Normative vs illustrative content

The following are **normative**:

- documents under `docs/specs/`
- machine-readable schemas under `schemas/`
- conformance rules under `governance/`

The following are **illustrative** unless explicitly marked otherwise:

- examples under `examples/`
- diagrams and explanatory architecture docs
- layer README files

## Compatibility expectations

- New implementations should target the latest major version they support.
- Older implementations may continue to exist as long as they declare the schema version they emit and consume.
- Reference examples must state which contract version they demonstrate.
