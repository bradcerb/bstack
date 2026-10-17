# bstack

High-value portable skill plugins: knowledge intake, thinking, personal money procedures, sharp relationship jobs, agent ops (planning plus gated execution), leadership (coaching prep), and household rhythms.

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

- Copy each plugin folder as a **real directory** (not an out-of-tree symlink) to `~/.cursor/plugins/local/<plugin-name>`, where `<plugin-name>` matches that plugin's root `plugin.json` `name` (for example `knowledge-intake`, `thinking`, `money`, `relationships`, `agent-ops`, `client-services`, `leadership`, `household`).
- A whole-repo checkout is optional and fine for browsing. Loaders expect per-plugin directories with a root `plugin.json`.

Copy `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. That file is the only config you own, and it is gitignored. [SOURCES.md](./SOURCES.md) is the vocabulary: source kinds, settings, bindings, and the alias table from older field names. Skills that declare `metadata.bstack-config` check that file first. If one of their required entries is missing or still a `REPLACE_WITH_` placeholder, they ask only for those entries, write them in the v2 shape, and continue. Skills that declare nothing do not read it. Never commit the file, and never put a secret in it.

## Keepers

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full map.

| Plugin | Purpose |
| --- | --- |
| `knowledge-intake` | Capture → raw → wiki |
| `thinking` | POV, alignment, fluency, Action Method |
| `money` | Principle-based personal money skills. Optional CFO seat. Plaid for live balances; optional fiscal.sh; Tiller only if still the plan sheet. No secrets. |
| `relationships` | Sharp reusable jobs: `conference-who-to-meet`, `thank-you-note`, `circle-rotation`, `touch-note`. Draft only. Nothing is sent. Lane, skip list, circle cadences, and the weekly touch count are settings in `workspace.json`. Voice stays outside the skill. |
| `household` | Three rhythms: `date-night`, `evening-activities`, `weekend-with-kids`. Updates `household.rhythms` and files a task reminder. Not outreach. |
| `agent-ops` | Planning plus gated execution: `project-brief`, `weekly-plan`, `daily-plan`, `gated-work` (capped runs, handoff checklist, human gate), `approval-stage` and `email-send` (send an email only after a human approved its exact hash, and only once) |
| `client-services` | Monthly hosting report: `hosting-metrics-collect`, `hosting-snapshot-diff`, `monthly-hosting-report`, `verify-hosting-report`. Needs a render kit checkout from a separate email repo; see its README |
| `leadership` | Coaching prep: `coaching-angles`, `personality`, `one-on-one-prep`, `open-items`, `onboarding`. Draft only. Nothing is sent. |

## Skill, routine, connector

- **Skill** = the method (portable, in this repo).
- **Routine or command** = when it runs (schedule, trigger, or slash command in your host).
- **Connector** = the data (task board, calendar, repo, inbox).
- Upstream commands (for example an org's own `/weekly-review` command that pulls tasks and calendar) are **inputs**, not forks. Paste their output into `weekly-plan`; do not copy them here. `weekly-plan` is named to stay distinct from those review commands and from Cursor Team Kit's `weekly-review` skill.

## Not in this repo

- Writing skills (Triumph plugins)
- Domain filler packs (communication, engineering, faith, health, gtm, design, project-ops; the small PM set lives in `agent-ops`). Leadership is a portable plugin, not a filler pack. Household is three rhythm skills, not a family domain pack.
- Triumph Rock / PM / sales
- Corey Haines marketing (install upstream)
- Product defaults for Showup / Atlas / bradcerb.com
- Branded money-coach program copy (procedures stay principle-based in `money`)
- Seat-only wiring (company lane, CRM, voice)

## Checks

`node scripts/repo-lint.mjs` runs on every pull request, with `npm run check` in each plugin that has code (`client-services`, `agent-ops`). See `.github/workflows/ci.yml`.

## Safety

- No bank credentials, tokens, or client PII in this repo.
- Money skills are educational planning aids, not advice.
- Relationship skills draft only. They do not send. Household skills update a rhythm row and file a task reminder. They do not send outreach.
- Human judgment for money, outbound send, and irreversible agent actions.

## License

MIT
