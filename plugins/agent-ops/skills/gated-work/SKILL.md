---
name: gated-work
description: >-
  Use when processing a work queue (tickets, issues, tasks, PRs) through
  intake → classify → human gate → execute → verify → close. Portable agent
  ops loop; draft and stop before irreversible actions.
---
# Gated work

Run a work item (or a small batch from a named source) through a safe agent loop: intake → classify → prepare → human gate when needed → execute → verify → close with evidence. Quiet when the queue is empty.

Portable across Grok Bot, Claude, and similar agents. Source adapters (which board, repo, or inbox) live in the seat or prompt that calls this skill, not in this recipe.

## Principle

Draft and verify before irreversible action. Human gate on send, spend, merge, publish, delete, and relationship-affecting outreach. Prefer the smallest reversible step.

## Inputs

- Named source or pasted items (issue/PR/task list, board slice, inbox slice)
- Scope cap (how many items this run)
- What "done" and "verified" mean for this lane (test, screenshot, status check, paste-ready draft)
- Standing human gates for this environment (defaults below if unset)

## Default human gates (stop and ask)

Stop with a draft + clear ask before:

- Sending or posting any external message
- Spending money or changing billing
- Merging, force-pushing, or deleting protected data
- Relationship-affecting outreach or commitments
- Anything irreversible you cannot undo in one step

Reversible local drafts, reads, and classification do not need a gate.

## Classify each item

- **Do now**  -  reversible, in scope, clear definition of done
- **Draft for gate**  -  needs human go before execute
- **Skip**  -  out of scope, blocked, duplicate, or empty

Never invent tickets or invent completion.

## Steps

1. **Intake**  -  Pull or accept the named source. List items plainly. If empty, stop quiet.
2. **Classify**  -  Tag each item Do now / Draft for gate / Skip. Cap the batch to the scope given.
3. **Prepare**  -  For each kept item: state outcome, plan, risks, and what evidence will prove done.
4. **Gate**  -  For Draft-for-gate items (and any default gate above): show the draft or plan and wait for explicit go. Do not execute past the gate on implied consent.
5. **Execute**  -  Only after go (or when classified Do now and no default gate applies). Stay inside the approved plan.
6. **Verify**  -  Check the real surface (status, test, screenshot, link, diff). Fail closed: if unverified, say so and do not claim done.
7. **Close**  -  Report item → action → evidence → remaining open. Queue follow-ups; do not send them unless asked.

## Anti-jobs

- Do not own the standing board (that is the PM/tool seat).
- Do not coach people or run leadership conversations.
- Do not expand scope mid-run without asking.
- Do not stay noisy when there is nothing to process.

## Delivery

Lead with what needs a human decision (if any), then what ran and how it was verified. One short closeout per batch. Silent when intake is empty.
