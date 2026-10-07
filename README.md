# bstack

High-value portable skill plugins: knowledge intake, thinking, personal money procedures, and sharp relationship jobs.

**pstack** is the coding floor. **bstack** is only what is worth downloading and reusing. Not a life-domain matrix.

Writing skills install from Triumph plugins; not in bstack. Corey Haines marketing stays upstream. Do not fork either here.

## Install

Pick a plugin under `plugins/<name>/`:

1. **Bare skills** - copy or symlink each `skills/<skill>/` into your host skills dir (Claude `~/.claude/skills/`, Codex `.agents/skills/`, etc.).
2. **Cursor** - add the plugin folder (or this repo) as a marketplace via `.cursor-plugin/marketplace.json`, then install.
3. **Claude Code** - use `.claude-plugin/marketplace.json` the same way.
4. **Agent Plugins / Grok** - install from the plugin directory (root `plugin.json`).

### Grok Bot / Cursor local prove

`InstallPlugin` marketplace id is N/A until a plugin is published. The prove path is local:

- Copy each plugin folder as a **real directory** (not an out-of-tree symlink) to `~/.cursor/plugins/local/<plugin-name>`, where `<plugin-name>` matches that plugin's root `plugin.json` `name` (for example `knowledge-intake`, `thinking`, `money`, `relationships`).
- A whole-repo checkout is optional and fine for browsing. Loaders expect per-plugin directories with a root `plugin.json`.

Copy `plugins/<name>/examples/workspace.json.example` when present. Fill in *your* paths. Never commit secrets or real Notion IDs. The file at `plugins/knowledge-intake/skills/knowledge-intake/references/workspace.json` is a pointer only.

## Plugins

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full map.

| Plugin | Purpose |
| --- | --- |
| `knowledge-intake` | Capture → raw → wiki |
| `thinking` | POV, alignment, fluency, Action Method |
| `money` | Principle-based personal money skills. Optional CFO seat. Plaid for live balances; optional fiscal.sh; Tiller only if still the plan sheet. No secrets. |
| `relationships` | Sharp reusable jobs only: `conference-who-to-meet`, `thank-you-note`. Seats keep lane/voice/tools. |

## Not in this repo

- Writing skills (Triumph plugins)
- Domain filler packs (communication, engineering, faith, family, health, gtm, design, project-ops, leadership)
- Triumph Rock / PM / sales
- Corey Haines marketing (install upstream)
- Product defaults for Showup / Atlas / bradcerb.com
- Branded money-coach program copy (procedures stay principle-based in `money`)
- Seat-only wiring (company lane, CRM, voice)

## Safety

- No bank credentials, tokens, or client PII in this repo.
- Money skills are educational planning aids, not advice.
- Relationship skills are draft-only until the author says send.
- Human judgment for money and any outbound send.

## License

MIT
