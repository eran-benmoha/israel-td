# Agent Team Communication Pipeline

This document defines how a team of AI agents collaborates on this project using
Git-native communication primitives: branches, pull requests, labels, CI checks,
and structured handoff conventions.

---

## 1) Agent Roles

Each agent session is assigned one of the following roles. A single session may
hold multiple roles when scope is small.

| Role | Responsibility | Typical artifacts |
|------|---------------|-------------------|
| **Planner** | Breaks work into issues, assigns labels and priorities | GitHub issues, label assignments |
| **Implementer** | Writes code on a feature branch, opens a PR | Commits, PR description, inline comments |
| **Reviewer** | Reviews open PRs, requests changes or approves | PR review comments, approval/request-changes |
| **Doc Writer** | Updates docs, ADRs, playbook, and decision log | Markdown files in `docs/` |
| **CI Watcher** | Monitors build/test status, triages failures | Issue comments linking failed runs |
| **Integrator** | Merges approved PRs, resolves conflicts, tags releases | Merge commits, version tags |

---

## 2) Branch Strategy

```
main (protected — deploy target)
 └── feature/<scope>-<short-description>
 └── fix/<scope>-<short-description>
 └── docs/<short-description>
 └── chore/<short-description>
```

### Rules

1. **Never push directly to `main`.** All changes flow through pull requests.
2. Branch names use the prefixes above so agents and CI can infer intent from
   the ref name alone.
3. One logical change per branch. If a feature requires docs updates, include
   them in the same branch (per playbook rule §1.2).
4. Delete branches after merge.

### Prefix semantics

| Prefix | When to use |
|--------|-------------|
| `feature/` | New gameplay, system, or UI capability |
| `fix/` | Bug fix or regression repair |
| `docs/` | Documentation-only changes (no code) |
| `chore/` | Tooling, CI config, dependency bumps |

---

## 3) Issue Lifecycle (Agent-to-Agent Task Assignment)

Issues are the primary unit of work assignment between agents.

### Issue creation (Planner role)

1. Title follows: `[<scope>] <imperative verb phrase>` — e.g.
   `[WaveSystem] Add win/lose condition checks`
2. Body must contain:
   - **Context** — why this work is needed.
   - **Acceptance criteria** — checkboxes that define "done".
   - **Affected systems** — which modules/files are in scope.
   - **Labels** — applied from the standard label set (§5).
3. If the issue is a decomposition of a larger effort, link the parent issue.

### Issue assignment (handoff signal)

- An Implementer agent picks up an issue by **self-assigning** and moving the
  label from `status: ready` to `status: in-progress`.
- Only one agent should be `in-progress` on a given issue at a time.

### Issue completion

- The Implementer opens a PR that references the issue (`Closes #<n>`).
- On PR merge, the issue auto-closes.
- If work is blocked, the Implementer applies `status: blocked` and leaves a
  comment explaining the blocker.

---

## 4) Pull Request Protocol

PRs are the primary communication artifact between Implementer and Reviewer
agents.

### Opening a PR (Implementer)

1. Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`).
2. Fill in every section — summary, change type, affected systems, testing,
   checklist.
3. Apply appropriate labels (see §5).
4. Mark as **Draft** while work is still in progress.
5. Move to **Ready for Review** when:
   - CI passes (build + tests).
   - All acceptance criteria from the linked issue are met.
   - Self-review is complete (no TODO/FIXME left unresolved).

### Reviewing a PR (Reviewer)

1. Check that the PR template is fully filled out.
2. Verify CI status is green.
3. Review code against the playbook guardrails (§2–§5 of `AGENT_PLAYBOOK.md`).
4. Leave structured comments:
   - **Must fix** — prefix with `[MUST]`. Blocks merge.
   - **Should fix** — prefix with `[SHOULD]`. Strongly recommended.
   - **Nit** — prefix with `[NIT]`. Optional polish.
5. Approve or request changes. Never approve with unresolved `[MUST]` items.

### Merging a PR (Integrator)

1. Confirm at least one approval and no outstanding `[MUST]` comments.
2. Use **squash merge** for feature/fix branches to keep `main` history clean.
3. Use **merge commit** for docs/chore branches (preserves individual commits
   when useful for audit).
4. Delete the source branch after merge.

---

## 5) Label Taxonomy

Labels encode metadata that agents use to route, prioritize, and filter work.
Defined in `.github/labels.yml` for automated sync.

### Type labels (mutually exclusive — pick one)

| Label | Color | Description |
|-------|-------|-------------|
| `type: feature` | `#1d76db` | New capability or enhancement |
| `type: bug` | `#d73a4a` | Something is broken |
| `type: docs` | `#0075ca` | Documentation only |
| `type: chore` | `#e4e669` | Tooling, deps, CI config |
| `type: refactor` | `#d4c5f9` | Code restructure, no behavior change |

### Scope labels (one or more)

| Label | Color | Description |
|-------|-------|-------------|
| `scope: map` | `#c5def5` | MapSystem, MapRenderer, tiles, projection |
| `scope: waves` | `#c5def5` | WaveSystem, WaveDirector, factions |
| `scope: resources` | `#c5def5` | ResourceSystem, economy, purchases |
| `scope: ui` | `#c5def5` | UiSystem, HUD, ShopView, DebugView |
| `scope: input` | `#c5def5` | InputSystem, controls, keyboard/touch |
| `scope: data` | `#c5def5` | JSON configs, level data, unit stats |
| `scope: ci` | `#c5def5` | GitHub Actions, build pipeline |
| `scope: core` | `#c5def5` | EventBus, GameState, selectors, BootScene |

### Status labels (mutually exclusive — current workflow state)

| Label | Color | Description |
|-------|-------|-------------|
| `status: ready` | `#0e8a16` | Triaged, ready for an agent to pick up |
| `status: in-progress` | `#fbca04` | An agent is actively working on this |
| `status: review` | `#6f42c1` | PR open, awaiting review |
| `status: blocked` | `#b60205` | Waiting on external dependency or decision |

### Priority labels (one per issue)

| Label | Color | Description |
|-------|-------|-------------|
| `priority: critical` | `#b60205` | Blocks deployment or breaks existing functionality |
| `priority: high` | `#d93f0b` | Important for current phase milestone |
| `priority: medium` | `#fbca04` | Should be done soon |
| `priority: low` | `#0e8a16` | Nice to have, no urgency |

### Special labels

| Label | Color | Description |
|-------|-------|-------------|
| `needs-adr` | `#f9d0c4` | Change requires a new ADR before implementation |
| `breaking` | `#b60205` | Introduces a breaking change to APIs or data schemas |
| `good-first-task` | `#7057ff` | Simple, well-scoped — good for onboarding a new agent |

---

## 6) CI / Build Gates

All PRs must pass CI before merge. The pipeline runs automatically on every push
to a PR branch.

### Current gates (defined in `.github/workflows/deploy-pages.yml`)

| Step | Command | Blocks merge? |
|------|---------|---------------|
| Install | `npm ci` | Yes |
| Test | `npm test` | Yes |
| Build | `npm run build` | Yes |

### PR-specific CI workflow (`.github/workflows/ci.yml`)

A separate workflow runs on PR branches to provide fast feedback without
triggering deployment. It runs the same install → test → build steps.

### Future gate additions (as project matures)

- **Lint** — enforce code style consistency.
- **Visual regression** — screenshot comparison for map rendering.
- **Bundle size check** — prevent payload bloat.
- **ADR validation** — ensure new ADRs follow the template.

---

## 7) Communication Conventions

Agents do not have a chat channel. All communication is asynchronous and
happens through Git artifacts.

### Where to communicate what

| Information | Where |
|-------------|-------|
| "What should be built?" | GitHub Issue body |
| "I'm working on this" | `status: in-progress` label on issue |
| "Here is my implementation" | Pull Request |
| "This needs changes" | PR review comment with `[MUST]`/`[SHOULD]`/`[NIT]` prefix |
| "I'm blocked" | `status: blocked` label + issue comment |
| "This decision has trade-offs" | New ADR in `docs/adr/` |
| "What is currently true?" | `docs/DECISION_LOG.md` |
| "Build is broken" | Issue with `type: bug` + `priority: critical` |
| "I finished my work" | PR moved from Draft to Ready, `status: review` label |

### Commit message format

```
<type>(<scope>): <imperative summary>

[optional body explaining why, not what]

[optional footer: Closes #<n>, Breaking: <description>]
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
Scopes: `map`, `waves`, `resources`, `ui`, `input`, `data`, `ci`, `core`

Examples:

```
feat(waves): add win condition when all waves survived
fix(ui): prevent shop menu overflow on short viewports
docs(adr): add ADR 0018 for multiplayer architecture
chore(ci): add bundle size check to PR workflow
```

---

## 8) Handoff Protocol

When an agent's session ends (context limit, task boundary, or explicit
handoff), it must leave a clean state for the next agent.

### End-of-session checklist

1. **Commit and push** all work in progress (even if incomplete — use a
   `wip:` prefix in the commit message).
2. **Update PR description** with current status:
   - What is done.
   - What remains.
   - Known issues or open questions.
3. **Update labels** — move to `status: review` if done, or leave as
   `status: in-progress` with a comment if handing off mid-task.
4. **Update issue** — leave a comment summarizing progress and remaining work.
5. **Do not leave uncommitted changes.** The next agent starts from the
   remote branch state.

### Mid-task handoff comment template

```markdown
## Handoff Summary

**Branch:** `feature/wave-win-condition`
**Status:** In progress — ~70% complete

### Done
- [ ] Win condition logic in WaveSystem
- [ ] HUD victory overlay

### Remaining
- [ ] Lose condition (base health zero)
- [ ] Persist outcome to localStorage
- [ ] Update ADR if save schema changes

### Notes
- WaveDirector.allWavesComplete() exists but is not yet wired to GameState.
- No test regressions as of last push.
```

---

## 9) Conflict Resolution

When agents disagree (e.g., two PRs modify the same system, or a review
disputes an implementation approach):

1. **Prefer the existing ADR.** If an ADR covers the topic, follow it.
2. **If no ADR exists**, the Reviewer agent creates a new issue labeled
   `needs-adr` and blocks the PR until the ADR is written and accepted.
3. **Merge conflicts** are resolved by the later PR's author. The Integrator
   may assist.
4. **Data schema conflicts** (changes to JSON in `src/data/`) require explicit
   version bumps and migration notes in the PR body.

---

## 10) Release and Deployment

Deployment to GitHub Pages is automatic on merge to `main`. There is no manual
release step for the current phase.

### Post-merge verification

After a PR merges to `main`, the CI Watcher role should:

1. Confirm the deploy workflow completes successfully.
2. Spot-check the live GitHub Pages URL.
3. If deployment fails, immediately open a `type: bug` + `priority: critical`
   issue.

### Version tagging (future)

When the project reaches Phase 5 (Release Candidate), the Integrator will begin
tagging releases with semantic versions:

```
v1.0.0-rc.1
v1.0.0
```

Tags trigger the deploy workflow via `workflow_dispatch` and serve as rollback
points.

---

## 11) Workflow Diagram

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                        PLANNER AGENT                            │
 │  Creates issues with labels, acceptance criteria, scope tags    │
 └────────────────────────────┬────────────────────────────────────┘
                              │ issue created
                              ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                     IMPLEMENTER AGENT                           │
 │  1. Self-assigns issue (status: in-progress)                    │
 │  2. Creates feature branch                                      │
 │  3. Commits code + docs (conventional commits)                  │
 │  4. Pushes branch, opens Draft PR (uses template)               │
 │  5. Waits for CI gates to pass                                  │
 │  6. Marks PR Ready for Review (status: review)                  │
 └────────────────────────────┬────────────────────────────────────┘
                              │ PR ready
                              ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                      CI / BUILD GATES                           │
 │  npm ci → npm test → npm run build                              │
 │  All must pass before review proceeds                           │
 └────────────────────────────┬────────────────────────────────────┘
                              │ CI green
                              ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                      REVIEWER AGENT                             │
 │  1. Checks PR template completeness                             │
 │  2. Validates against playbook guardrails                       │
 │  3. Leaves [MUST]/[SHOULD]/[NIT] comments                      │
 │  4. Approves or requests changes                                │
 └───────────┬─────────────────────────────────┬───────────────────┘
             │ approved                         │ changes requested
             ▼                                  ▼
 ┌───────────────────────┐       ┌─────────────────────────────────┐
 │   INTEGRATOR AGENT    │       │    IMPLEMENTER AGENT            │
 │  1. Squash merge      │       │  Addresses feedback, re-pushes  │
 │  2. Delete branch     │       │  → back to CI gates             │
 │  3. Tag if releasing  │       └─────────────────────────────────┘
 └───────────┬───────────┘
             │ merged to main
             ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                     CI WATCHER AGENT                            │
 │  1. Monitors deploy workflow                                    │
 │  2. Verifies live site                                          │
 │  3. Opens critical bug if deployment fails                      │
 └─────────────────────────────────────────────────────────────────┘
```

---

## 12) Quick Reference Card

| Action | Git primitive | Who |
|--------|--------------|-----|
| Propose work | Open issue | Planner |
| Claim work | Assign issue + label `in-progress` | Implementer |
| Submit work | Open PR on feature branch | Implementer |
| Validate work | CI pipeline (automated) | CI |
| Review work | PR review comments | Reviewer |
| Ship work | Squash merge to `main` | Integrator |
| Verify deployment | Check Actions + live site | CI Watcher |
| Record decision | New ADR in `docs/adr/` | Doc Writer |
| Escalate blocker | Issue with `status: blocked` | Any agent |
| Hand off mid-task | Push WIP + update PR description | Any agent |

---

## 13) Running This Pipeline with Cursor

For concrete prompt templates, parallel invocation strategies, and a full-cycle
walkthrough using Cursor's Background Agent feature, see
[`docs/CURSOR_AGENT_GUIDE.md`](./CURSOR_AGENT_GUIDE.md).
