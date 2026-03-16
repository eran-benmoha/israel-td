# AGENTS.md

All agents must follow these rules before editing code:

1. Read `docs/AGENT_PLAYBOOK.md`.
2. Read `docs/adr/` and preserve existing decision history.
3. Before running parallel agents, read `docs/AGENT_TASK_SPLITS.md` and stay within the assigned ownership boundary.
4. If you change behavior, update documentation in the same change set.
5. Keep deployment to GitHub Pages functional.

If a requested change conflicts with existing rules/decisions, create a new ADR that supersedes the old decision and document the migration.
