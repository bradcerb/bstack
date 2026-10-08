---
name: daily-plan
description: >-
  Use to plan one day: process inbox slices to empty with clear dispositions,
  pick three most important tasks tied to this week's priorities, shape the day
  at 70 percent with a deep-work block, hand agent-runnable items to the gated
  queue, and park next actions at shutdown. Draft only.
---
# Daily plan

Turn today's inputs into a short, doable day. Process what came in, choose what matters most, shape the time, hand off what an agent can run, and close the day with next actions parked. One short screen.

Portable across agents. Which tools supply the inbox, priorities, and calendar live in the adapter, routine, or prompt that calls this skill, not in this recipe.

## Config check

Do this before any other step. Read the user-owned `workspace.json` in the active workspace. This skill requires `inbox_source`, `priorities_source`, and `calendar_source`.

If `workspace.json` is missing, or any required field is missing or still a placeholder, pause. A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. Ask only for those missing fields. Write the answers into `workspace.json`. Then continue with the rest of this skill. Do not run a full onboarding interview.

## Principle

Do the most important thing first, one thing at a time. The week sets the priorities; the day executes a slice of them. Keep everything captured in one trusted list so nothing has to live in your head or sit in an inbox as a reminder.

## Inputs

- Inbox slices or pasted items (email, messages, notes, captured ideas)
- This week's ranked priorities (from weekly-plan or an equivalent list)
- Today's calendar (meetings, fixed commitments, open blocks)
- Optional: run cap for inbox items this pass (default: process to empty)

If priorities are missing, ask once or use the top of the open list and say so. Do not invent a week.

## Rules

- Draft only. Do not send replies, post, accept invites, spend, or change live boards unless asked.
- Prefer outcomes over activities. Write each task as the result it produces.
- Plan the day at 70 percent of open time or less. Leave white space to think and absorb surprises.
- Avoid the trap of small stuff: big work first, small clears fit in between.
- Never use em-dashes.

## Steps

1. **Process inbox** - Go top to bottom, one item at a time, and finish each before the next. Never put an item back in the inbox. Ask: what is this, and what is the next action? Then choose one disposition:
   - **Delete** - no action, no future value
   - **File** - reference to keep (put dates on the calendar)
   - **Do** - two minutes or less; mark it as a quick clear for the batch in step 3
   - **Delegate** - someone or something else should do it; goes to step 4
   - **Defer** - longer than two minutes; capture to the trusted list (today, this week, or later)
   Stop at the run cap if set and note how many remain.
2. **Pick today's three** - Read this week's priorities first. Choose about three most important tasks for today in light of the calendar, each tied to a weekly priority or a hard deadline. Rank them. Most important goes first.
3. **Shape the day** - Place the top task in a protected deep-work block (large, uninterrupted, away from meetings). Fit the other two around the calendar. Batch quick clears and small replies into one or two short slots. Leave slack. List anything that will not fit as deferred, not as a silent overflow.
4. **Hand off** - Items an agent can run go to the gated-work queue with the handoff checklist: desired result, guidelines, resources, accountability, consequences. Outbound messages, commitments, spend, and anything risky stay as drafts for a human gate.
5. **Shutdown** - At end of day, mark what finished, capture loose ends to the trusted list, and park one concrete next action for each unfinished task so tomorrow starts without re-sorting. Note what rolls forward.

## Output shape

```
## Daily plan - [Date]

### Today's three (ranked)
1. Outcome - weekly priority it serves - block
2. ...
3. ...

### Day shape
- Deep work: [time] - task 1
- Quick clears batch: [time]
- Slack: [time or percent]

### Inbox processed
- N deleted / filed / done / delegated / deferred; N remaining

### Handed off (gated-work queue) / Drafts awaiting a go
- Item - result wanted - check

### Shutdown: parked next actions
- Task - next action
```

## Anti-jobs

- Not weekly planning: do not re-rank the week or redesign priorities here.
- Not executing the work itself: plan and hand off; gated-work runs the queue.
- Not sending replies: draft them and stop.
- Do not fill the day to the brim or keep items in the inbox as reminders.

## Completion

One short screen: three ranked outcomes tied to the week, a day shape with a deep-work block and slack, inbox processed to empty or to the cap, handoffs listed, and next actions parked. Draft only.
