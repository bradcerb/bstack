# household

Three rhythms for a household. Each one reads and updates a `household.rhythms` row, then files a reminder on `tasks.commitments`. None of them messages anyone or sends an invitation.

The method paraphrases household-liturgy principles from Justin Whitmel Earley's *Habits of the Household*: ordinary routines already form the people in a home, grace comes before the habit, something is better than nothing, start with one small practice, and the table and an open chair are the keystone. These skills are a planning paraphrase. They are not a summary of the book.

| Skill | Job |
| --- | --- |
| `date-night` | One recurring date-night rhythm: cadence, simple ideas inside a budget, and a prep and childcare checklist. Updates the `date night` row. |
| `evening-activities` | One weeknight practice for the season and the kids' ages: table, bedtime, screens off, one activity. Updates the `weeknight` row. |
| `weekend-with-kids` | A light weekend: rest, one outing, hospitality at home, and one chore done together. Weather or season can be pasted in. Updates the `weekend` row. |

Copy the repo `examples/workspace.json.example` to `workspace.json` where you run skills. Each skill declares `household.rhythms` and `tasks.commitments` on `metadata.bstack-config`, and `calendar.events?` as optional. A bound calendar may receive one draft event. It is not required, and it is not an invitation. The reminder is the task.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md) and [SOURCES.md](../../SOURCES.md).
