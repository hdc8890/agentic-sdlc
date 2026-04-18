# Team Onboarding Guide

This guide walks an engineering team through joining the Agentic SDLC platform. Onboarding is a collaborative, manual process — you'll use the CLI to scaffold configuration, then review and tune it with your team's knowledge of the domain.

---

## What you're setting up

You're adding two files to your repo:

```
your-repo/
  .agentic/
    profile.json   # Describes your repo to the orchestration engine
    policy.json    # Controls how autonomously the platform acts in your repo
```

The platform reads these files before doing anything in your repo. If they don't exist, nothing runs. This means you stay in control: the platform adapts to your repo, not the other way around.

---

## Step 1: Install the CLI

```bash
npm install -g @agentic-sdlc/cli
```

---

## Step 2: Scaffold .agentic/

In your repo root:

```bash
agentic init
```

This creates `.agentic/profile.json` and `.agentic/policy.json` with starter values. The scaffolded files are a starting point — the next step fills them in.

---

## Step 3: Auto-detect repo context

```bash
agentic profile --generate
```

This inspects your repo and populates `profile.json` with detected ecosystems, commands, protected paths, and CI config. Review the output — it captures the obvious stuff, but tribal knowledge and domain-specific nuances need manual additions.

---

## Step 4: Review and tune

Open `.agentic/profile.json` and check these fields:

### `repository.owner`
The CLI can't detect your GitHub org. Set this to your org name:
```json
"repository": {
  "owner": "your-actual-org",
  "name": "your-repo"
}
```

### `commands`
Verify the detected commands match how your team actually runs tests, lint, and builds:
```json
"commands": {
  "test": "npm test",
  "lint": "npm run lint",
  "build": "npm run build"
}
```

### `protected_paths`
Add any paths the tool missed. These paths will always require human review before any agent modifies them:
```json
"protected_paths": [
  "/.github/workflows/*",
  "/src/auth/*",
  "/migrations/*",
  "/infra/*"
]
```

### `working_roots`
For monorepos, list the directories the platform is allowed to work in:
```json
"working_roots": [".", "packages/api", "packages/web"]
```

---

## Step 5: Choose your autonomy level

Edit `.agentic/policy.json` to set the autonomy level for your team. Start conservative — you can increase autonomy after the pilot proves itself.

| Level | What it means | Good for |
|---|---|---|
| `assistive` | Platform suggests, humans do all the work | First week of adoption |
| `semi_autonomous` | Platform executes, pauses for human review before promoting | Most teams starting out |
| `bounded_autonomous` | Platform executes and promotes within defined guardrails | Teams comfortable with the platform |
| `fully_autonomous` | Platform operates end-to-end with post-hoc review | High-trust automation, low-risk task types |

**Recommendation:** Start all teams at `semi_autonomous`. Use `task_type_overrides` to allow `docs` and `ktlo` tasks to run at `bounded_autonomous` — these are lower-risk and good candidates for higher autonomy early on.

---

## Step 6: Validate and commit

```bash
agentic validate

git add .agentic/
git commit -m "chore: onboard to Agentic SDLC framework"
git push
```

---

## Keeping your profile up to date

Re-run profile detection whenever your repo changes significantly:

```bash
agentic profile --generate
```

---

## Questions?

- Is my repo ready to onboard? → Run `agentic validate` — if it passes, you're ready.
- What if profile detection gets commands wrong? → Edit `.agentic/profile.json` manually. The generated values are a starting point.
- What if my team wants a different autonomy level per task type? → Use `task_type_overrides` in `policy.json`.
- How do I connect to the orchestration engine? → See the orchestration integration guide (coming as the pilot progresses).
