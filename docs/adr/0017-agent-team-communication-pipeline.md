# ADR 0017 – Agent Team Communication Pipeline

| Field   | Value                          |
| ------- | ------------------------------ |
| Status  | Accepted                       |
| Date    | 2026-04-02                     |
| Relates | ADR 0005 (GitHub Pages deploy), ADR 0012 (Modular systems) |

## Context

The project is developed by a team of AI agents working asynchronously. Without
a shared communication protocol, agents risk duplicating work, missing context
from previous sessions, or shipping changes that violate existing decisions.

Git already provides strong primitives for asynchronous collaboration: branches
isolate work, pull requests capture intent and review, labels encode metadata,
CI gates enforce quality, and commit history preserves audit trail. The project
needs a formal pipeline that maps agent roles and handoffs onto these primitives.

## Decision

1. **Define six agent roles** (Planner, Implementer, Reviewer, Doc Writer,
   CI Watcher, Integrator) with clear responsibilities documented in
   `docs/AGENT_TEAM_PIPELINE.md`.

2. **Adopt a branch naming convention** (`feature/`, `fix/`, `docs/`, `chore/`)
   so intent is inferrable from the ref name.

3. **Require all changes to flow through pull requests** using a shared PR
   template (`.github/PULL_REQUEST_TEMPLATE.md`).

4. **Introduce a label taxonomy** (type, scope, status, priority, special)
   defined in `.github/labels.yml` for automated sync. Labels are the primary
   mechanism for agents to signal workflow state transitions.

5. **Add a PR-specific CI workflow** (`.github/workflows/ci.yml`) that runs
   install → test → build on pull request branches, separate from the deploy
   workflow that only runs on `main`.

6. **Standardize commit messages** using Conventional Commits format
   (`<type>(<scope>): <summary>`).

7. **Define a handoff protocol** so agents leaving a session always push their
   work, update PR descriptions, and leave structured status comments.

8. **Use PR review comment prefixes** (`[MUST]`, `[SHOULD]`, `[NIT]`) so
   review feedback has unambiguous severity.

9. **Provide issue templates** for feature requests, bug reports, and agent
   handoffs to ensure consistent information capture.

## Consequences

### Positive

- Agents can discover project state entirely from Git artifacts (no external
  chat or shared memory required).
- Label-driven status tracking makes it possible to query "what is in progress"
  or "what is blocked" without reading every PR.
- Conventional commits enable future automated changelogs and release notes.
- The PR template and review prefix conventions reduce ambiguity in async
  review cycles.
- CI on PR branches catches regressions before merge, not after deployment.

### Negative

- More process overhead per change (template, labels, conventional commits).
- Label sync requires a GitHub Action or manual setup; `.github/labels.yml`
  is a convention file, not natively enforced by GitHub.
- Agents must internalize the pipeline rules, adding to the required reading
  before contributing.

## Alternatives considered

1. **Informal conventions only (no templates or labels)**
   - Rejected: too fragile for agents that start fresh each session with no
     shared memory of prior informal agreements.

2. **External project management tool (Linear, Jira)**
   - Rejected: adds a dependency outside the Git repo. Agents already have
     native access to GitHub issues and PRs.

3. **Single-agent workflow (no team protocol)**
   - Rejected: the project has grown beyond what a single context window can
     handle. Multi-agent collaboration is already happening; formalizing it
     reduces errors.
