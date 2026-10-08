---
name: coaching-angles
description: >-
  Use when a manager wants one coaching moment per person from team call
  transcripts in a date window, tied to that person's growth area, with
  delivery shaped by their DISC profile. On demand or scheduled. Draft only.
---
# Coaching angles

## Config check

Do this before any other step. Read the user-owned `workspace.json` in the active workspace. This skill requires `leadership.transcripts_source`, `leadership.skill_assessment_source`, `leadership.team_roster`, and `leadership.coaching_state`.

If `workspace.json` is missing, or any required field is missing or still a placeholder, pause. A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. Ask only for those missing fields. Write the answers into `workspace.json`. Then continue with the rest of this skill. Do not run a full onboarding interview.

A dotted name is a path: `leadership` is the object, then the key inside it. `leadership.coaching_briefs_dir` is optional and is not part of the required list. Empty means return the brief here and do not write a file.

One observed moment per person, tied to that person's growth area, with a delivery note shaped by their DISC profile. Private brief for the manager. The manager has the conversation.

Method notes: [method.md](../../references/method.md). Ranking, window, and schedule: [ranking.md](references/ranking.md), [routine.md](references/routine.md).

## Inputs

- Date window. Caller override wins: a phrase such as "last two weeks", or explicit start and end dates. With no override, use `last_run_at` in the coaching state file through now. With no `last_run_at`, use the last 7 days. Show the resolved start and end in the brief.
- Optional person filter. Limit the run to that person. If they are not on the roster, say so and stop. Do not invent a roster entry.
- Team roster, transcripts, and skill assessment, from the required fields. A value of `paste` means the caller supplies that data in the conversation.

## DISC

Call the `personality` skill for each person you will include. Use only what it returns. Do not open the DISC source, do not cache a profile, and do not guess a style from how someone talked. If `personality` reports the profile missing, write "Profile missing." on the delivery line.

## Steps

1. Resolve the window and the people in scope.
2. Read transcripts in that window and each person's growth area. Skip a person when the assessment names no growth area.
3. Keep at most one moment per person. The bar is in [ranking.md](references/ranking.md). Skip anyone who does not clear it. Do not include runner-up moments.
4. Call `personality` for each kept person.
5. Write the private brief: moment with source and timestamp, growth area, why it matters, delivery, one next step.
6. If `leadership.coaching_briefs_dir` is a non-empty path, write the same brief there as a private file. Do not share that file.
7. On a default run (no caller window), set `last_run_at` in the coaching state to the run time. A caller-supplied window does not move `last_run_at`.

## Output

```
## Coaching brief
Window: <start> through <end>
Private draft.

### <Name>
Moment: <quote or specific behavior> (<source>, <timestamp>)
Growth area: <from the assessment>
Why it matters: <impact on the work, one or two sentences>
Delivery: <personality read, or "Profile missing.">
Next step: <one concrete step for the person>
```

List skipped names only as "no moment in this window", with no critique attached. If everyone is skipped, return one line: "Nothing worth surfacing in this window."

## Hard rules

- Draft only. Do not message, post, schedule, or send the brief to anyone.
- One moment per person. Never a list of critiques.
- Skip a weak moment.
- Do not write a script of the talk. Prep the manager. The human has the conversation.
- Quiet when nothing qualifies.

## Schedule

A host routine can run this on a cadence. The caller passes a date window to override the default. See [routine.md](references/routine.md).
