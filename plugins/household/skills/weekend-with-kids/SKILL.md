---
name: weekend-with-kids
description: >-
  Use to plan a light weekend with kids: rest, one outing, hospitality at
  home, and one chore done together. Weather or season may be pasted in.
  Reads and updates the weekend row on household.rhythms and files a reminder
  on the tasks source. Does not send invitations or messages.
metadata:
  bstack-config: "sources: household.rhythms tasks.commitments calendar.events?"
  bstack-sources: "household.rhythms: read-write; tasks.commitments: write; calendar.events: read-write"
---

# Weekend with kids

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. The rhythm row is still updated, and the reminder is still filed on `tasks.commitments`.

Plan a light weekend. Rest stays even when the rest of the plan shrinks.

## Principles

- The weekend forms the household as much as a weeknight does. Keep it light enough to repeat.
- Grace comes before the habit. A full calendar means keep rest and drop the outing.
- Something is better than nothing.
- One small start. If four beats is too many, mark one beat as the one to keep and the others as optional.
- Hospitality is an open chair or a simple meal at home. It is not a performance, and it is not a message to someone outside the house.
- A chore done together is shared work, not a lecture.

## Inputs

- Which weekend, if they named one. Otherwise the next weekend.
- Kids' ages, when the outing or the chore depends on them. Ask once if missing.
- Weather or season, only when they paste it or it is already in the conversation. Do not look up a forecast. If they paste rain, cold, or heat, the outing moves indoors. If they paste nothing, give one indoor outing and one outdoor outing and let the prompt say they choose when they see the day.

## The four beats

Keep each beat to one or two lines.

1. Rest. A real stop, with a screen boundary on that block. Do not stack the outing on top of it.
2. One outing. Generic and local: a walk, a park, a free indoor room. No named venue.
3. Hospitality at home. An extra place at the table, or a simple shared meal, or an explicit "not this weekend". Do not write or send an invitation.
4. One chore done together, sized to the ages. Name the job. Leave the rest of the housework off this plan.

If the weekend they describe is already full, keep rest, mark the outing optional, and say why.

## Rhythm row

Read `household.rhythms` before writing. The row shape is in SOURCES.md. `type` for this skill is `weekend`.

Match that type. If several rows match, ask which one. If none exists, create one when they confirm the plan. Storage follows the binding: a file is a JSON array (create the array if the file is missing), a connector is a row in that target, and `paste` means return the row. Do not name a product, and do not swap the binding for a different tool.

- `frequency` is the weekend cadence they name, or each weekend when they do not name one.
- `who` is who the weekend is for.
- `notes` holds the four beats, and which one to keep if the weekend shrinks.
- `next_date` is the start of the weekend being planned. If `calendar.events` shows those days taken, keep the plan in `notes` and say so. Do not stuff beats into full days.
- `how_it_went` is written only from what they report about the last weekend. Leave it unchanged when they do not say. Do not invent it.
- `status` `active` means keep it and file a reminder. `paused` means do not move `next_date` and do not file a reminder unless they ask to resume. `idea` means store the proposal and do not file a reminder until they set it `active`.

## Reminder

When the row is `active`, append one reminder to the first binding of `tasks.commitments`. Leave later bindings unchanged. One reminder for the weekend, not one task per beat.

```json
{
  "title": "Weekend with kids",
  "due": "",
  "who": "",
  "notes": "",
  "source": "household.rhythms",
  "status": "open"
}
```

Fill `due` from `next_date`, `who` from the row, and `notes` with the beats. A JSON array gets the object appended. A missing or empty file becomes a one-element JSON array. A connector creates one row in that target. Another shape: show the reminder and ask once before writing.

When `calendar.events` is bound, also append one draft event for that weekend. Do not invite anyone and do not send.

## Output

```
## Weekend with kids

Rest:
Outing:
Hospitality:
Chore together:
Keep even if the weekend shrinks:
Rhythm: type, status, next date, how it went (or unchanged)
Reminder: the task filed, or skipped because the row is paused or an idea
```

## Hard rules

- Do not message a guest, a child, or anyone else.
- Do not draft or send an invitation. Hospitality in this skill stays in the house.
- Do not look up weather on your own.
- Do not fill both days. Light means room left over.
