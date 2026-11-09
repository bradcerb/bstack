---
name: evening-activities
description: >-
  Use to suggest one small weeknight family rhythm for the season and the
  kids' ages: table, bedtime, screens off, and one activity. Reads and updates
  the weeknight row on household.rhythms and files a reminder on the tasks
  source. Does not send.
metadata:
  bstack-config: "sources: household.rhythms tasks.commitments calendar.events?"
  bstack-sources: "household.rhythms: read-write; tasks.commitments: write; calendar.events: read-write"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "personal"
---

# Evening activities

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. The rhythm row is still updated, and the reminder is still filed on `tasks.commitments`.

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

## Rhythm row

Read `household.rhythms` before writing. The row shape is in SOURCES.md. `type` for this skill is `weeknight`.

Match that type. If several rows match, ask which one. If none exists, create one when they confirm the practice. Storage follows the binding: a file is a JSON array (create the array if the file is missing), a connector is a row in that target, and `paste` means return the row. Do not name a product, and do not swap the binding for a different tool.

- `frequency` is weeknights, or the narrower cadence they name.
- `who` is who the evening is for.
- `notes` holds the one practice.
- `next_date` is the check-in, about two weeks out, or the next open day when `calendar.events` shows that day taken.
- `how_it_went` is written only from what they report about the last stretch. Leave it unchanged when they do not say. Do not invent it.
- `status` `active` means keep it and file a reminder. `paused` means do not move `next_date` and do not file a reminder unless they ask to resume. `idea` means store the proposal and do not file a reminder until they set it `active`.

## Reminder

When the row is `active`, append one reminder to the first binding of `tasks.commitments`. Leave later bindings unchanged.

```json
{
  "title": "Weeknight practice",
  "due": "",
  "who": "",
  "notes": "",
  "source": "household.rhythms",
  "status": "open"
}
```

Fill `due` from `next_date`, `who` from the row, and `notes` with the practice. A JSON array gets the object appended. A missing or empty file becomes a one-element JSON array. A connector creates one row in that target. Another shape: show the reminder and ask once before writing.

When `calendar.events` is bound, also append one draft event on that check-in date. Do not invite anyone and do not send.

## Output

```
## Evening practice

Practice:
Why this one:
Check-in date:
Rhythm: type, status, next date, how it went (or unchanged)
Reminder: the task filed, or skipped because the row is paused or an idea
```

## Hard rules

- Do not message anyone.
- Do not send an invitation.
- One practice. A night that only manages the table still counts.
- Do not invent ages, a season, or a screen rule they did not agree to.
