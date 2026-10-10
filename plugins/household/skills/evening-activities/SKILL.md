---
name: evening-activities
description: >-
  Use to suggest one small weeknight family rhythm for the season and the
  kids' ages: table, bedtime, screens off, and one activity. Returns that one
  practice and a check-in date as a calendar prompt or a task. Does not send.
metadata:
  bstack-config: "sources: calendar.events? tasks.commitments?"
  bstack-sources: "calendar.events: read-write; tasks.commitments: write"
---

# Evening activities

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` and `tasks.commitments` are optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for either. The plan is still produced.

Suggest one weeknight practice. A messy night still counts. Do not add a second practice in the same run.

## Principles

- The evening already forms the household. Choose one pattern on purpose.
- Grace comes before the habit. A short, imperfect night beats an abandoned ideal.
- Something is better than nothing.
- One small start. Table, bedtime, screens off, and one activity belong in that single practice, not four new programs.
- The table is the keystone. Screens have an off boundary. They are not banned forever.

## Inputs

Ask only when these are missing:

- The season, or the months they mean.
- The kids' ages. If there are no kids in the house, say so and plan a two-person evening with the same shape, or stop if they wanted a kids' plan.

Use a practice they already keep. Add only the missing piece. If the evening they describe already has table, bedtime, an off boundary, and one activity, say the rhythm is already there and do not invent a new one. Still offer a check-in date.

## The one practice

Write one practice in a few sentences:

- A device-free stretch at the table, with one question or one story, not a curriculum.
- A bedtime marker that is short enough to repeat when everyone is tired.
- A named screens-off time that covers the meal and the bedtime window. Curate that window. Do not prescribe the rest of the day.
- One activity that fits the ages and the season. Younger kids: shorter and physical. Older kids: talk, a game, or reading. Warm months can go outside. Cold months stay in. The activity is small.

The check-in date is about two weeks out. One date, not a streak chart.

## Where it goes

Write the practice and the check-in date once.

- When `calendar.events` is bound, append one draft event on the check-in date. The practice is the notes. Do not invite anyone and do not send. If that date is taken, use the next open day and say so.
- When that kind was skipped and `tasks.commitments` is bound, append one task to the first binding, due on the check-in date, with the practice in the body. A JSON array gets one object. A missing or empty file becomes a one-element JSON array. Another shape: show the task and ask once.
- When both were skipped, return a paste-ready calendar prompt with the practice and the check-in date.

## Output

```
## Evening practice

Practice:
Why this one:
Check-in date:
Where it went: draft event, task, or paste-ready prompt
```

## Hard rules

- Do not message anyone.
- Do not send an invitation.
- One practice. A night that only manages the table still counts.
- Do not invent ages, a season, or a screen rule they did not agree to.
