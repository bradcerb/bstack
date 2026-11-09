# bstack

High-value portable skill plugins: knowledge intake, thinking, personal money procedures, sharp relationship jobs, agent ops (planning plus gated execution), leadership (coaching prep), and household rhythms.

This repo is the set worth downloading and reusing. It is a small set of skills, not a pack for every life domain.

Voice, marketing playbooks, and one product's defaults stay in the files or repos that own them.

## Install

Pick a plugin under `plugins/<name>/`:

1. **Bare skills** - copy or symlink each `skills/<skill>/` into your host skills dir (Claude `~/.claude/skills/`, Codex `.agents/skills/`, etc.).
2. **Cursor** - add the plugin folder (or this repo) as a marketplace via `.cursor-plugin/marketplace.json`, then install.
3. **Claude Code** - use `.claude-plugin/marketplace.json` the same way.
4. **Agent Plugins / Grok** - install from the plugin directory (root `plugin.json`).

### Local plugin directories

`InstallPlugin` marketplace id is N/A until a plugin is published. The prove path is local:

- Copy each plugin folder as a **real directory** (not an out-of-tree symlink) to `~/.cursor/plugins/local/<plugin-name>`, where `<plugin-name>` matches that plugin's root `plugin.json` `name` (for example `knowledge-intake`, `thinking`, `money`, `relationships`, `agent-ops`, `leadership`, `household`).
- A whole-repo checkout is optional and fine for browsing. Loaders expect per-plugin directories with a root `plugin.json`.

Copy `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. That file is the only config you own, and it is gitignored. [SOURCES.md](./SOURCES.md) is the vocabulary: source kinds, settings, bindings, and the alias table from older field names. Skills that declare `metadata.bstack-config` check that file first. If one of their required entries is missing or still a `REPLACE_WITH_` placeholder, they ask only for those entries, write them in the v2 shape, and continue. Skills that declare nothing do not read it. Never commit the file, and never put a secret in it.

A host that cannot write files, such as a runtime agent, commits a read-only host profile instead. Start from `examples/bstack-host.json.example`. Skills read it first, never write it, and treat an unbound required source as pasted in the conversation. Hosts without a profile are unchanged.

## Keepers

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full map.

| Plugin | Purpose |
| --- | --- |
| `knowledge-intake` | Capture → raw → wiki |
| `thinking` | POV, alignment, fluency, Action Method |
| `money` | Principle-based personal money skills. Ask a read-only finance connector or a plan spreadsheet for numbers. Never store credentials. |
| `relationships` | Sharp reusable jobs: `conference-who-to-meet`, `thank-you-note`, `circle-rotation`, `touch-note`. Draft only. Nothing is sent. Lane, skip list, circle cadences, and the weekly touch count are settings in `workspace.json`. Voice stays outside the skill. |
| `household` | Three rhythms: `date-night`, `evening-activities`, `weekend-with-kids`. Updates `household.rhythms` and files a task reminder. Not outreach. |
| `agent-ops` | Planning plus gated execution: `project-brief`, `weekly-plan`, `daily-plan`, `gated-work` (capped runs, handoff checklist, human gate), `approval-stage` and `email-send` (send an email only after a human approved its exact hash, and only once) |
| `leadership` | Coaching prep: `coaching-angles`, `personality`, `one-on-one-prep`, `open-items`, `onboarding`. Draft only. Nothing is sent. |

## Skill, routine, connector

- **Skill** = the method (portable, in this repo).
- **Routine or command** = when it runs (schedule, trigger, or slash command in your host).
- **Connector** = the data (task board, calendar, repo, inbox).
- Upstream commands (for example a host command that pulls tasks and calendar) are **inputs**. Paste their output into `weekly-plan`. Leave the host command where it is. `weekly-plan` stays distinct from a host review command.

## Not in this repo

- Writing voice and branded program copy. Bind a style guide as `voice.style-guide` when a skill should match it.
- Domain packs for communication, engineering, faith, health, go-to-market, design, or project operations. The small planning set lives in `agent-ops`. Leadership is five coaching skills. Household is three rhythm skills.
- Delivery, sales, and implementation playbooks for one product
- Marketing playbooks from another author or marketplace
- Defaults that belong to one product
- Branded money-coach program copy. Procedures in `money` stay principle-based.
- Identity, lane, CRM, and voice. Those belong in `workspace.json`.

## Checks

`node scripts/repo-lint.mjs` runs on every pull request, with `npm run check` in `agent-ops`. See `.github/workflows/ci.yml`.

Every SKILL.md declares `bstack-needs`, `bstack-sends`, `bstack-money`, and `bstack-scope` in its frontmatter. The lint fails without them. `node scripts/skill-index.mjs` prints all skills with those fields as JSON, for a host that vendors a filtered set. The values are in the Portability section of [SOURCES.md](./SOURCES.md). Clone the public repository at https://github.com/bradcerb/bstack. No token and no private checkout. [CONSUMERS.md](./CONSUMERS.md) says how a downstream repo vendors an allowlist, pins a tag such as `v0.1.0`, and updates through pull requests.

## Safety

- No bank credentials, tokens, or client PII in this repo.
- Money skills are educational planning aids, not advice.
- Relationship skills draft only. They do not send. Household skills update a rhythm row and file a task reminder. They do not send outreach.
- Human judgment for money, outbound send, and irreversible agent actions.

## License

MIT
