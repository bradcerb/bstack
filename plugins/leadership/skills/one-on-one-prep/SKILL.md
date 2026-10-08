---
name: one-on-one-prep
description: >-
  Use before a one-on-one to prep the manager: recent history, open
  commitments both ways, last feedback and whether it was acted on, the
  person's growth area, and a few topics shaped by their DISC profile.
  Prep only. Does not send, schedule, or script the meeting.
---
# One-on-one prep

## Config check

Do this before any other step. Read the user-owned `workspace.json` in the active workspace. This skill requires `leadership.transcripts_source`, `leadership.one_on_one_history_source`, and `leadership.skill_assessment_source`.

If `workspace.json` is missing, or any required field is missing or still a placeholder, pause. A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. Ask only for those missing fields. Write the answers into `workspace.json`. Then continue with the rest of this skill. Do not run a full onboarding interview.

A dotted name is a path through the `leadership` object. `paste` means the caller supplies that source in the conversation.

A private brief so the manager can walk into one conversation prepared. History, open commitments, last feedback, growth area, and a few topics. The meeting itself stays a live conversation.

Brief shape: [brief.md](references/brief.md). Method notes: [method.md](../../references/method.md).

## Inputs

- The person this one-on-one is with. Ask once if the caller did not name them.
- Optional window for history. Default: the last 30 days of one-on-one history, plus team-call transcripts in that same window for notable moments.
- `open-items` for commitments and the last coaching item.
- `personality` for the delivery note.

## Steps

1. Read recent one-on-ones from `leadership.one_on_one_history_source`. Note date, source, and one factual line each. Do not invent meetings.
2. Read team call transcripts from `leadership.transcripts_source` in the same window. Keep at most one notable moment that is quoted or timestamped. If none is specific, say none.
3. Call `open-items` to list open commitments for this person, both directions (they owe, the manager owes, shared).
4. From that same call, take the latest coaching commitment as the last feedback on the log, and report whether it was acted on. If the log has none, say so. Do not promote a vague transcript line into "feedback given" unless the history source records it as feedback the manager gave.
5. Read this person's growth area from `leadership.skill_assessment_source`. If it is missing, say "Growth area missing." and continue.
6. Call `personality`. Shape the suggested topics with that read. If the profile is missing, say so and leave the topics unstyled. Do not guess a style.
7. Suggest two to four topics or questions. Each one points at the work, an open commitment, or the growth area.

## Output

Use the shape in [brief.md](references/brief.md). Label it a private draft.

## Hard rules

- Prep only. Do not send an agenda, message the person, post, or schedule the meeting.
- Do not write a verbatim script of what either person should say.
- Do not replace the conversation. The manager holds it.
- Gaps stay gaps: missing history, missing feedback, missing profile, missing growth area. Say which one is missing.
- Do not read the DISC source or the open-items log files yourself. Call `personality` and `open-items`, and let those skills run their own config checks.
