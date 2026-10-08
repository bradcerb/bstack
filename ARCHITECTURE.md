# bstack

High-value, portable skill plugins you can install and reuse. Not a second engineering floor. Not one plugin per life domain.

**pstack** stays the coding floor (verify first, small changes, clean PRs).
**bstack** ships only skills worth downloading: knowledge intake, thinking, personal money procedures, sharp relationship jobs, and agent ops (planning plus gated execution).

Writing skills install from Triumph plugins; not in bstack. Corey Haines marketing skills stay upstream. Do not fork either here.

## How to use this

1. Install the plugin you need (or copy the `skills/` folders).
2. Copy `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. Fill in your paths, sources, and targets. Never commit that file or real IDs.
3. Run the skill when its trigger matches. Skip the rest.

Anyone should be able to start with empty configs and clear skill names. No jargon required.

## Config check

`workspace.json` is the one config file you own. It is gitignored. Skills that read a source, a roster, or a schedule check it before they do anything else.

The check is per skill. If a field that skill needs is missing, empty, or still a `REPLACE_WITH_` placeholder, the skill asks only for those fields, writes them into `workspace.json`, and continues. It does not interview you for the whole pack.

A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. A value of `paste` means you will supply that data in the conversation. A path, label, or connector name is filled in by you.

Skills that only think from what you bring (no source, roster, or schedule) do not read this file.

`plugins/knowledge-intake/examples/workspace.json.example` remains the field list for that plugin. The root example lists every field. Relative paths resolve from the workspace where the skill runs.

| Field | Skills | What you put there |
| --- | --- | --- |
| `raw_dir`, `loop_state`, `notion_raw_db`, `notion_wiki_db`, `notion_wiki_log`, `podcast_feeds` | knowledge-intake capture and ingest | Paths and Notion targets. |
| `youtube_channels` | `capture-youtube` | Optional channel registry. A submitted video URL does not need it. |
| `newsletter_sources` | `capture-newsletters` | Mailbox label, approved sender list, or newsletter feed list. |
| `calendar_source` | `capture-meetings`, `daily-plan` | Calendar to read. |
| `meeting_lookback` | `capture-meetings` | How far back to search completed events, such as `7d`. |
| `inbox_source` | `daily-plan` | Inbox to process. Use `paste` if you will supply items in the conversation. |
| `priorities_source` | `daily-plan` | Where this week's priorities live. `paste` is allowed. |
| `week_snapshot_source` | `weekly-plan` | Week snapshot (done, in flight, coming up, stuck). `paste` is allowed. |
| `work_queue_source` | `gated-work` | Queue, board, or repo slice to run. `paste` is allowed. |

The example also includes `workspace_id`, `workspace_root`, `wiki_ingest_skill`, `guardrails`, `routing_policy`, and `schema_categories`. Skills still read those where their existing steps already say so. They are not part of this pause list.

## Keepers

| Plugin | Skills (names) | When to load |
| --- | --- | --- |
| **knowledge-intake** | `knowledge-intake`, `capture-articles`, `capture-newsletters`, `capture-podcasts`, `capture-youtube`, `capture-meetings`, `wiki-ingest` | Capture → raw → wiki |
| **thinking** | `form-my-point-of-view`, `examine-my-alignment`, `build-fluency`, `action-method` | Beliefs, understanding, deciding |
| **money** | `money-check`, `bill-triage`, `margin-plan`, `debt-order`, `cash-cushion`, `purchase-pause`, `money-date`, `step-status` | Personal money procedures. Optional CFO seat. No bank secrets in the repo. |
| **relationships** | `conference-who-to-meet`, `thank-you-note` | Sharp reusable jobs (conference prep + thank-you). Not a domain filler pack. Seats keep lane/voice/tools. |
| **agent-ops** | `project-brief`, `weekly-plan`, `daily-plan`, `gated-work` | Open a project, plan the week, plan the day, then move queue items safely in capped, gated runs |

## What does *not* live here

- **Writing skills:** install from Triumph plugins; not in bstack.
- Domain filler packs (communication, engineering, faith, family, health, gtm, design, project-ops, leadership; the small PM set lives in `agent-ops`). Prefer seats, Triumph, pstack, or upstream marketplace packs instead of growing bstack.
- Triumph Rock / Lava / C# / SQL delivery, PM, and sales playbooks
- Product defaults for Showup / Atlas / bradcerb.com
- Secrets, tokens, Notion database IDs, client PII
- Branded money-coach program copy (procedures stay principle-based)
- Seat wiring (who you are, company lane, CRM, voice) - keep that in the seat or workspace config, not in downloadable skills

## How projects pull

**Coding** → pstack (always the floor). Companion: cursor-team-kit when installed.

**Beliefs / fluency / capture** → `thinking` + `knowledge-intake`.

**Personal money** → `money` (optional CFO seat). Numbers from your ledger connectors or sheets; skills are judgment procedures only.

**Relationships** → `relationships` for method (conference who-to-meet, thank-you). Trip lane, voice, and CRM stay in the seat (e.g. Conference Scout points at the skill as SoT).

**Writing / voice** → Triumph plugins and Writer / Public Posts seats. Not bstack.

**Triumph delivery / client GTM / product quirks** → Triumph plugins, Corey upstream, or that product's repo.

**Planning and work queue:** `agent-ops`. `project-brief` opens a project, `weekly-plan` sets the week's priorities, `daily-plan` picks today's slice and feeds the queue, `gated-work` moves the items. The caller owns the source; the skill owns the method.

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

`plugins/relationships` is two sharp jobs, not a life-domain matrix.

- `conference-who-to-meet` - public roster → Must/Should/Nice → draft-only reach-outs and follow-ups (operational networking preferences; no book dumps)
- `thank-you-note` - one specific memory + one concrete offer/next step; draft only

Identity, company lane, CRM, and voice live outside the skill (seat memory or workspace config). Change the method here once; point seats at it.

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

Coding floor = pstack. High-value portable skills = bstack (`knowledge-intake`, `thinking`, `money`, `relationships`, `agent-ops`). Writing = Triumph plugins. Upstream marketing = Corey. Optional money ledger agents = fiscal.sh. One product's quirks = that product's repo.
