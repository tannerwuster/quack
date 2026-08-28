# Support

Before filing an issue, please skim the common problems below — most
quack bugs have a known cause.

## Troubleshooting

**"Claude session: (none — set QUACK_SESSION_ID or use --session)"**
The skill couldn't read the parent CC manifest. You're either running
quack from outside a Claude Code session (no `$PPID.json` in
`~/.claude/sessions/`), or `CLAUDE_CONFIG_DIR` points somewhere
else. Pass `--session <uuid>` explicitly to override.

**"Port 7837 is already in use"**
Another quack (from a different session) is running, or something
else grabbed the port. Same-session re-invocations don't hit this —
they reuse their session's saved port. Pass `--port 7838` to force a
specific port, or wait 5 min for the idle WS server to self-terminate.

**Browser opens, UI loads, but never connects**
The WS upgrade is failing. Check `/tmp/quack.<suffix>.log` (where
`<suffix>` is your CC session UUID) — usually it's an old UI cached
against a new server (reload the browser tab) or a hung
`claude --resume` subprocess (check `ps aux | grep claude`).

**`/quack` doesn't appear in Claude Code's skill picker**
Run `npx -y quackdiff install-skill` from inside the project (writes
`<git-root>/.claude/skills/quack/SKILL.md`), or
`npx -y quackdiff install-skill --global` to install user-level
(`~/.claude/skills/quack/SKILL.md`). If the file is there but still
missing from the picker, restart Claude Code or run `/reload-plugins`.

## Filing an issue

If the troubleshooting above doesn't cover your case, open an issue at
[github.com/tannerwuster/quack/issues](https://github.com/tannerwuster/quack/issues)
with:

- quack version (`npx quack --version`)
- Claude Code version (`claude --version`)
- Node version (`node --version`) and OS
- The relevant `/tmp/quack.<suffix>.log` excerpt (the suffix is your
  CC session UUID — find it via `ls -t /tmp/quack.*.log | head -1`)
- What you ran and what you expected

## Contributing

For development setup, architecture, and the `/quack-dev` skill, see
[CONTRIBUTING.md](./CONTRIBUTING.md).
