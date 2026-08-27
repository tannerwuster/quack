# Token audit — is Quack a token hog?

Short answer: **no**. Each ask sends a small, fixed payload; the only unavoidable
cost is inherent to the feature Quack exists to provide. No speculative
optimization is warranted.

## What one ask actually sends

Every ask spawns `claude --resume <session-id>` with the prompt built in
[`buildPrompt`](../packages/server/src/claude.ts) (`packages/server/src/claude.ts`).
The prompt is exactly three parts:

1. A fixed, ~200-word read-only preamble ("you are answering in a read-only
   diff viewer… do not modify code").
2. The **selected chunk** only — the specific lines the user highlighted
   (`ask.chunk`), not the file and not the diff.
3. The user's question.

The full diff and file contents are **never** injected into the prompt. That is
a deliberate design rule: the heavy context already lives in the resumed
session's transcript, so re-sending it would be pure waste.

`buildArgs` passes `-p --resume <id> --output-format stream-json
--include-partial-messages --verbose` — no extra context flags.

## Where the cost actually is

The dominant token cost is `--resume` re-hydrating the **session transcript**:
the conversation (and the edits) that originally wrote the code. This is the
core "your AI already remembers this code" value proposition — it cannot be
removed without breaking the feature. The transcript grows as the conversation
does, so a very long-running session makes each subsequent ask more expensive.

**Levers that exist:**

- Keep asks scoped (already the default — only the highlighted chunk is sent).
- Start a fresh Claude Code session when a thread has grown very long; new asks
  then resume a smaller transcript.
- `ASKDIFF_MODEL` env var (read in `claude.ts`) overrides the ask model — a
  power-user way to run asks on a cheaper model.

## The custom-theme "Refine with Claude" call

The one new model call added in the theming work is intentionally cheap by
construction: [`generateTheme`](../packages/server/src/claude.ts) spawns
`claude -p --model haiku` with **no `--resume`**. It runs in a fresh throwaway
context (the review session's tokens are never loaded), fires **only when a user
creates/refines a theme** — never per ask — and returns a single small JSON
palette. It also reuses `childEnv()`, so it rides the user's subscription auth
rather than API billing.

## Recommendation

No code change. The per-ask payload is already minimal, and the session-resume
cost is the feature, not a leak. Revisit only if a concrete, measured symptom
appears (e.g. a specific ask sending far more than the preamble + chunk +
question).
