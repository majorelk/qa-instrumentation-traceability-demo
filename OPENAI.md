# Mission
Same as CLAUDE.md: instrument the application layer for reportability & traceability.

# Guardrails for Copilot / OpenAI tools
- Keep diffs small and type-safe (TypeScript) with tests included.
- No secrets/PII. Scrub logs and payloads.
- Prefer minimal, composable utilities; avoid dead code.
- If a change impacts tests/CI, update them in the same PR.

# When generating code
- Include short JSDoc on public functions.
- Use stable interfaces and narrow types.
- Return structured errors (never swallow).
- When significant, add a header comment linking to the prompt log in `docs/ai/runs/`.
