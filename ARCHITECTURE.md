# bstack

High-value, portable skill plugins you can install and reuse. Not a second engineering floor. Not one plugin per life domain.

**pstack** stays the coding floor (verify first, small changes, clean PRs).
**bstack** ships only skills worth downloading: knowledge intake, thinking, personal money procedures, and sharp relationship jobs.

Writing skills install from Triumph plugins; not in bstack. Corey Haines marketing skills stay upstream. Do not fork either here.

## How to use this

1. Install the plugin you need (or copy the `skills/` folders).
2. Fill in `examples/workspace.json.example` with *your* paths and Notion targets. Never commit real IDs or secrets.
3. Run the skill when its trigger matches. Skip the rest.

Anyone should be able to start with empty configs and clear skill names. No jargon required.

## Plugins

| Plugin | Skills (names) | When to load |
| --- | --- | --- |
| **knowledge-intake** | `knowledge-intake`, `capture-articles`, `capture-newsletters`, `capture-podcasts`, `capture-youtube`, `capture-meetings`, `wiki-ingest` | Capture → raw → wiki |
| **thinking** | `form-my-point-of-view`, `examine-my-alignment`, `build-fluency`, `action-method` | Beliefs, understanding, deciding |
| **money** | `money-check`, `bill-triage`, `margin-plan`, `debt-order`, `cash-cushion`, `purchase-pause`, `money-date`, `step-status` | Personal money procedures. Optional CFO seat. No bank secrets in the repo. |
| **relationships** | `conference-who-to-meet`, `thank-you-note` | Sharp reusable jobs (conference prep + thank-you). Not a domain filler pack. Seats keep lane/voice/tools. |

## What does *not* live here

- **Writing skills:** install from Triumph plugins; not in bstack.
- Domain filler packs (communication, engineering, faith, family, health, gtm, design, project-ops, leadership). Prefer seats, Triumph, pstack, or upstream marketplace packs instead of growing bstack.
- Triumph Rock / Lava / C# / SQL delivery, PM, and sales playbooks
- Product defaults for Showup / Atlas / bradcerb.com
- Secrets, tokens, Notion database IDs, client PII
- Branded money-coach program copy (procedures stay principle-based)
- Seat wiring (who you are, company lane, CRM, voice) — keep that in the seat or workspace config, not in downloadable skills

## How projects pull

**Coding** → pstack (always the floor). Companion: cursor-team-kit when installed.

**Beliefs / fluency / capture** → `thinking` + `knowledge-intake`.

**Personal money** → `money` (optional CFO seat). Numbers from your ledger connectors or sheets; skills are judgment procedures only.

**Relationships** → `relationships` for method (conference who-to-meet, thank-you). Trip lane, voice, and CRM stay in the seat (e.g. Conference Scout points at the skill as SoT).

**Writing / voice** → Triumph plugins and Writer / Public Posts seats. Not bstack.

**Triumph delivery / client GTM / product quirks** → Triumph plugins, Corey upstream, or that product's repo.

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

## One line

Coding floor = pstack. High-value portable skills = bstack (`knowledge-intake`, `thinking`, `money`, `relationships`). Writing = Triumph plugins. Upstream marketing = Corey. Optional money ledger agents = fiscal.sh. One product's quirks = that product's repo.
