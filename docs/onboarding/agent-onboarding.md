# Agent Onboarding Guide

This guide is written for AI agents. If you are an AI agent tasked with onboarding a repository to the Agentic SDLC platform, follow every step below in order.

---

## What you are doing

You are adding two configuration files to the repository:

```
<repo-root>/
  .agentic/
    profile.json   # Describes the repo to the orchestration engine
    policy.json    # Controls how autonomously the platform acts
```

The platform reads these files before doing anything in the repo. Your job is to scaffold them, fill them in accurately, and validate them against the contracts.

---

## Before you start

**Read these files from this repository (agentic-sdlc) to understand the contracts:**

- `contracts/v1/profile.schema.json` — the schema `profile.json` must conform to
- `contracts/v1/policy.schema.json` — the schema `policy.json` must conform to
- `docs/architecture/autonomy-levels.md` — explains what each autonomy level means

**Check the example for reference:**

- `examples/onboarded-repo/.agentic/profile.json`
- `examples/onboarded-repo/.agentic/policy.json`

---

## Step 1: Preflight check

Before running any commands, check whether `.agentic/` already exists in the target repo.

- **If `.agentic/` does NOT exist** → proceed to Step 2.
- **If `.agentic/` already exists** → skip Step 2 (do not run `agentic init`). Go directly to Step 3 to regenerate the profile, but be careful: `agentic profile --generate` will overwrite detected fields. Review the existing `profile.json` first and preserve any manually curated values (especially `protected_paths`, `commands`, and `working_roots`).

---

## Step 2: Install CLI and scaffold

```bash
npm install -g @agentic-sdlc/cli
agentic init
```

This creates `.agentic/profile.json` and `.agentic/policy.json` with starter values.

---

## Step 3: Auto-detect repo context

```bash
agentic profile --generate
```

This inspects the repo and populates `profile.json` with detected ecosystems, commands, protected paths, and CI config. The output is a starting point — you must review and correct it in the next step.

---

## Step 4: Review and correct profile.json

Open `.agentic/profile.json` and verify every field. The following fields require attention:

### Required fields (must be accurate)

| Field | What to do |
|---|---|
| `schema_version` | Must be `"v1"`. Do not change. |
| `id` | Should be the repo name (e.g., `"my-service"`). Verify it matches. |
| `repository.owner` | **The CLI cannot detect this.** Set it to the actual GitHub org or user. |
| `repository.name` | Verify it matches the actual repo name. |
| `working_roots` | Verify these are the directories the platform should work in. For a single-root repo, `["."]` is correct. For monorepos, list each package/service directory. |
| `commands.test` | Verify this is the actual test command for the repo. |
| `commands.lint` | Verify this is the actual lint command. |
| `commands.build` | Verify this is the actual build command. |
| `protected_paths` | Review the detected paths. Add any sensitive paths the CLI missed (e.g., auth modules, migration directories, CI workflows, infrastructure config). |

### Optional fields (add if applicable)

| Field | When to include |
|---|---|
| `repository.default_branch` | Include if the default branch is not `main`. |
| `ecosystems` | Array of languages/runtimes (e.g., `["node", "python"]`). Usually auto-detected. |
| `ci.provider` | e.g., `"github_actions"`, `"circleci"`. |
| `ci.required_checks` | Array of CI check names that must pass. |
| `pull_request.provider` | e.g., `"github"`. |
| `pull_request.required_approvals` | Number of required PR approvals. |

### Stop conditions — do NOT proceed if:

- `repository.owner` is still `"<github-org>"` or any placeholder value
- `commands` contain placeholder or incorrect commands
- You are unsure about `protected_paths` and have not asked the human

**If you cannot determine any of these values from the repo, ask the human.** Do not guess.

---

## Step 5: Configure policy.json

Open `.agentic/policy.json` and set the team's policy.

### Default recommendation

If the human has not specified preferences, use this safe starting configuration:

```json
{
  "schema_version": "v1",
  "autonomy_level": "semi_autonomous",
  "require_human_review_on": [
    "protected_path_changes",
    "security_related",
    "dependency_changes",
    "schema_changes"
  ],
  "auto_merge": false,
  "max_execution_steps": 10,
  "task_type_overrides": {
    "docs": {
      "autonomy_level": "bounded_autonomous",
      "require_human_review_on": []
    },
    "ktlo": {
      "autonomy_level": "bounded_autonomous",
      "require_human_review_on": ["protected_path_changes"]
    }
  }
}
```

### Decision logic for autonomy level

- **`assistive`** — use if the human explicitly wants agent-as-advisor only, or for security-critical repos
- **`semi_autonomous`** — use as the default for most teams. Agent works, human approves plan and PR.
- **`bounded_autonomous`** — use only if the human explicitly requests it and the repo has strong test coverage
- **`fully_autonomous`** — use only if the human explicitly requests it. Never set this as default.

### Fields that require human input

| Field | Why |
|---|---|
| `autonomy_level` | Ask the human if they have a preference. Default to `semi_autonomous`. |
| `notification_channels` | Do not guess Slack channels or email addresses. Ask the human or omit. |
| `auto_merge` | Default `false`. Only set `true` if the human explicitly requests it. |

---

## Step 6: Validate

```bash
agentic validate
```

This validates both files against the contracts in `contracts/v1/`. Fix any errors before proceeding.

---

## Step 7: Commit

```bash
git add .agentic/
git commit -m "chore: onboard to Agentic SDLC platform"
```

---

## Done criteria

You are done when ALL of these are true:

- [ ] `.agentic/profile.json` exists with accurate, non-placeholder values
- [ ] `.agentic/policy.json` exists with a valid autonomy configuration
- [ ] `repository.owner` is set to the real GitHub org/user (not a placeholder)
- [ ] `commands` are verified against actual repo tooling
- [ ] `protected_paths` includes sensitive directories
- [ ] `agentic validate` passes with no errors
- [ ] Files are committed to the repo

---

## Common questions an agent might have

**Q: What if the repo has no test/lint/build commands?**
A: Omit the missing command fields. Only include commands that actually exist.

**Q: What if I can't determine the GitHub org?**
A: Ask the human. Never commit a placeholder org name.

**Q: Should I read the full contract schemas?**
A: Yes. The canonical schemas are at `contracts/v1/profile.schema.json` and `contracts/v1/policy.schema.json`. Read them to understand all valid fields and constraints.

**Q: What if `.agentic/` was partially set up?**
A: Do not run `agentic init` again. Review existing files, fill in missing fields, correct inaccuracies, and validate.
