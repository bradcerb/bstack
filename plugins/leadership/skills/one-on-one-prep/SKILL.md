---
name: one-on-one-prep
description: >-
  Use before a one-on-one to prep the manager: recent history, open
  commitments both ways, last feedback and whether it was acted on, the
  person's growth area, and a few topics shaped by their DISC profile.
  Prep only. Does not send, schedule, or script the meeting.
metadata:
  bstack-config: "sources: transcripts.meetings transcripts.one-on-ones people.assessments"
---
# One-on-one prep

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

A source kind is one key in `sources`, even when the name contains a dot. Until SOURCES.md is in the repo, the leadership alias rows are in this plugin's README.

A private brief so the manager can walk into one conversation prepared. History, open commitments, last feedback, growth area, and a few topics. The meeting itself stays a live conversation.

Brief shape: [brief.md](references/brief.md). Method notes: [method.md](../../references/method.md).

## Inputs

- The person this one-on-one is with. Ask once if the caller did not name them.
- Optional window for history. Default: the last 30 days of `transcripts.one-on-ones`, plus `transcripts.meetings` in that same window for notable moments.
- `open-items` for commitments and the last coaching item.
- `personality` for the delivery note.

## Steps

1. Read recent one-on-ones from `transcripts.one-on-ones`. Note date, source, and one factual line each. Do not invent meetings.
2. Read team call transcripts from `transcripts.meetings` in the same window. Keep at most one notable moment that is quoted or timestamped. If none is specific, say none.
3. Call `open-items` to list open commitments for this person, both directions (they owe, the manager owes, shared).
4. From that same call, take the latest coaching commitment as the last feedback on the log, and report whether it was acted on. If the log has none, say so. Do not promote a vague transcript line into "feedback given" unless the history source records it as feedback the manager gave.
5. Read this person's growth area from `people.assessments`. If it is missing, say "Growth area missing." and continue.
6. Call `personality`. Shape the suggested topics with that read. If the profile is missing, say so and leave the topics unstyled. Do not guess a style.
7. Suggest two to four topics or questions. Each one points at the work, an open commitment, or the growth area.

## Output

Use the shape in [brief.md](references/brief.md). Label it a private draft.

## Hard rules

- Prep only. Do not send an agenda, message the person, post, or schedule the meeting.
- Do not write a verbatim script of what either person should say.
- Do not replace the conversation. The manager holds it.
- Gaps stay gaps: missing history, missing feedback, missing profile, missing growth area. Say which one is missing.
- Do not read `people.profiles` or `log.open-items` yourself. Call `personality` and `open-items`, and let those skills run their own config checks.
