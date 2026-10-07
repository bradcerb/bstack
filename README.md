# bstack

Personal skill stack: portable plugins for thinking, communication, and the rest of life and work.

**pstack** is the coding floor. **bstack** is everything else you load on purpose.

Triumph Rock / PM / sales stay in Triumph plugins. **Writing skills:** install from Triumph plugins; not in bstack. Corey Haines marketing stays upstream. Do not fork either here.

## Install

Pick a plugin under `plugins/<name>/`:

1. **Bare skills** - copy or symlink each `skills/<skill>/` into your host skills dir (Claude `~/.claude/skills/`, Codex `.agents/skills/`, etc.).
2. **Cursor** - add the plugin folder (or this repo) as a marketplace via `.cursor-plugin/marketplace.json`, then install.
3. **Claude Code** - use `.claude-plugin/marketplace.json` the same way.
4. **Agent Plugins / Grok** - install from the plugin directory (root `plugin.json`).

### Grok Bot / Cursor local prove

`InstallPlugin` marketplace id is N/A until a plugin is published. The prove path is local:

- Copy each plugin folder as a **real directory** (not an out-of-tree symlink) to `~/.cursor/plugins/local/<plugin-name>`, where `<plugin-name>` matches that plugin’s root `plugin.json` `name` (for example `knowledge-intake`, `thinking`).
- A whole-repo checkout is optional and fine for browsing. Loaders expect per-plugin directories with a root `plugin.json`.

Copy `plugins/<name>/examples/workspace.json.example` when present. Fill in *your* paths. Never commit secrets or real Notion IDs. The file at `plugins/knowledge-intake/skills/knowledge-intake/references/workspace.json` is a pointer only.

## Plugins

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full map and how projects pull.

| Plugin | Purpose |
| --- | --- |
| `knowledge-intake` | Capture → raw → wiki |
| `thinking` | POV, alignment, fluency, Action Method |
| `communication` | Draft-only asks, hard news, follow-ups |
| `leadership` | 1:1s, feedback drafts, decision log |
| `relationships` | Conference prep, notes, thank-yous |
| `gtm` | Thin freelance guardrails (Corey stays upstream) |
| `design` | Figma handoff + leave-behind check |
| `engineering` | Cloud-agent handoff + prove plugin local |
| `money` | Spend clarity + bill triage; **CFO seat**. Ramsey-shaped skills listed in ARCHITECTURE (no secrets) |
| `health` | Thin training / recovery notes |
| `family` | Rhythm and calendar boundaries |
| `faith` | Quiet reflection and reading plans |
| `project-ops` | Side/freelance briefs and weekly review |

## Not in this repo

- Writing skills (Triumph plugins)
- Triumph Rock / PM / sales
- Corey Haines marketing (install upstream)
- Product defaults for Showup / Atlas / bradcerb.com

## Safety

- Draft never send is the default for outbound.
- No bank credentials, tokens, or client PII in this repo.
- Human judgment for money, relationships, leadership, and faith.

## License

MIT
