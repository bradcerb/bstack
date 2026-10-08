# leadership

Portable management skills. Five jobs, each run on its own. They prep a manager for a live conversation. They do not message anyone, post, schedule, or take that conversation over.

| Skill | Job |
| --- | --- |
| `coaching-angles` | One specific coaching moment per person from team call transcripts, tied to a growth area, with delivery shaped by `personality`. |
| `personality` | Read one person's DISC profile from the configured source and return a short plain note on how to work with them. |
| `one-on-one-prep` | Private prep brief: history, open commitments, last feedback, growth area, a few topics. |
| `open-items` | Track commitments in both directions. Surface them. The human follows up. |
| `onboarding` | Ask for one named skill's missing config fields, write them into `workspace.json`, and stop. |

Copy the repo `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. That file is yours and it is gitignored. Each skill checks only the fields it names. A field is missing when it is absent, empty, or starts with `REPLACE_WITH`.

`onboarding` is the interview for that check. Name one skill. It will not walk the whole stack.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md) for the field list and how a host schedules `coaching-angles`.
