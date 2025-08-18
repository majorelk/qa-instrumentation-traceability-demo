# AI Usage in This Repo

We use **Claude Code** for scaffolding/long-form changes and **GitHub Copilot** for small completions/refactors.

## Guardrails
- All AI-assisted changes:
  - go via PR on a feature branch,
  - include tests/CI updates when needed,
  - reference a prompt log in `docs/ai/runs/`.

## Storage
- Planned prompts/specs → `docs/ai/prompts/`
- Actual prompts (and optional outputs) → `docs/ai/runs/`
