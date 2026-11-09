---
name: gated-work
description: >-
  Use when processing a work queue (tickets, issues, tasks, PRs) in capped runs:
  intake, classify, hand off with a clear checklist, human gate, execute,
  verify, close with evidence. Draft and stop before irreversible actions.
metadata:
  bstack-config: "sources: tasks.work-queue"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Gated work

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

Run a small batch from `tasks.work-queue` through a safe agent loop: intake, classify, prepare a handoff, human gate when needed, execute, verify, close with evidence. Quiet when the queue is empty.

## Principle

Draft and verify before irreversible action. Human gate on send, spend, merge, publish, delete, and relationship-affecting outreach. Prefer the smallest reversible step. Run below full capacity so the queue keeps moving.

## Inputs

- `tasks.work-queue`: tickets, issues, tasks, or pull requests. A `paste` binding means the caller supplies the items.
- Run cap: max items this run (default 5; configurable)
- What "done" and "verified" mean for this lane (test, screenshot, status check, paste-ready draft)
- Standing human gates for this environment (defaults below if unset)

## Run size

- Take at most the run cap. Plan the run at about 70 percent of available time or budget, not 100, so one surprise does not jam the batch.
- Leftover items roll to the next run in their current order. Say how many remain.

## Default human gates (stop and ask)

Stop with a draft and a clear ask before:

- Sending or posting any external message
- Spending money or changing billing
- Merging, force-pushing, or deleting protected data
- Relationship-affecting outreach or commitments
- Anything irreversible you cannot undo in one step

Reversible local drafts, reads, and classification do not need a gate.

## Classify each item

- **Do now** - reversible, in scope, clear definition of done
- **Draft for gate** - needs a human go before execute
- **Defer** - worth doing, not this run; record a date or trigger for when it returns
- **Eliminate** - not worth doing (out of scope, duplicate, obsolete); close or recommend closing with a one-line reason
- **Skip** - not this run only (blocked, over the run cap, missing input); stays in the queue untouched

Never invent tickets or invent completion. Closing an item in a shared system counts as a change; gate it if the environment requires.

## Handoff checklist (prepare step)

For each Do now or Draft for gate item, write:

- **Desired result** - the outcome, not just the task
- **Guidelines** - constraints, standards, and what not to do
- **Resources** - access, files, context, and people needed
- **Accountability** - how it will be checked and what proof counts as done
- **Consequences** - what happens if it fails or stalls (escalate to whom, revert how, stop when)

## Steps

1. **Intake** - Pull or accept `tasks.work-queue`. List items plainly. If empty, stop quiet.
2. **Classify** - Tag each item Do now, Draft for gate, Defer, Eliminate, or Skip. Apply the run cap.
3. **Prepare** - Write the handoff checklist for each kept item.
4. **Gate** - For Draft for gate items (and any default gate above): show the draft or plan and wait for an explicit go. Do not execute past the gate on implied consent.
5. **Execute** - Only after go (or when Do now and no default gate applies). Stay inside the guidelines.
6. **Verify** - Check the real surface (status, test, screenshot, link, diff) against the accountability line. Fail closed: if unverified, say so and do not claim done.
7. **Close** - Report item, action, evidence, and what remains open. Record Defer triggers and Eliminate reasons. Note leftovers rolling to the next run. Queue follow-ups; do not send them unless asked.

## Anti-jobs

- Do not own the standing board (that belongs to whoever owns the tool or queue).
- Do not coach people or run leadership conversations.
- Do not expand scope or the run cap mid-run without asking.
- Do not stay noisy when there is nothing to process.

## Delivery

Lead with what needs a human decision (if any), then what ran and how it was verified, then deferred, eliminated, and leftover counts. One short closeout per batch. Silent when intake is empty.
