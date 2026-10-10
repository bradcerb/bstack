# household

Three rhythms for a household. Each one produces a calendar prompt or tasks. None of them messages anyone or sends an invitation.

The method paraphrases household-liturgy principles from Justin Whitmel Earley's *Habits of the Household*: ordinary routines already form the people in a home, grace comes before the habit, something is better than nothing, start with one small practice, and the table and an open chair are the keystone. These skills are a planning paraphrase. They are not a summary of the book.

| Skill | Job |
| --- | --- |
| `date-night` | One recurring date-night rhythm: cadence, simple ideas inside a budget, and a prep and childcare checklist. |
| `evening-activities` | One weeknight practice for the season and the kids' ages: table, bedtime, screens off, one activity. Plus a check-in date. |
| `weekend-with-kids` | A light weekend: rest, one outing, hospitality at home, and one chore done together. Weather or season can be pasted in. |

Copy the repo `examples/workspace.json.example` to `workspace.json` where you run skills. Each skill declares `calendar.events?` and `tasks.commitments?` on `metadata.bstack-config`. Both are optional. When neither is bound, the skill still returns the plan as a paste-ready prompt.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md) and [SOURCES.md](../../SOURCES.md).
