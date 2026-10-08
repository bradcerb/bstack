---
name: open-items
description: >-
  Use to track commitments in both directions: coaching work-ons, partner
  items, project next steps, and promises the manager made. Add, update or
  close, and list what is open. Surfaces items. Does not chase people.
---
# Open items

## Config check

Do this before any other step. Read the user-owned `workspace.json` in the active workspace. This skill requires `leadership.open_items_log` and `leadership.open_items_read_sources`.

If `workspace.json` is missing, or any required field is missing or still a placeholder, pause. A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. Ask only for those missing fields. Write the answers into `workspace.json`. Then continue with the rest of this skill. Do not run a full onboarding interview.

A dotted name is a path through the `leadership` object. These two fields are the whole config for this skill. `leadership.open_items_log` is the write location. `leadership.open_items_read_sources` is where to read (one or more of a local file, a database, a task tool, a shared drive).

The commitment log for a manager. Any commitment counts: coaching work-ons, partner or stakeholder items, project next steps, and things the manager promised. The skill records and lists. The human follows up.

Log shape and operations: [log.md](references/log.md). Method notes: [method.md](../../references/method.md).

## Operations

- **Add.** The manager states the commitment. Write it only to the log. Include person, direction (`they-owe`, `manager-owes`, or `shared`), kind, due date if any, and source.
- **Update or close.** Change the log entry the manager names. On close, record whether it was acted on when they say so: `yes`, `no`, or leave `unknown`. Do not infer acted-on from silence.
- **List open.** Default is everything still open. Filters: by person, overdue (due date before today), due soon (due within 7 days, or the window the caller names).

## Read sources

Read `leadership.open_items_read_sources` when listing or when the manager asks what is new. Show candidates that are not in the log yet as "seen, not logged". Add a candidate only after the manager confirms. A mention in a transcript is not automatically a commitment.

One-on-ones are worth recording as transcripts both people can read. Point a read source at that shared place. This skill does not create the transcript, does not send it, and does not file it for them.

## Steps

1. Load the log from `leadership.open_items_log`. Create an empty log file on first add if the path does not exist yet.
2. Run the requested operation. For a list, merge in confirmed context from the read sources and mark unconfirmed rows as seen, not logged.
3. Write the log back only when an add, update, or close changed it.
4. Return the rows that matter. Stay quiet when a list filter matches nothing: "No open items."

## Hard rules

- Do not message anyone to chase an item. Do not post, schedule, or assign work in an external tool.
- Write only to the log location. Leave read sources unchanged.
- Do not invent commitments, due dates, or "acted on".
- `one-on-one-prep` calls this skill. Give it open rows for the person and the latest coaching item with its acted-on value.
