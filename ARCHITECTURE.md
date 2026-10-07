# bstack

Brad's personal skill stack. Simple plugins you can install and use. Not a second engineering floor.

**pstack** stays the coding floor (verify first, small changes, clean PRs).
**bstack** is the rest of life and work: thinking, communication, money, health, family, faith, freelance, and how you show up with people.

Triumph Rock, project management, and sales playbooks live in the Triumph repos and get used mainly in Claude with the team. They are not copied here.

**Writing skills:** install from Triumph plugins; not in bstack. (`write-like-me`, voice, coach, long-form, social stay there.)

Corey Haines marketing skills stay upstream. Install them when you need them. Don't fork them into this repo.

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
| **communication** | `draft-never-send`, `clear-ask`, `hard-news`, `meeting-follow-up` | Emails, messages, updates (draft only) |
| **leadership** | `one-on-one`, `feedback-draft`, `decision-log` | Managing people (run by hand first; skills help after) |
| **relationships** | `conference-who-to-meet`, `relationship-note`, `thank-you-note` | Networking and follow-through (you still own the call) |
| **gtm** | `gtm-guardrails` | Freelance / personal marketing. Corey stays separate. |
| **design** | `figma-design-handoff`, `leave-behind-check` | Design handoff and print checks |
| **engineering** | `cloud-agent-handoff`, `prove-plugin-local` | Your agent/plugin habits. Repo floor is still pstack. |
| **money** | `money-check`, `bill-triage` (add Ramsey set below) | Personal money. **CFO seat installs this plugin.** No bank secrets in the repo. |
| **health** | `training-note`, `recovery-check` | Log and plan with a coach seat; thin skills only |
| **family** | `family-rhythm`, `calendar-boundaries` | Protect evenings and weekends on purpose |
| **faith** | `reflection`, `reading-plan` | Quiet practices. Portable. Not a sermon kit. |
| **project-ops** | `project-brief`, `weekly-review` | Side and freelance projects. Triumph PM stays in Triumph. |


## Seats that load plugins

| Seat | Loads from bstack |
| --- | --- |
| CFO | `money` |
| Coach | `health` (thin; Coach owns plans) |
| Host / Conference Scout | `relationships` |
| Client GTM | `gtm` (+ Corey upstream, Triumph writing) |

Other plugins are on-demand for any bot or for you directly.

## What does *not* live here

- **Writing skills:** install from Triumph plugins; not in bstack.
- Triumph Rock / Lava / C# / SQL delivery
- Triumph project management and sales (later, in Triumph plugins)
- Showup / Atlas / bradcerb.com product defaults (those stay in those repos)
- Transform SEO loops (done)
- Secrets, tokens, Notion database IDs, client PII

## How projects pull

**Triumph Rock work** → pstack + Triumph plugins (Claude) + Rock Lab seat. Writing from Triumph when needed.

**Freelance client** → Corey (upstream) + `gtm` + Triumph writing skills + Client GTM seat. Code still gets pstack.

**Showup / Atlas / bradcerb.com** → pstack + that repo's defaults + the right seats. Add `engineering` from bstack when you need it; writing from Triumph.

**Beliefs / fluency** → `thinking` + `knowledge-intake`.

**Conference week** → relationship seats + `relationships` skills. Judgment stays human.



## Money and the CFO seat

The **CFO** bot installs `plugins/money`. That is the home for personal finance procedures.

Tiller (or any ledger) is the *data* path. Skills never hold bank logins. The human pastes numbers or the CFO seat reads an approved connector.

### Skills to keep in `money` (portable, anyone can use)

Already shipped:
- `money-check` — calm snapshot + one decision
- `bill-triage` — medical/household bills and EOBs

Add next (Dave Ramsey–shaped, plain names):
- `baby-steps-status` — where you are on Baby Steps 1–7, one next move
- `zero-based-budget` — every dollar a job for this month
- `debt-snowball` — debts smallest to largest; which one to attack
- `emergency-fund-check` — starter vs fully funded; gap and timeline
- `purchase-pause` — before a non-budget buy: need, wait, or yes
- `money-date` — short couple/household money meeting agenda
- `giving-plan` — tithe/giving inside the budget (optional; faith-aware)

### What not to put in the plugin

- Bank credentials, card numbers, SSNs
- One-off tax advice or investment picking
- Triumph or client billing (different lane)

### Upstream?

There is no required upstream Ramsey plugin. If a solid public EveryDollar/Ramsey skill pack appears later, install it like Corey Haines and keep only *your* wrappers here. Until then, grow `plugins/money` in bstack and let CFO load it.

## One line

Coding floor = pstack. You = bstack. Writing = Triumph plugins. Triumph delivery = Triumph plugins. Upstream marketing = Corey. One product's quirks = that product's repo.
