---
name: date-night
description: >-
  Use to suggest and plan one recurring date-night rhythm: a cadence, a few
  simple ideas, a budget, and a prep and childcare checklist. Writes a calendar
  prompt or a task. Does not send invitations or messages.
metadata:
  bstack-config: "sources: calendar.events? tasks.commitments?"
  bstack-sources: "calendar.events: read-write; tasks.commitments: write"
---

# Date night

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` and `tasks.commitments` are optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for either. The plan is still produced.

Plan one repeating date night. A missed one is not a debt. The next date on the cadence is enough.

## Principles

- A repeated pattern forms the household. One date night, kept, beats a clever plan you drop.
- Grace comes before the habit.
- Something is better than nothing, including a date at home.
- Start with one cadence. Do not add a second event in the same plan.
- The point is presence, not impressing anyone.

## Inputs

Ask only for what this plan still needs:

- Who the date is with.
- A budget ceiling, and zero is a real answer.
- Whether childcare is needed.
- A cadence they already want. If they have none, propose twice a month and let them change it.

Do not interview the rest of the household.

## Plan

1. Name one cadence. Default proposal: twice a month. Use the cadence they name instead.
2. Offer three simple ideas that fit the budget. One of them costs nothing and stays in. The other two stay generic (a walk, cooking, one low-cost outing). Do not name a city, a shop, or a product.
3. Write a short prep list: start, end, food or the plan for it, and what has to be true before you leave or before you stay in.
4. Write a childcare list. When none is needed, say so in one line. Otherwise: who is with the kids, the handoff, bedtime, and a backup if the plan slips. Do not invent a sitter.
5. When `calendar.events` can be read, do not put the draft on top of a conflict you can see. Pick the next open block that fits the cadence, or say the calendar is full and ask which day.

Confirm the cadence and the one idea before writing. If they already named both and asked you to plan it, write that one. If they say to pick, pick the no-cost idea on the proposed cadence.

## Where it goes

Write one plan.

- When `calendar.events` is bound, append one draft event: title, cadence, next date, duration, the chosen idea, and the two lists in the notes. Do not invite anyone and do not send.
- When that kind was skipped and `tasks.commitments` is bound, append one task to the first binding only. Put the same plan on the task. A JSON array gets one object. A missing or empty file becomes a one-element JSON array. Another shape: show the task and ask once.
- When both were skipped, return the same text as a paste-ready calendar prompt.

## Output

```
## Date night

Cadence:
Idea:
Budget:
Prep:
Childcare:
Where it went: draft event, task, or paste-ready prompt
```

A missed date does not need a makeup marathon.

## Hard rules

- Do not message a partner, a sitter, or anyone else.
- Do not send an invitation.
- One rhythm, not a stack of new events.
- Do not invent a budget, a sitter, or a place they did not name.
