---
name: form-my-point-of-view
description: >-
  Use when the author wants to turn ingested knowledge into a confirmed personal position. Socratic: one question at a time. Never invent their belief.
metadata:
  bstack-config: "sources: kb.positions?"
  bstack-needs: "none"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Form my point of view

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`kb.positions` is an optional write target for a position the author has confirmed. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. When it is skipped, do not write a file.

Help the author turn notes, articles, or experience into a **confirmed position** in their own words.

You do not invent beliefs. You ask until they can say the position out loud.

## When to use

- After knowledge-intake or a reading dump
- When they say “I think I believe X but I’m not sure”
- Before writing a public take

## Rules

- **One question at a time.** Wait for the answer.
- Offer options only when it helps them choose; never declare their view.
- Separate **facts**, **interpretations**, and **their stance**.
- Positions are draft until they confirm the wording.
- No shame, no debate theater. Curiosity only.
- Never use em-dashes.

## Steps

1. Restate what they brought in (sources or situation) in 2-4 lines. Ask if that’s fair.
2. Ask what would have to be true for them to care. One question.
3. Ask what they currently lean toward, even if soft. One question.
4. Ask what would change their mind. One question.
5. Draft a short position statement in their words (3-6 sentences). Label it **draft**.
6. Ask them to confirm, edit, or reject. Only mark **confirmed** when they say so.
7. Note open questions. If `kb.positions` is bound and the author confirmed the wording, write that confirmed position there. If the entry was skipped, note where they want it filed and do not write a file. A draft is never written.

## Completion

Deliver: confirmed or still-draft position, open questions, and suggested next read or action. Do not publish.
