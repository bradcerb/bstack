---
name: touch-note
description: >-
  Use to turn a free-text recap and a person into one structured touch entry,
  update that person's last-touched date, and file a promise as a task when
  the recap includes one. Hands off to thank-you-note when gratitude is the
  point. Draft only. Does not send.
metadata:
  bstack-config: "sources: log.touches people.circles tasks.commitments | settings: workspace.timezone?"
  bstack-sources: "log.touches: append; people.circles: read-write; tasks.commitments: write"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "personal"
---

# Touch note

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`workspace.timezone` is optional. Absent, empty, or a value that starts with `REPLACE_WITH` is skipped. Do not ask for it.

Turn one free-text recap plus one person into a single touch record. Then stop. This skill does not send a message.

## Inputs

- The person. Match one row in `people.circles` by name, without case.
- The recap, in the caller's words.
- Optional: the date, the channel, and whether gratitude is the point.

Ask once when the person is missing, when two rows share the name, or when `sentiment` cannot be read from the recap. Sentiment is only `warm`, `neutral`, or `cooling`. Do not guess it.

If the person is not in `people.circles`, ask once whether to add a row and which circle they belong to. Do not invent the circle. Do not write a row until they answer.

## Record

Build one `log.touches` object. The shape is in SOURCES.md.

- `date`: the date in the recap. If it has none, today in `workspace.timezone` when that setting is set. If the timezone was skipped and the recap has no date, ask once.
- `person`: the matched name.
- `channel`: the channel in the recap, else the row's `channel`, else ask once.
- `talked_about`: what you talked about. Empty if the recap does not say.
- `whats_new`: what is new. Empty if the recap does not say.
- `promised`: the promise, in their words. Empty if they did not make one. Do not invent one.
- `next_step` and `next_step_date`: only what the recap names. Leave the date null when they named a step and no date.
- `sentiment`: `warm`, `neutral`, or `cooling`.

Append that one object. Do not rewrite earlier lines. A file binding is one JSON object per line. If the file is missing, create it with this one line. A connector binding creates one row. A `paste` binding returns the object in the reply.

## Update the person

After the append succeeds, set that row's `last_touched` to the record's `date`. Leave every other field as it was. Write the row back through `people.circles`.

## Promise

When `promised` is non-empty, append one task to the first binding of `tasks.commitments`. Leave any later bindings unchanged.

```json
{
  "person": "",
  "promised": "",
  "next_step_date": null,
  "source": "touch-note",
  "status": "open"
}
```

Fill `person`, `promised`, and `next_step_date` from the touch. A file that is a JSON array gets the object appended. A missing or empty file becomes a one-element JSON array. Another shape: show the object and ask once before writing.

Do not write `log.open-items`. That log belongs to `open-items`.

## Gratitude

When the caller says gratitude is the point, or the recap is mainly thanks for something a person did, hand off to `thank-you-note` after the touch is filed.

Pass the person, the channel, the specific thing they did, and any real next step. If the recap has no specific memory, do not invent one. Say `thank-you-note` needs that memory, skip the handoff, and keep the touch record.

The handoff is a draft. Do not send it.

## Output

```
## Touch note

Record: the object that was appended
Last touched: the date written on the person row
Promise: the task appended, or none
Thank-you: the unsent draft, or not the point
```

## Hard rules

- Do not send, schedule, or post.
- One recap, one person, one new touch line.
- Do not invent promises, sentiment, circles, or memories.
- Do not change `last_touched` for anyone except the matched person.
