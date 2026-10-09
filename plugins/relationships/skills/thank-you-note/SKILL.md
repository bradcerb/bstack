---
name: thank-you-note
description: >-
  Use when drafting a short thank-you after help, a meeting, hospitality, or an
  intro. Forces one specific memory plus one concrete offer or next step. Draft
  only until the author says to send.
metadata:
  bstack-config: "sources: voice.style-guide?"
---
# Thank-you note

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`voice.style-guide` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. When it is skipped, match a style guide the author supplies in the conversation, otherwise write plain and warm.

Draft a short thank-you that names what happened and moves the relationship one step.

## Rules

- Specific > effusive. One sincere line about impact beats a paragraph of flattery.
- Include **one specific memory** (what they did, said, or shared).
- Include **one concrete offer or next step** (intro, resource, time, follow-up). If none fits honestly, say so and stop at thanks — do not invent an ask.
- Draft only. Do not send.
- If `voice.style-guide` is bound and that file is there, match it. If the entry was skipped or the file is missing, match a style guide supplied in the conversation, otherwise write plain and warm. Do not stop to ask for a guide.
- Never invent mutuals, meetings, or promises the author did not make.

## Inputs

- Who to thank, and channel (email, text, LinkedIn, handwritten)
- What they did or the shared moment
- Optional: what the author can offer next, or a natural next step
- Optional: tone constraints (short text vs fuller email)

## Steps

1. Confirm who, what they did, channel, and any real next step or offer.
2. Draft 3–6 sentences (or fewer for text): open with the specific memory → impact → one offer/next step → clean close.
3. Name the channel. Leave unsent until the author says go.

## Completion

Paste-ready thank-you + channel. No send.
