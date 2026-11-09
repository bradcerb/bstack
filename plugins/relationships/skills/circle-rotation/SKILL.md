---
name: circle-rotation
description: >-
  Use for a weekly pick of people to be in touch with. Scores each person by
  days since the last touch divided by their cadence, boosts birthdays, trigger
  notes, and open promises, and returns a ranked list with a reason and a
  suggested opener. Draft only. Does not send, schedule, or log the touch.
metadata:
  bstack-config: "sources: people.circles log.touches? calendar.events? tasks.commitments? | settings: relationships.circle_cadences relationships.weekly_touches relationships.skip_list?"
  bstack-sources: "people.circles: read; log.touches: read; calendar.events: read; tasks.commitments: read"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "personal"
---

# Circle rotation

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`log.touches`, `calendar.events`, and `tasks.commitments` are optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for them. `relationships.skip_list` is optional. Absent, a placeholder, or `"via": "none"` means this run has no saved skip list. A present list, including an empty one, is the skip list. If `relationships.circle_cadences` or `relationships.weekly_touches` is absent, write the defaults in this skill and continue. Do not ask the caller to design the windows.

A weekly list of people to be in touch with. The list is a suggestion. Nothing is sent, scheduled, or logged. Logging a real conversation is `touch-note`.

## Defaults

Write these when the setting is absent. If a value is already present, use it as written.

`relationships.weekly_touches` is `5`.

`relationships.circle_cadences`:

| Circle | min_days | max_days |
| --- | --- | --- |
| family-outer | 21 | 28 |
| friends-inner | 14 | 21 |
| friends-outer | 90 | 90 |
| professional-inner | 30 | 30 |
| professional-outer | 90 | 180 |

`family-inner` is not a key. That circle is stored and excluded from this count.

The cadence used in the score is `min_days`. A row's `cadence_days`, when it is a positive integer, replaces `min_days` for that person. Any other override is ignored. Say so, and use the circle window.

## Who is eligible

Read `people.circles`. One row per person, in the shape in SOURCES.md.

Leave the row unchanged. This skill does not write `people.circles` and does not append `log.touches`.

A row is out of the count when any of these is true:

- `circle` is `family-inner`
- `status` is `archived` or `snoozed`
- `snooze_until` is today or later
- the name is on `relationships.skip_list`, compared without case
- the caller names them to skip for this run only

A missing `status` means active. A caller skip applies to this run only. Do not write the skip list unless they ask to save a name onto it.

`family-inner` stays out even if the caller wants them on the list. Say this skill does not count that circle.

A circle value outside the six names is not scored. Name it once under "Not scored".

## Score

Use the date the caller is treating as today. Do not ask for a timezone.

`days` is today minus `last_touched`. When `last_touched` is missing, `days` is twice the cadence, so the base score is 2.

When `calendar.events` is bound, a past event in the last 7 days that names the person counts as a more recent touch for this run if that event is later than `last_touched`. Use it for `days`. Do not write it back.

Base score is `days / cadence`.

Add 1 when any trigger is true. Triggers do not stack. List every trigger in the reason. A standing context note, with no life change in it, does not boost.

- Birthday: `birthday` as month and day falls in the next 7 days, including today.
- Life change: `notes` names a job change or another change that is still current (a move, a loss, a new role). Quote the note. If the note is only background, do not boost, and do not invent a change that is not written there.
- Open promise on `log.touches`: the latest row for this person has a non-empty `promised`. Name that promise. An older promise that the latest row does not repeat does not boost.
- Open promise on `tasks.commitments`: a row that names the person and is not closed or done. Name it.
- Calendar, when `calendar.events` is bound: an event in the next 14 days that names the person and is itself a birthday, a job change, or another life event. A plain meeting does not boost. A plain meeting in the last 7 days is only the recency rule above.

Sort by score descending, then by `days` descending, then by name A to Z.

## Pick

`N` is `relationships.weekly_touches`. If it is not a positive integer, ask once.

Groups:

- family: `family-outer`
- friends: `friends-inner`, `friends-outer`
- professional: `professional-inner`, `professional-outer`

1. While the list has fewer than N names, and some group still has an eligible person who is not on the list, add the highest remaining person from the group whose top remaining person has the highest score.
2. Then walk the remaining people in sort order. Add a person when the list has fewer than N names and their group has fewer than 3 names on the list.
3. Stop at N. Do not add another name. Do not append anyone left off an earlier week. There is no carry-over list. People you do not pick keep their score, so they rise next week. Never carry more than N forward.

When a group has nobody eligible, say which group. When the cap of 3 per group stops the list short of N, say that. When fewer than N people are eligible, return everyone eligible and say the list is short.

## Opener

For each picked person, draft one or two sentences they could say later on that person's `channel`. Use a trigger when there is one. If the only reason is time since the last touch, say that plainly. Do not invent meetings, mutuals, or news. A thin note stays thin. Leave every opener unsent.

## Output

```
## Circle rotation

3 of 5 is a good week.

1. Name (circle, channel)
   Score: base, days, cadence, boost or none
   Reason: why this person, including every trigger
   Opener: the unsent draft

Not on the list: counts only, for family-inner, archived, snoozed, and skip list.
Not scored: unknown circle values, if any.
```

When N is not 5, keep the line "3 of 5 is a good week." and add "This week the list is N."

## Hard rules

- Do not message, call, schedule, or post.
- Do not update `last_touched`. A real conversation goes through `touch-note`.
- Do not invent people, dates, promises, or trigger notes.
- Snooze and archive are respected. A person left off because of the cap is not snoozed and not archived.
