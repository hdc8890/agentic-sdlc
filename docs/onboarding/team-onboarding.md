# Team Onboarding Guide

This guide walks an engineering team through joining the Agentic SDLC platform. Onboarding takes about 15 minutes and produces a PR for your team to review before anything runs against your repository.

---

## What you're setting up

You're adding two files to your repo:

```
your-repo/
  .agentic/
    profile.json   # Describes your repo to the orchestration engine
    policy.json    # Controls how autonomously the platform acts in your repo
```

The platform reads these files before doing anything in your repo. If they don't exist, nothing runs. This means you stay in control: the platform adopts to your repo, not the other way around.

---

## Option A: CI-driven onboarding (recommended)

This runs entirely in GitHub Actions and opens a PR for your team to review.

**Step 1:** Add the onboarding workflow to your repo:

```yaml
# .github/workflows/agentic-onboard.yml
name: Agentic SDLC Onboard

on:
  workflow_dispatch:

jobs:
  onboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/agentic-sdlc@v1
        with:
          command: init
          autonomy_level: semi_autonomous

      - uses: your-org/agentic-sdlc@v1
        with:
          command: profile-generate

      - uses: peter-evans/create-pull-request@v6
        with:
          title: 'chore: onboard to Agentic SDLC framework'
          body: |
            This PR adds `.agentic/` configuration for the Agentic SDLC platform.

            **Review checklist:**
            - [ ] Confirm `profile.json` test/lint/build commands are correct
            - [ ] Adjust `policy.json` autonomy level for your team
            - [ ] Add protected paths the tool didn't detect
            - [ ] Set `repository.owner` to your GitHub org
          branch: agentic/onboarding
          commit-message: 'chore: add .agentic/ onboarding config'
```

**Step 2:** Go to Actions → Agentic SDLC Onboard → Run workflow.

**Step 3:** Review the generated PR. See [Reviewing your profile](#reviewing-your-profile) below.

**Step 4:** Merge the PR. Your repo is onboarded.

---

## Option B: Local CLI onboarding

```bash
# Install the CLI
npm install -g @agentic-sdlc/cli

# In your repo root:
agentic init
agentic profile --generate
agentic validate

# Review, then commit
git add .agentic/
git commit -m "chore: onboard to Agentic SDLC framework"
git push
```

---

## Reviewing your profile

After generation, open `.agentic/profile.json` and check these fields:

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
  "test": "npm test",        // or "cargo test", "pytest", etc.
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

## Choosing your autonomy level

Edit `.agentic/policy.json` to set the autonomy level for your team. Start conservative — you can increase autonomy after the pilot proves itself.

| Level | What it means | Good for |
|---|---|---|
| `assistive` | Platform suggests, humans do all the work | First week of adoption |
| `semi_autonomous` | Platform executes, pauses for human review before promoting | Most teams starting out |
| `bounded_autonomous` | Platform executes and promotes within defined guardrails | Teams comfortable with the platform |
| `fully_autonomous` | Platform operates end-to-end with post-hoc review | High-trust automation, low-risk task types |

**Recommendation:** Start all teams at `semi_autonomous`. Use `task_type_overrides` to allow `docs` and `ktlo` tasks to run at `bounded_autonomous` — these are lower-risk and good candidates for higher autonomy early on.

---

## Adding the validation CI check

After onboarding, add this workflow to keep your `.agentic/` config valid as the repo evolves:

```yaml
# .github/workflows/agentic-validate.yml
name: Agentic SDLC Validate

on:
  push:
    paths: ['.agentic/**']
  pull_request:
    paths: ['.agentic/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/agentic-sdlc@v1
        with:
          command: validate
```

---

## Keeping your profile up to date

Re-run profile detection whenever your repo changes significantly:

```bash
agentic profile --generate
```

Or add a scheduled workflow to detect drift:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'   # Every Monday morning
  workflow_dispatch:
```

---

## Questions?

- Is my repo ready to onboard? → Run `agentic validate` — if it passes with no `.agentic/` errors, you're ready.
- What if profile detection gets commands wrong? → Edit `.agentic/profile.json` manually. The generated values are a starting point.
- What if my team wants a different autonomy level per task type? → Use `task_type_overrides` in `policy.json`.
- How do I connect to the orchestration engine? → See the orchestration integration guide (coming as the pilot progresses).
