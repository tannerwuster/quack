# Contributing to quack

Thanks for poking at quack. This doc covers the dev loop, repo layout,
and the in-repo `/quack-dev` skill you'll use to test changes.

## Setup

```bash
git clone https://github.com/tannerwuster/quack
cd quack
pnpm install
pnpm test
pnpm lint
pnpm run build
```

Node 24+ (current active LTS) and pnpm are the only requirements. There is
no Anthropic API key to set — quack shells out to the `claude` CLI.

## Architecture

The npm package (`packages/cli`) is a single esbuild-bundled Node binary
that hosts an HTTP server (serving the prebuilt UI bundle in `dist/ui/`)
and a WebSocket on the same port at `/ws`. The CLI imports `startServer`
from `@quack/server`, which spawns `claude --resume` per ask and
forwards `text_delta` events to the client. The browser UI
(`packages/ui-browser`) is React 19 + Vite + Tailwind v4 + zustand, with
`react-diff-view` for rendering and refractor for syntax highlighting.

`SPEC.md` has the full wire protocol, repository layout, and design
rationale. Read it before making changes that touch the protocol or the
launch flow.

## Dev loop

From a Claude Code session in this repo:

```
/quack-dev                    # first launch: Vite + WS server with HMR
/quack-dev                    # again: kills the WS server, restarts on same port with a fresh diff
/quack-dev last commit        # description-driven: HEAD~1..HEAD
```

`/quack-dev` runs the in-repo TypeScript via `tsx` and pairs the WS
server with a local Vite dev server, so UI changes hot-reload. Use it
(not `/quack`) to test changes to the server, the CLI, or the
natural-language flow — `/quack` always pulls `npx -y quackdiff@latest`,
so unpublished work won't run there.

The WS server idle-shuts after 5 min with no connected clients; Vite is
intentionally persistent (HMR is the whole point). Kill Vite via
Activity Monitor or `pkill -f 'ui-browser.*vite'` on the rare occasion
you want it gone.

To exercise the production-shaped binary locally:

```bash
pnpm run build
node packages/cli/dist/index.js --port 7838
```

## Configuration

The skill resolves everything for the normal `/quack` flow, so users
shouldn't ever need to set these. They exist for power use, debugging,
and running the CLI directly outside a Claude Code session.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `7837` | Auto-bumps if taken. |
| `QUACK_SESSION_ID` | (resolved from `$PPID`) | Force a specific Claude Code session UUID. |
| `QUACK_PROJECT_CWD` | (parent CC manifest, then `process.cwd()`) | Project directory to diff. |
| `QUACK_MODEL` | (inherits resumed session's model) | Override the Claude model for asks. |
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Where Claude Code stores `sessions/`, `projects/`. |
| `QUACK_SKIP_UPDATE_CHECK` | unset | Set to `1` to suppress the post-launch npm version check. |

CLI flags also work (`quack --port 7838 --no-open --session <uuid>`);
run `quack --help` for the full list.

## Tests and lint

```bash
pnpm test                                              # jest, all packages
pnpm test:watch
pnpm lint                                              # eslint, all packages
pnpm --filter @quack/protocol  exec tsc --noEmit
pnpm --filter @quack/server    exec tsc --noEmit
pnpm --filter @quack/ui-browser exec tsc --noEmit
pnpm --filter @quack/ui-browser build                # production build sanity check
```

Tests are co-located as `*.test.ts`. `@quack/ui-browser` deliberately
has no tests yet — the surface is too new and visual to lock in. Add
tests once the UX is stable; React Testing Library is the natural fit.

## Coding conventions

- Strict TypeScript — no `any`, no `ts-ignore`, no non-null assertions in hot paths.
- Named exports only (no default exports except entry points).
- Module-level functions in `util/` are arrow functions for consistency.
- Errors at the WS boundary are surfaced as `error` messages, never thrown across the socket.
- `zod.safeParse` on every incoming message; never trust raw input.
- Comments explain *why* — only when the why isn't obvious from the code or the SPEC.

See `CLAUDE.md` for the full set of conventions and the "do not" list
(e.g. don't reintroduce the Anthropic SDK, don't inject the diff into
the prompt, don't run git from the server).

## Pull requests

- Match existing style; run `pnpm lint` and `pnpm test` before pushing.
- Keep `.claude/skills/quack/SKILL.md` and `.claude/skills/quack-dev/SKILL.md`
  in sync on Steps 1–4 prose, table, and routing — only the launch
  command differs.
- If you change the wire protocol, update `SPEC.md` in the same PR.
