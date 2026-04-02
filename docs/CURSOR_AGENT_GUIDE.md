# Running the Agent Team with Cursor

This guide explains how to operate the multi-agent pipeline defined in
[`AGENT_TEAM_PIPELINE.md`](./AGENT_TEAM_PIPELINE.md) using Cursor's Background
Agent feature. Each pipeline role maps to a specific agent invocation with a
tailored prompt.

---

## Prerequisites

1. **Repository access** — the repo must be connected to Cursor (Settings >
   General > GitHub).
2. **Background Agents enabled** — toggle on in Settings > Features > Background
   Agent (or use the cloud dashboard at `cursor.com`).
3. **Labels synced** — run the label bootstrap once (see §7 below) so agents
   can reference labels.
4. **`AGENTS.md` is in the repo root** — Cursor auto-injects this as system
   context for every agent session.

---

## How It Works

Cursor Background Agents run in isolated cloud VMs. Each agent:

- Gets a fresh clone of the repo on a dedicated branch.
- Has full terminal, file system, and `gh` CLI access.
- Reads `AGENTS.md` automatically as workspace rules.
- Can create commits, push branches, and open/update PRs.
- Communicates with other agents **only through Git artifacts** (branches,
  PRs, issues, labels, commit messages).

You launch agents by giving them a **prompt** (the task instruction). The
prompt is where you assign the role, scope the work, and point the agent at
the right context.

---

## Agent Invocation Patterns

### Pattern 1: Planner Agent — Break Down a Milestone

Use this when you have a broad goal and want to decompose it into trackable
issues with labels and acceptance criteria.

**When to launch:** At the start of a new roadmap phase or when you have a
large feature idea.

**Prompt template:**

```
You are the PLANNER agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

Break down the following goal into GitHub issues:

  "<your goal here — e.g., Implement win/lose conditions and level progression>"

For each issue:
1. Title: [<scope>] <imperative verb phrase>
2. Body: context, acceptance criteria (checkboxes), affected systems
3. Labels: apply type, scope, priority from .github/labels.yml
4. If issues have dependencies, note them in the body

Create the issues using `gh issue create`. Do NOT write any code.
Summarize the issues you created at the end.
```

**Example invocation:**

> Break down Phase 3 (UX and mobile polish) from docs/ROADMAP.md into
> individual GitHub issues. Apply appropriate labels from .github/labels.yml.
> Prioritize viewport-safe menu work as high, everything else as medium.

---

### Pattern 2: Implementer Agent — Build a Feature

Use this when there is an existing issue (or a clear task) ready for
implementation.

**When to launch:** When an issue has `status: ready` and you want an agent to
code it.

**Prompt template:**

```
You are the IMPLEMENTER agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

Pick up issue #<N>: "<issue title>"

Requirements:
- Create a branch named feature/<scope>-<short-description>
- Follow conventional commit format: <type>(<scope>): <summary>
- Ensure npm test passes and npm run build succeeds
- Use the PR template at .github/PULL_REQUEST_TEMPLATE.md
- Reference the issue in the PR body: Closes #<N>
- If this changes gameplay behavior, update docs in the same PR
- If this requires a new architectural decision, create an ADR in docs/adr/

Implementation guidance:
  <any specific technical direction or constraints>
```

**Example invocation:**

> Implement issue #12: [WaveSystem] Add explicit win condition when all waves
> are survived. Branch: feature/waves-win-condition. The win check should live
> in WaveDirector and emit a GAME_WON event through EventBus. Add a test in
> tests/ that verifies the event fires after the last wave completes.

---

### Pattern 3: Reviewer Agent — Review a PR

Use this when a PR is open and needs review before merge.

**When to launch:** When a PR has `status: review` label or is marked Ready
for Review.

**Prompt template:**

```
You are the REVIEWER agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

Review PR #<N>: "<PR title>"
URL: <PR URL>

Review checklist:
1. PR template is fully filled out
2. CI status is green
3. Code follows playbook guardrails (§2-§5 of AGENT_PLAYBOOK.md)
4. Conventional commits are used
5. Docs are updated if behavior changed
6. No unresolved TODOs/FIXMEs
7. Tests cover the new behavior

Leave review comments using these prefixes:
- [MUST] — blocks merge, must be fixed
- [SHOULD] — strongly recommended improvement
- [NIT] — optional polish

Approve the PR if there are no [MUST] items. Otherwise request changes.
Post your review as a PR comment summarizing your findings.
```

**Example invocation:**

> Review PR #15 (feat(waves): add win/lose conditions). Check that the
> WaveDirector correctly emits GAME_WON/GAME_LOST events, that tests cover
> edge cases, and that the HUD overlay doesn't break mobile viewport safety.
> Use [MUST]/[SHOULD]/[NIT] prefixes. Approve or request changes.

---

### Pattern 4: Doc Writer Agent — Update Documentation

Use this for documentation-only changes: new ADRs, playbook updates, decision
log sync.

**When to launch:** After a feature ships and docs need updating, or when a
new architectural decision needs to be recorded.

**Prompt template:**

```
You are the DOC WRITER agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

Task: <describe the documentation work>

Rules:
- Branch: docs/<short-description>
- Do not modify any code files (src/, tests/, index.html)
- If writing an ADR, use the next number in sequence (check docs/adr/)
- Update docs/DECISION_LOG.md if the ADR changes "what is currently true"
- Update docs/README.md document map if adding new docs
- Use conventional commits: docs(<scope>): <summary>
```

**Example invocation:**

> Write ADR 0018 documenting the decision to use WebSocket-based multiplayer.
> Update DECISION_LOG.md to reflect the new architecture choice. Update the
> docs/README.md decision snapshot.

---

### Pattern 5: CI Watcher Agent — Triage Build Failures

Use this when a CI run fails and you need diagnosis and a fix.

**When to launch:** When you see a red CI check on `main` or on a PR.

**Prompt template:**

```
You are the CI WATCHER agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

The CI workflow failed on <branch or PR reference>.

Tasks:
1. Use `gh run list` and `gh run view --log` to find the failure
2. Diagnose the root cause
3. If the fix is in CI config, create a branch chore/ci-<description> and PR
4. If the fix is in code, open an issue with type: bug + priority: critical
   describing the failure and tagging the affected scope
5. Summarize your findings
```

---

### Pattern 6: Integrator Agent — Merge and Verify

Use this when PRs are approved and need final merge + deployment verification.

**When to launch:** When one or more PRs have approvals and green CI.

**Prompt template:**

```
You are the INTEGRATOR agent for the israel-td project.

Read docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md.

Tasks:
1. List open PRs with `gh pr list`
2. For each approved PR with green CI:
   - Verify no outstanding [MUST] review comments
   - Squash merge feature/fix branches
   - Merge commit for docs/chore branches
3. After merging, verify the deploy workflow triggers on main:
   - `gh run list --branch main`
   - If deployment fails, open a critical bug issue
4. Summarize what was merged and deployment status
```

---

## Parallel Agent Strategies

You can launch multiple agents simultaneously for independent work. Here are
the most useful patterns:

### Fan-out: Implement multiple independent issues

Launch 2-4 Implementer agents in parallel, each on a different issue and
branch. Works well when issues touch different systems (e.g., one on
WaveSystem, another on UiSystem).

```
Agent A: "Implement issue #10 on branch feature/waves-win-condition"
Agent B: "Implement issue #11 on branch feature/ui-settings-panel"
Agent C: "Implement issue #12 on branch fix/map-tile-loading-error"
```

### Pipeline: Plan then implement

1. Launch a Planner agent to create issues.
2. Once it completes, launch Implementer agents for the created issues.

### Review loop: Implement + Review

1. Launch an Implementer agent.
2. Once it pushes a PR, launch a Reviewer agent targeting that PR.
3. If changes are requested, re-prompt the Implementer (or launch a new one
   pointed at the same branch).

---

## Prompt Tips for Better Results

1. **Always reference the pipeline doc** — start prompts with "Read
   docs/AGENT_PLAYBOOK.md and docs/AGENT_TEAM_PIPELINE.md" so the agent loads
   the conventions.

2. **Be explicit about the branch name** — agents will create branches, but
   giving them the name avoids collisions when running in parallel.

3. **Link the issue number** — "Pick up issue #14" is clearer than describing
   the work from scratch. The agent can read the issue body for context.

4. **Scope tightly** — one agent per issue. Don't ask a single agent to
   implement three features. Parallel agents on separate branches is safer.

5. **Include test expectations** — "Add a test that verifies X" gives the
   agent a concrete exit criterion.

6. **Mention the PR template** — agents that know about
   `.github/PULL_REQUEST_TEMPLATE.md` will fill it out properly.

7. **Use follow-ups for iteration** — if an Implementer's PR needs changes
   after review, you can launch a new agent on the same branch:
   "Continue work on branch feature/X. Address review comments from PR #N."

---

## One-Time Setup: Bootstrap Labels

The labels defined in `.github/labels.yml` need to be created in the GitHub
repository once. Run this from a Cursor agent or locally:

```bash
# Delete default labels (optional — keeps label list clean)
gh label list --json name -q '.[].name' | while read -r name; do
  gh label delete "$name" --yes 2>/dev/null
done

# Create project labels from the YAML definitions
# (requires yq — install with: npm install -g yq or brew install yq)
yq -r '.[] | "gh label create \"\(.name)\" --color \"\(.color)\" --description \"\(.description)\""' \
  .github/labels.yml | sh
```

Or manually create them in the GitHub web UI under Settings > Labels.

---

## Monitoring Agent Progress

Since agents communicate through Git, you can track the full team state:

| What to check | How |
|---------------|-----|
| Active work | `gh issue list --label "status: in-progress"` |
| Ready for review | `gh pr list --label "status: review"` |
| Blocked work | `gh issue list --label "status: blocked"` |
| Recent merges | `gh pr list --state merged --limit 10` |
| CI status | `gh run list --limit 10` |
| Open issues backlog | `gh issue list --label "status: ready"` |

---

## Example: Full Cycle Walkthrough

Here is a concrete example running the full pipeline for adding win/lose
conditions.

### Step 1 — Plan (launch Planner agent)

> You are the PLANNER agent. Read docs/AGENT_PLAYBOOK.md and
> docs/AGENT_TEAM_PIPELINE.md. Break down "implement win/lose conditions"
> into GitHub issues. We need: (1) win condition when all waves survived,
> (2) lose condition when base health hits zero, (3) HUD overlay showing
> victory/defeat screen, (4) persist game outcome to localStorage. Label
> all as type: feature, scope: waves + scope: ui where applicable,
> priority: high.

**Result:** Issues #20, #21, #22, #23 created.

### Step 2 — Implement in parallel (launch 2 Implementer agents)

Agent A:
> Implement issue #20: [WaveSystem] Win condition. Branch:
> feature/waves-win-condition. Emit GAME_WON event from WaveDirector.
> Add test. Follow AGENT_TEAM_PIPELINE.md conventions.

Agent B:
> Implement issue #21: [WaveSystem] Lose condition. Branch:
> feature/waves-lose-condition. Emit GAME_LOST event when base health
> reaches zero. Add test. Follow AGENT_TEAM_PIPELINE.md conventions.

**Result:** PRs #24 and #25 opened.

### Step 3 — Review (launch Reviewer agent)

> Review PR #24 and PR #25. Follow the review protocol in
> docs/AGENT_TEAM_PIPELINE.md. Use [MUST]/[SHOULD]/[NIT] prefixes.
> Check that events integrate cleanly with EventBus and GameState.

**Result:** PR #24 approved, PR #25 has one [MUST] comment.

### Step 4 — Fix and merge

Re-launch Implementer for PR #25:
> Address review feedback on PR #25 branch feature/waves-lose-condition.
> The reviewer flagged a [MUST]: base health can go negative. Add a
> Math.max(0, ...) clamp and update the test.

Then launch Integrator:
> Merge approved PRs. Verify deployment succeeds.

### Step 5 — Continue

Launch Implementer agents for issues #22 and #23 (HUD overlay and
persistence), repeating the cycle.

---

## Relation to Other Docs

| Doc | Purpose |
|-----|---------|
| [`AGENTS.md`](../AGENTS.md) | Auto-injected workspace rules for every agent |
| [`AGENT_PLAYBOOK.md`](./AGENT_PLAYBOOK.md) | Mandatory implementation guardrails |
| [`AGENT_TEAM_PIPELINE.md`](./AGENT_TEAM_PIPELINE.md) | Git-native team workflow and conventions |
| **This file** | How to invoke the pipeline roles using Cursor agents |
