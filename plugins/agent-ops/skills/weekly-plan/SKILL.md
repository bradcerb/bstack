---
name: weekly-plan
description: >-
  Use to turn a weekly review or week snapshot (done / in flight / coming up /
  stuck) into next week's plan: roles check, need-and-want priorities, prune to
  a doable set, schedule big rocks with slack, triage the rest. Accepts pasted
  output from an upstream weekly review command.
metadata:
  bstack-config: "sources: tasks.week-snapshot"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Weekly plan

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

Turn a weekly review or factual week snapshot into next week's plan. The snapshot is `tasks.week-snapshot`. A `paste` binding means the caller supplies the week in the conversation, including output from an upstream weekly review command. This skill adds priority definition, pruning, and triage. It does not replace an upstream pull of tasks or calendar.

## Principle

Know what is most important and put it first. Plan the week before reacting to whatever is loudest. Put the big rocks in first; leave slack so smaller work and unplanned opportunities can fit. Prefer a flexible structure over an overloaded list.

## Inputs

- `tasks.week-snapshot`: done, in flight, coming up, and stuck. When the binding is `paste`, accept an upstream review with sections What got done, In flight, Coming up, Stuck or at risk, or a comparable list.
- Optional: standing roles or aims to scan (keep short; do not invent a full life plan here)
- Optional: known protected windows and a standing week template (time zones for deep work, meetings, rest, family)

If intake is empty after config is filled, ask once for the snapshot. Do not invent a week.

## Rules

- Draft only. Do not send, post, merge, spend, or change live boards unless asked.
- Prefer outcomes over activities. A fuzzy aim (for example, more time with family) may stay on the list as a reminder, and can be turned into a concrete slot when possible.
- Cap large priorities for the week at about three to five after pruning (brainstorm may start at four to seven).
- Schedule the day and week at roughly 70 percent capacity or less. Concurrent large initiatives should stay few so they do not collide.
- Separate large items from small ones. Knock out or clear tiny actions when possible so the weekly list stays mostly big rocks.
- Do not plan in high detail; leave room to seize better unplanned opportunities.
- Never use em-dashes.

## Steps

1. **Intake** - Accept `tasks.week-snapshot`. Keep the factual tone. Optionally glance at last week's calendar for missed follow-ups and this week's calendar for prep that is still needed.
2. **Roles scan (light)** - If roles or aims were provided, ask for each only what is needed or wanted this week, and whether any critical role is being neglected. Do not invent an item for every role.
3. **Brainstorm priorities** - Ask two questions against the snapshot and roles: What do I need to do this week? What do I want to do this week? Pull candidates from Coming up, In flight, Stuck, and any longer initiatives that need a slice this week.
4. **Separate large from small** - Large items are multi-day or high-concentration work. Small items are quick clears. List them apart so the load is realistic.
5. **Prune** - Cut to a doable set of about three to five large priorities, ranked. For what will not fit, choose one: **Eliminate**, **Defer** (with a date or trigger), **Delegate** (desired result, guidelines, resources, how you will check, stakes), or **Automate** (only if recurring and worth the setup). That is the reduce step for overload. List notable deprioritized work as the week's not-doing record.
6. **Organize** - Place big rocks into the week first (calendar or named blocks). Use standing time zones if a week template exists (deep work, meetings, admin, rest). Protect large uninterrupted chunks for high-concentration work; keep meeting-heavy work out of those blocks when possible. Leave slack. Park a concrete next action for each kept large item and for unfinished loops that should not need attention during protected windows.
7. **Stop** - Deliver the one-screen plan. Do not create tickets or send messages unless asked.

## Output shape

```
## Weekly plan - [Week of ...]

### Next week (large priorities, ranked)
1. ...
2. ...
(about 3 to 5)

### Not doing / reduced this week
- Item - Eliminate | Defer (when) | Delegate (to / result) | Automate - why

### Parked next actions
- Item - next action

### Small clears (optional)
- ...

### Done / In flight / Coming up
(brief; keep or compress the upstream sections)

### Structure notes
- Protected windows / slack / deep-work blocks to keep
```

## Anti-jobs

- Do not fork or replace an upstream review command that already pulls tasks and calendar.
- Do not invent shipped work or invent stuck items.
- Do not run a full mission redesign or daily inbox processing here.
- Do not fill the week to the brim or schedule every small action into a rigid hour.

## Completion

One-screen plan with ranked large priorities on top, an explicit reduce/not-doing list, parked next actions, and slack noted. Draft only.
