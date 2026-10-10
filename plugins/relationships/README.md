# relationships

Four sharp jobs. They surface and draft. They do not message anyone, and they do not send.

| Skill | Job |
| --- | --- |
| `conference-who-to-meet` | Rank a public roster for one named trip and draft reach-outs. Draft only until the author says send. |
| `thank-you-note` | One specific memory and one concrete offer or next step. Draft only. |
| `circle-rotation` | A weekly pick of N people. Score is days since last touch divided by cadence. A reason and a suggested opener for each. Nothing is sent. |
| `touch-note` | Turn a free-text recap into one touch record, update last-touched, and file a promise as a task. Hands off to `thank-you-note` when gratitude is the point. |

Copy the repo `examples/workspace.json.example` to `workspace.json` in the workspace where you run skills. That file is yours and it is gitignored. Each skill that declares config names its entries once, in frontmatter, on `metadata.bstack-config`. Access for those kinds is on `metadata.bstack-sources`. A required entry is missing when it is absent, empty, or starts with `REPLACE_WITH`.

`circle-rotation` reads `people.circles` and the settings `relationships.circle_cadences` and `relationships.weekly_touches`. `relationships.skip_list`, `log.touches`, `calendar.events`, and `tasks.commitments` are optional on that skill. `touch-note` appends to `log.touches`, updates `people.circles`, and appends a promise to `tasks.commitments`.

The row shapes and the alias table are in the repo-root [SOURCES.md](../../SOURCES.md). Do not keep a second copy here.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md).
