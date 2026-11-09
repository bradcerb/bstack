---
name: daily-plan
description: >-
  Use to plan one day: empty the inbox one item at a time (delete, file, do it
  now if it takes two minutes or less, delegate, or defer), pick three tasks
  from weekly-plan's ranked list, put the top task in a deep-work block, send
  agent-ready work to the agent queue with a handoff, and leave the rest on
  the ranked list.
metadata:
  bstack-config: "sources: email.inbox tasks.priorities calendar.events tasks.agent-queue chat.messages?"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Daily plan

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`chat.messages` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` means skip chat. Do not ask for it.

Turn today's inputs into a short day. Empty what came in, take three tasks from this week's ranked list, protect the top one, hand an agent what it can run, and leave every other ranked priority where it is.

Portable across agents. The inbox, chat, ranked list, calendar, and agent queue are source kinds in `workspace.json`.

## Principle

The week already decided what matters. The day takes a slice of that list, one thing at a time, starting with the most important. Each incoming item is captured once, so the inbox ends empty and the ranked list stays the place unfinished priorities live.

## Inputs

- Email inbox `email.inbox`. A `paste` binding means use the items supplied in the conversation.
- Chat `chat.messages`, when that kind is bound to something other than `none`. Use the same dispositions as email. When the entry was skipped, skip chat.
- This week's ranked list `tasks.priorities`. Read the section weekly-plan writes, "Next week (large priorities, ranked)": about three to five items, already in rank order. When "Parked next actions" has a matching line (`Item - next action`), that next action is the concrete task. A `paste` binding means use the pasted weekly plan.
- Today's calendar `calendar.events`: meetings, fixed commitments, and open time. A `paste` binding means use the pasted day.

If the ranked list is still missing after config is filled, ask once for it before picking tasks.

## Rules

- One incoming item, one disposition, then the next item. Finish the item before opening another.
- Write each task as the result it produces.
- A two-minute item is done in the inbox pass. Longer work waits for a later step.
- Sending, spending, and new commitments stay with a person. They are not two-minute clears.
- Leave weekly-plan's ranking in the order it was written.
- Never use em-dashes.

## Steps

1. **Empty the inbox.** Take the email inbox one item at a time until nothing is left. When `chat.messages` is bound, take those items the same way until nothing is left. Give each item exactly one disposition:
   - **Delete.** No action and no future value.
   - **File.** Keep it where reference lives. When it names a date, put that date on the calendar.
   - **Do.** It takes two minutes or less. Do it now, in this pass.
   - **Delegate.** Someone else should do it. Name who, and the result you want. When that someone is an agent, step 4 writes the handoff.
   - **Defer.** It takes longer than two minutes, and a person still owns it. Capture it off the inbox.
2. **Pick three tasks.** Read "Next week (large priorities, ranked)" from top to bottom. Take the first three. For each, use the parked next action when weekly-plan wrote one, and the priority itself when it did not. Keep each task tied to the priority it came from. When the list has fewer than three, take every item and say the list is short. Today's three come only from that ranked list and its parked next actions.
3. **Place the top task.** Read today's calendar. Put task 1 in a deep-work block: one long stretch with no meeting inside it. When weekly-plan's "Structure notes" name a protected window and that window is still open today, use that window. Name the time range. Tasks 2 and 3 stay on today's plan. Leave the rest of the calendar as it stands.
4. **Hand off to the agent queue.** Send anything an agent can do to `tasks.agent-queue`. An agent can do it when the outcome is clear and the resources can be named. Send inbox items delegated to an agent, and any of today's three an agent can complete. The top task keeps its deep-work block either way: the block is the person's focus, or the window for the agent's handoff. Write each handoff the way gated-work reads it:
   - **Desired result.** The outcome, not just the task.
   - **Guidelines.** Constraints, standards, and what not to do.
   - **Resources.** Access, files, context, and people needed.
   - **Accountability.** How it will be checked and what proof counts as done.
   - **Consequences.** What happens if it fails or stalls (escalate to whom, revert how, stop when).
   In Guidelines, say that send, spend, merge, and new commitments wait for a person. Stop after the handoff is on the queue.
5. **Leave the rest on the ranked list.** Every ranked priority that is not one of today's three stays on "Next week (large priorities, ranked)", in the same order, with its parked next action. Deferred items that stayed with the person are listed in the daily plan, off that ranked list.

## Output shape

```
## Daily plan - [Date]

### Inbox
- Delete / File / Do / Delegate / Defer: counts
- Chat: the same counts, or skipped
- Delegated to a person: who, and the result
- Deferred with the person: the item

### Today's three (from the ranked list)
1. Task - priority it serves
2. ...
3. ...

### Deep work
- [time] - task 1

### Agent queue
- Item
  - Desired result
  - Guidelines
  - Resources
  - Accountability
  - Consequences

### Still on the ranked list
- Priority - parked next action
```

## Anti-jobs

- Weekly planning stays in weekly-plan. This skill takes the ranked list as given.
- Running the queue stays in gated-work. This skill writes the handoff and stops.
- The inbox ends empty. An inbox item is not a reminder.
- The calendar receives one deep-work block for the top task. The rest of the day stays as the calendar already has it.

## Completion

The inbox is empty. Three tasks come from this week's ranked list. The top task sits in a deep-work block. Work an agent can do is on the agent queue with the full handoff. Every other ranked priority is still on the list.
