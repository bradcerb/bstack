---
name: weekend-with-kids
description: >-
  Use to plan a light weekend with kids: rest, one outing, hospitality at
  home, and one chore done together. Weather or season may be pasted in.
  Writes a calendar prompt or tasks. Does not send invitations or messages.
metadata:
  bstack-config: "sources: calendar.events? tasks.commitments?"
  bstack-sources: "calendar.events: read-write; tasks.commitments: write"
---

# Weekend with kids

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`calendar.events` and `tasks.commitments` are optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for either. The plan is still produced.

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

## Where it goes

Write one plan.

- When `calendar.events` is bound, append one draft event that covers the weekend and lists the beats in the notes. Do not invite anyone and do not send. If those days are taken, name the conflict and still return the plan as the event notes rather than stuffing beats into full days.
- When that kind was skipped and `tasks.commitments` is bound, append one task per beat you are keeping, to the first binding only. A JSON array gets those objects. A missing or empty file becomes a JSON array of them. Another shape: show the tasks and ask once.
- When both were skipped, return one paste-ready calendar prompt that lists the beats.

## Output

```
## Weekend with kids

Rest:
Outing:
Hospitality:
Chore together:
Keep even if the weekend shrinks:
Where it went: draft event, tasks, or paste-ready prompt
```

## Hard rules

- Do not message a guest, a child, or anyone else.
- Do not draft or send an invitation. Hospitality in this skill stays in the house.
- Do not look up weather on your own.
- Do not fill both days. Light means room left over.
