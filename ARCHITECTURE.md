# bstack

High-value, portable skill plugins you can install and reuse. Not a second engineering floor. Not one plugin per life domain.

**pstack** stays the coding floor (verify first, small changes, clean PRs).
**bstack** ships only skills worth downloading: knowledge intake, thinking, personal money procedures, sharp relationship jobs, agent ops (planning plus gated execution), and leadership (coaching prep).

Writing skills install from Triumph plugins; not in bstack. Corey Haines marketing skills stay upstream. Do not fork either here.

## How to use this

1. Install the plugin you need (or copy the `skills/` folders).
2. Copy `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. Fill in your paths, sources, and targets. Never commit that file or real IDs.
3. Run the skill when its trigger matches. Skip the rest.

Anyone should be able to start with empty configs and clear skill names. No jargon required.

## Config check

`workspace.json` is the only config file. Copy `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. It is gitignored. Never commit it, and never put a secret in it.

[SOURCES.md](./SOURCES.md) is the vocabulary: source kinds, settings, binding shapes, the alias table, the secrets rule, and the config-check text each declaring skill pastes. There is no per-plugin example.

A skill that reads config declares it once, in frontmatter, on `metadata.bstack-config`. The check is per skill. A required entry that is missing, empty, or still a `REPLACE_WITH` placeholder is asked for, written in the v2 shape, and the skill continues. It does not interview you for the whole pack. An entry marked `?` that is absent, empty, a placeholder, or bound `"via": "none"` is skipped and does not block. The `onboarding` skill in `leadership` runs that interview for one named skill, then stops.

A binding of `paste` means you supply that data in the conversation. A path, label, connector name, or skill name is filled in by you. Relative paths resolve from `workspace.root` (the folder of `workspace.json` when `root` is `"."`).

A skill with no `bstack-config` line does not read this file.

| Declaration | Skills |
| --- | --- |
| `email.inbox`, `tasks.priorities`, `calendar.events`, `tasks.agent-queue`, `chat.messages?` | `daily-plan` |
| `tasks.week-snapshot` | `weekly-plan` |
| `tasks.work-queue` | `gated-work` |
| `transcripts.meetings`, `people.assessments`, `people.roster`; settings `leadership.coaching_state`, `leadership.coaching_briefs_dir?`, `workspace.timezone?` | `coaching-angles` |
| `people.profiles` | `personality` |
| `transcripts.meetings`, `transcripts.one-on-ones`, `people.assessments` | `one-on-one-prep` |
| `log.open-items`, `tasks.commitments`; setting `workspace.timezone?` | `open-items` |
| `kb.positions?` | `examine-my-alignment` (read), `form-my-point-of-view` (optional write of a confirmed position) |
| `voice.style-guide?` | `thank-you-note` |
| settings `relationships.author_lane?`, `relationships.skip_list?` | `conference-who-to-meet` |
| `people.circles`, `log.touches?`, `calendar.events?`, `tasks.commitments?`; settings `relationships.circle_cadences`, `relationships.weekly_touches`, `relationships.skip_list?` | `circle-rotation` |
| `log.touches`, `people.circles`, `tasks.commitments`; setting `workspace.timezone?` | `touch-note` |
| `household.rhythms`, `tasks.commitments`, `calendar.events?` | `date-night`, `evening-activities`, `weekend-with-kids` |

Knowledge-intake skills declare `kb.raw-index`, `kb.wiki`, `kb.wiki-log`, and the `knowledge.*` settings they use. A connector such as Notion is one way to bind the `kb.*` kinds. Older flat names still resolve through the alias table in SOURCES.md.

## Keepers

| Plugin | Skills (names) | When to load |
| --- | --- | --- |
| **knowledge-intake** | `knowledge-intake`, `capture-articles`, `capture-newsletters`, `capture-podcasts`, `capture-youtube`, `capture-meetings`, `wiki-ingest` | Capture → raw → wiki |
| **thinking** | `form-my-point-of-view`, `examine-my-alignment`, `build-fluency`, `action-method` | Beliefs, understanding, deciding |
| **money** | `money-check`, `bill-triage`, `margin-plan`, `debt-order`, `cash-cushion`, `purchase-pause`, `money-date`, `step-status` | Personal money procedures. Optional CFO seat. No bank secrets in the repo. |
| **relationships** | `conference-who-to-meet`, `thank-you-note`, `circle-rotation`, `touch-note` | Sharp reusable jobs. Draft only. Nothing is sent. Lane, skip list, circle cadences, and the weekly touch count are settings. Voice stays outside the skill. |
| **household** | `date-night`, `evening-activities`, `weekend-with-kids` | Three household rhythms. Each one updates `household.rhythms` and files a task reminder. Not outreach. |
| **agent-ops** | `project-brief`, `weekly-plan`, `daily-plan`, `gated-work` | Open a project, plan the week, plan the day, then move queue items safely in capped, gated runs |
| **leadership** | `coaching-angles`, `personality`, `one-on-one-prep`, `open-items`, `onboarding` | Prep a manager. One moment, a DISC read, a one-on-one brief, commitment tracking, one-skill config. Nothing is sent. |

## What does *not* live here

- **Writing skills:** install from Triumph plugins; not in bstack.
- Domain filler packs (communication, engineering, faith, health, gtm, design, project-ops; the small PM set lives in `agent-ops`). Leadership is five coaching skills, not a filler pack. Household is three rhythm skills, not a family domain pack. Prefer seats, Triumph, pstack, or upstream marketplace packs instead of growing bstack with filler.
- Triumph Rock / Lava / C# / SQL delivery, PM, and sales playbooks
- Product defaults for Showup / Atlas / bradcerb.com
- Secrets, tokens, Notion database IDs, client PII
- Branded money-coach program copy (procedures stay principle-based)
- Seat wiring (who you are, company lane, CRM, voice) - keep that in the seat or workspace config, not in downloadable skills

## How projects pull

**Coding** → pstack (always the floor). Companion: cursor-team-kit when installed.

**Beliefs / fluency / capture** → `thinking` + `knowledge-intake`.

**Personal money** → `money` (optional CFO seat). Numbers from your ledger connectors or sheets; skills are judgment procedures only.

**Relationships** → `relationships` for method (conference who-to-meet, thank-you, circle rotation, touch notes). Lane, skip list, circle cadences, and the weekly touch count live in `relationships` settings in `workspace.json`. Voice and CRM stay outside the skill. Nothing is sent.

**Household rhythms** → `household` (`date-night`, `evening-activities`, `weekend-with-kids`). Each skill reads and updates `household.rhythms` and files a reminder on `tasks.commitments`. Nothing is sent.

**Writing / voice** → Triumph plugins and Writer / Public Posts seats. Not bstack.

**Triumph delivery / client GTM / product quirks** → Triumph plugins, Corey upstream, or that product's repo.

**Planning and work queue:** `agent-ops`. `project-brief` opens a project, `weekly-plan` sets the week's priorities, `daily-plan` picks today's slice and feeds the queue, `gated-work` moves the items. Those three read their source kinds from `workspace.json`. `project-brief` declares no config. The skill owns the method.

## Money procedures

`plugins/money` is principle-based personal finance *procedures* anyone can use. Educational planning aids, not advice.

### Numbers vs procedures

| Layer | Role |
| --- | --- |
| **Live balances / txs** | Finance connector (Plaid) when connected; read-only |
| **Plan / categories sheet** | Tiller (or any sheet) only while it is still the household plan source |
| **Optional ledger agents** | [fiscal.sh](https://fiscal.sh/) / `fscl` on Actual Budget upstream; install like Corey, do not fork into bstack |
| **bstack `money`** | Skills below; ask for numbers; never store credentials |

Pick one plan ledger long-term. Do not run three books forever.

### Skills in `money`

- `money-check` - calm snapshot + one decision
- `bill-triage` - medical/household bills and EOBs
- `margin-plan` - zero-based month: every dollar assigned (giving is an optional line here)
- `debt-order` - smallest-balance-first default; optional largest-APR compare
- `cash-cushion` - starter buffer vs fuller months-of-expenses cushion
- `purchase-pause` - need / wait / yes before a non-budget buy
- `money-date` - short household money meeting agenda
- `step-status` - ordered foundations ladder; current step + one next action

### What not to put in the plugin

- Bank credentials, card numbers, SSNs
- One-off tax advice or investment picking
- Client or employer billing (different lane)
- Branded program names or trademarked product copy

## Relationships procedures

`plugins/relationships` is four sharp jobs, not a life-domain matrix. They surface and draft. They never send.

- `conference-who-to-meet` - public roster → Must/Should/Nice → draft-only reach-outs and follow-ups (operational networking preferences; no book dumps)
- `thank-you-note` - one specific memory + one concrete offer/next step; draft only
- `circle-rotation` - a weekly pick of N people (default 5), scored by days since last touch divided by cadence, with a reason and a suggested opener. Family-inner is excluded from the count. 3 of 5 is a good week.
- `touch-note` - a free-text recap becomes one `log.touches` entry, updates `last_touched` on `people.circles`, files a promise on `tasks.commitments`, and hands off to `thank-you-note` when gratitude is the point

`conference-who-to-meet` may read `relationships.author_lane` and `relationships.skip_list` when those settings are filled. `circle-rotation` reads `relationships.circle_cadences`, `relationships.weekly_touches`, and the same skip list. `thank-you-note` may read `voice.style-guide` when that kind is bound. An optional entry can be absent. CRM stays outside the skill. Change the method here once; point seats at it.

## Household procedures

`plugins/household` is three rhythms, not a family domain pack. The principles are paraphrased: repeated patterns form a household, grace comes before the habit, something beats nothing, start with one small practice, and the table and hospitality are the keystone. Each skill reads and updates one `household.rhythms` row (next date and how it went) and files a reminder on `tasks.commitments`. A bound `calendar.events` may also receive one draft event. None of them sends a message or an invitation.

- `date-night` - one recurring date-night rhythm: cadence, simple ideas, budget, prep and childcare checklist
- `evening-activities` - one weeknight practice (table, bedtime, screens off, one activity) for the season and the kids' ages, plus a check-in date
- `weekend-with-kids` - a light weekend: rest, one outing, hospitality at home, chores together. Weather or season is an optional pasted input

## Leadership procedures

`plugins/leadership` is back as a portable plugin. Five skills, not a domain filler pack. They prep a manager for a live conversation. They do not message anyone, post, schedule, or take the conversation over.

- `coaching-angles` reads team call transcripts for a window (since the last run, or the last 7 days, unless the caller overrides it) and returns one sourced moment per person, tied to a growth area. Delivery comes from `personality`. Quiet when nothing qualifies. A host schedule can run it; the date window is the override.
- `personality` reads the configured DISC source on request. No cache, no fallback, no guessed style.
- `one-on-one-prep` builds a private brief from recent one-on-ones, call transcripts, `open-items`, the skill assessment, and `personality`. It does not send an agenda or script the meeting.
- `open-items` stores commitments through `sources["log.open-items"]` and reads `sources["tasks.commitments"]`. Add, update or close, list open. It surfaces items. The human follows up.
- `onboarding` reads one named skill's `bstack-config` line, writes missing entries in the v2 binding shape, and stops.

Leadership skills declare those entries in frontmatter. The old flat `leadership.*` names map to the homes in [SOURCES.md](./SOURCES.md).

## Agent ops procedures

`plugins/agent-ops` is planning plus gated execution. Order of use: `project-brief` (open), `weekly-plan` (week), `daily-plan` (day), `gated-work` (run). Not a PM board owner. Not leadership coaching.

- `weekly-plan` - takes a weekly review or week snapshot (pasted upstream output with What got done / In flight / Coming up / Stuck or at risk, or equivalent lists). Light roles scan, need/want brainstorm, separate large from small, prune to about three to five ranked priorities, reduce the rest (eliminate, defer, delegate, automate), place big rocks first with slack. Draft only.
- `project-brief` - for a real project (large initiative, unique result, end point): purpose and success measure, principles, scope in and not doing, action stages as finish lines, info/risks/waiting on, one next action. Keeps active projects few. Draft only.
- `daily-plan` - process inbox slices top to bottom (delete, file, do if two minutes or less, delegate, defer to a trusted list), pick about three most important tasks tied to the week's priorities, shape the day at 70 percent with a deep-work block and batched quick clears, hand agent-runnable items to `gated-work` with the handoff checklist, park next actions at shutdown. Draft only.
- `gated-work` - capped runs (default 5, planned at about 70 percent capacity; leftovers roll over). Classify do now / draft for gate / defer / eliminate / skip. Handoff checklist per item: desired result, guidelines, resources, accountability, consequences. Human gate, execute, verify, close with evidence. Quiet when empty.

### Skill, routine, connector

| Layer | Owns | Example |
| --- | --- | --- |
| Skill (this repo) | The method | `weekly-plan` steps and output shape |
| Routine or command | When it runs | A Friday routine, a slash command, a scheduled agent |
| Connector | The data | Task board, calendar, repo issues, inbox |

Upstream commands are inputs, not forks. If an org already ships a `/weekly-review` command that pulls its tasks and calendar, run it, paste the output into `weekly-plan`, and let this skill add triage and priorities. Do not copy the upstream command into bstack. `weekly-plan` is deliberately not named weekly-review, so it stays distinct from those commands and from Cursor Team Kit's `weekly-review` skill.

Default gates: send, spend, merge, publish, delete, relationship-affecting outreach.

## One line

Coding floor = pstack. High-value portable skills = bstack (`knowledge-intake`, `thinking`, `money`, `relationships`, `agent-ops`, `leadership`, `household`). Writing = Triumph plugins. Upstream marketing = Corey. Optional money ledger agents = fiscal.sh. One product's quirks = that product's repo.
