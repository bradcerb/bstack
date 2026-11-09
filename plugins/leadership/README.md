# leadership

Portable management skills. Five jobs, each run on its own. They prep a manager for a live conversation. They do not message anyone, post, schedule, or take that conversation over.

| Skill | Job |
| --- | --- |
| `coaching-angles` | One specific coaching moment per person from team call transcripts, tied to a growth area, with delivery shaped by `personality`. |
| `personality` | Read one person's DISC profile from the configured source and return a short plain note on how to work with them. |
| `one-on-one-prep` | Private prep brief: history, open commitments, last feedback, growth area, a few topics. |
| `open-items` | Track commitments in both directions. Surface them. The human follows up. |
| `onboarding` | Ask for one named skill's missing config fields, write them into `workspace.json`, and stop. |

Copy the repo `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. That file is yours and it is gitignored. Each skill that declares config names its entries once, in frontmatter, on `metadata.bstack-config`. A required entry is missing when it is absent, empty, or starts with `REPLACE_WITH`.

`onboarding` is the interview for that check. Name one skill. It reads that skill's `bstack-config` line, writes v2 bindings, and stops. It will not walk the whole stack.

## Aliases

Old flat names still count until a file is rewritten. On write, store the v2 home and delete the old key. The table is in the repo-root [SOURCES.md](../../SOURCES.md). Do not keep a second copy here.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md) for which skills declare which entries, and how a host schedules `coaching-angles`.
