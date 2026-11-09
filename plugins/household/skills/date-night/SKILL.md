---
name: date-night
description: >-
  Use to suggest and plan one recurring date-night rhythm: a cadence, a few
  simple ideas, a budget, and a prep and childcare checklist. Reads and updates
  the date-night row on household.rhythms and files a reminder on the tasks
  source. Does not send invitations or messages.
metadata:
  bstack-config: "sources: household.rhythms tasks.commitments calendar.events?"
  bstack-sources: "household.rhythms: read-write; tasks.commitments: write; calendar.events: read-write"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "yes"
  bstack-scope: "personal"
---

# Date night

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. The rhythm row is still updated, and the reminder is still filed on `tasks.commitments`.

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

## Rhythm row

Read `household.rhythms` before writing. The row shape is in SOURCES.md. `type` for this skill is `date night`.

Match that type. If several rows match, ask which one. If none exists, create one when they confirm the plan. Storage follows the binding: a file is a JSON array (create the array if the file is missing), a connector is a row in that target, a tool is one call with the row, and `paste` means return the row. Do not name a product, and do not swap the binding for a different tool.

- `frequency` is the cadence they confirmed.
- `who` is who the date is for.
- `notes` holds the chosen idea, the prep list, and the childcare list.
- `next_date` is the next occurrence. Set it when the plan is confirmed, and move it forward by the frequency after a date happens.
- `how_it_went` is written only from what they report about the last time. Leave it unchanged when they do not say. Do not invent it.
- `status` `active` means keep it and file a reminder. `paused` means do not move `next_date` and do not file a reminder unless they ask to resume. `idea` means store the proposal and do not file a reminder until they set it `active`.

## Reminder

When the row is `active`, append one reminder to the first binding of `tasks.commitments`. Leave later bindings unchanged. One reminder for the next date, not one per checklist line.

```json
{
  "title": "Date night",
  "due": "",
  "who": "",
  "notes": "",
  "source": "household.rhythms",
  "status": "open"
}
```

Fill `due` from `next_date`, `who` from the row, and `notes` with the idea plus the two lists. A JSON array gets the object appended. A missing or empty file becomes a one-element JSON array. A connector creates one row in that target. A tool gets one call with the object. Another shape: show the reminder and ask once before writing.

When `calendar.events` is bound, also append one draft event for that same next date. Do not invite anyone and do not send. If the day is taken, say so and still keep the rhythm row and the reminder.

## Output

```
## Date night

Cadence:
Idea:
Budget:
Prep:
Childcare:
Rhythm: type, status, next date, how it went (or unchanged)
Reminder: the task filed, or skipped because the row is paused or an idea
```

A missed date does not need a makeup marathon.

## Hard rules

- Do not message a partner, a sitter, or anyone else.
- Do not send an invitation.
- One rhythm, not a stack of new events.
- Do not invent a budget, a sitter, or a place they did not name.
