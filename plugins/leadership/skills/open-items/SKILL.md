---
name: open-items
description: >-
  Use to track commitments in both directions: coaching work-ons, partner
  items, project next steps, and promises the manager made. Add, update or
  close, and list what is open. Surfaces items. Does not chase people.
metadata:
  bstack-config: "sources: log.open-items tasks.commitments | settings: workspace.timezone?"
---
# Open items

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

A source kind is one key in `sources`, even when the name contains a dot. `log.open-items` is the write binding. `tasks.commitments` is a list of read bindings. Until SOURCES.md is in the repo, the leadership alias rows are in this plugin's README.

The commitment log for a manager. Any commitment counts: coaching work-ons, partner or stakeholder items, project next steps, and things the manager promised. The skill records and lists. The human follows up.

Log shape and operations: [log.md](references/log.md). Method notes: [method.md](../../references/method.md).

## Operations

- **Add.** The manager states the commitment. Write it only to the file named by the `log.open-items` binding. Include person, direction (`they-owe`, `manager-owes`, or `shared`), kind, due date if any, and source.
- **Update or close.** Change the log entry the manager names. On close, record whether it was acted on when they say so: `yes`, `no`, or leave `unknown`. Do not infer acted-on from silence.
- **List open.** Default is everything still open. Filters: by person, overdue (due date before today), due soon (due within 7 days, or the window the caller names). Use `workspace.timezone` for "today" when that setting is set.

## Read sources

Read each binding in `tasks.commitments` when listing or when the manager asks what is new. Show candidates that are not in the log yet as "seen, not logged". Add a candidate only after the manager confirms. A mention in a transcript is not automatically a commitment.

One-on-ones are worth recording as transcripts both people can read. Point a commitments binding at that shared place. This skill does not create the transcript, does not send it, and does not file it for them.

## Steps

1. Load the log from the `log.open-items` binding. Create an empty log file on first add if that file path does not exist yet.
2. Run the requested operation. For a list, merge in confirmed context from `tasks.commitments` and mark unconfirmed rows as seen, not logged.
3. Write the log back only when an add, update, or close changed it.
4. Return the rows that matter. Stay quiet when a list filter matches nothing: "No open items."

## Hard rules

- Do not message anyone to chase an item. Do not post, schedule, or assign work in an external tool.
- Write only through the `log.open-items` binding. Leave `tasks.commitments` unchanged.
- Do not invent commitments, due dates, or "acted on".
- `one-on-one-prep` calls this skill. Give it open rows for the person and the latest coaching item with its acted-on value.
