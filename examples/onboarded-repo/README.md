# Onboarded repo example

This directory shows what `.agentic/` looks like in a real, onboarded repository.
The files here are a snapshot from [`hdc8890/meal-planner`](https://github.com/hdc8890/meal-planner),
the first repo to adopt the platform.

```
.agentic/
  profile.json   # capabilities: ecosystems, commands, protected paths
  policy.json    # autonomy: review gates, per-task overrides
  domain.json    # domain identity: repos, ownership, conventions
```

## What to copy

- **Always**: `profile.json` and `policy.json`. The orchestration engine refuses
  to run without them.
- **Once per domain**: `domain.json`. A single-repo domain still benefits from
  this — it captures conventions (branching, testing, release) that the
  planner uses.

## Validating

```bash
cd your-repo
agentic validate
```

The CLI checks each file against `contracts/v1/*.schema.json`. CI should run
`agentic validate` on every PR that touches `.agentic/`.

## Notes on this specific snapshot

- `working_roots` is `[".", "frontend"]` because the repo is a Rust workspace
  with a co-located React frontend.
- `protected_paths` deliberately includes `/.agentic/*` so changes to the
  contract files themselves require human review.
- `policy.json` sets `autonomy_level: semi_autonomous` with type-overrides
  loosening to `bounded_autonomous` for `docs` and `ktlo` tasks.
