---
name: examine-my-alignment
description: >-
  Use when checking recent choices against stated values or positions. Surface one hard tension. No shame theater.
metadata:
  bstack-config: "sources: kb.positions?"
---
# Examine my alignment

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`kb.positions` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or `"via": "none"` is skipped. Do not ask for it. When it is skipped, load stated values the way the steps already do.

Compare what the author says they value with what they recently chose. Surface **one** real tension. Help them decide what to do next.

## When to use

- Weekly or monthly review
- After a hard decision
- When they feel “off” but can’t name why

## Rules

- Use only values/positions they have stated or confirmed. Do not invent a values list.
- Prefer **one hard tension** over a laundry list.
- No shame theater. No moral scoreboard.
- Ask for recent choices if missing (calendar, sends, spends, commits).
- Draft only. They own the change.
- Never use em-dashes.

## Steps

1. If `kb.positions` is bound, read confirmed positions from it. If that entry was skipped, ask them to paste 3-5 stated values or positions. Do not invent a list either way.
2. Ask for recent choices in the relevant lane (work, money, health, relationships, faith).
3. Map fits and frictions. Pick the **single sharpest tension**.
4. Name it plainly: value X vs choice Y, with stakes in one sentence.
5. Ask one question: what would alignment look like this week?
6. Draft 1-3 concrete options (including “do nothing on purpose”). Stop.

## Completion

One tension, options, and a clear ask for their decision. No lecture.
