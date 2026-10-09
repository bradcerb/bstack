---
name: knowledge-intake
description: >-
  Use when running a scheduled or on-demand knowledge-intake cycle: orchestrate
  capture skills into raw storage, write a kb.raw-index row per raw item, verify
  the writes, then invoke wiki-ingest for new raw only.
metadata:
  bstack-config: "sources: kb.raw-index kb.wiki kb.wiki-log | settings: knowledge.raw_dir knowledge.loop_state knowledge.routing_policy knowledge.wiki_ingest_skill"
---
# Knowledge intake

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Purpose

Run a conservative intake cycle for the active workspace. Delegate source acquisition to capture skills, write immutable raw Markdown under `knowledge.raw_dir`, write one `kb.raw-index` row per raw item, then invoke the skill named by `knowledge.wiki_ingest_skill` only for newly verified raw.

## Layout

- Raw blobs live at `knowledge.raw_dir`. `kb.raw-index` is the index and status, not the full body when the blob is large.
- `kb.wiki` holds curated pages. `kb.wiki-log` records ingest activity.
- Capture skills do not invent targets. They use the bindings this skill already checked.
- Loop memory lives at `knowledge.loop_state`. Routing lives at `knowledge.routing_policy`.

If `kb.raw-index` or `kb.wiki` is missing after the config check, stop. Do not create a database or a wiki for the caller.

## Delegation

Invoke only the skills needed:

1. `capture-newsletters` for approved newsletter mail or feeds (`email.newsletters`).
2. `capture-articles` for a submitted URL or the queue at `knowledge.monitored_pages`.
3. `capture-podcasts` for the feeds at `knowledge.podcast_feeds` and for a submitted episode link.
4. `capture-youtube` for a submitted video link and, when set, the channels at `knowledge.youtube_channels`.
5. `capture-meetings` for authorized calendar events and their transcripts.
6. `knowledge.wiki_ingest_skill` for verified new raw only.

Do not reproduce source-specific procedures here. Capture skills do not call this orchestrator.

Scheduled cycles call `capture-meetings` with no date range, person filter, or output mode. Those parameters are for an explicit caller request. Do not store them.

## Scheduled workflow

1. Read `knowledge.routing_policy`, `knowledge.loop_state`, and confirm `kb.raw-index` and `kb.wiki` are bound. If either source is missing, stop.
2. Refuse to start if `state.in_flight` is active and newer than six hours. Otherwise record the in-flight run id and start time.
3. Run the needed capture skills inside `knowledge.guardrails`.
4. Require each skill to return counts: discovered, written, deferred, skipped, failed, plus exact raw paths and index row ids when written.
5. Verify each reported raw blob exists and is non-empty. Verify each has a `kb.raw-index` row with `status: raw` (or the configured equivalent) pointing at the blob.
6. Invoke wiki-ingest only for those verified new raw items. Never edit raw blobs during ingest.
7. Update `knowledge.loop_state` (`last_run_at`, cursors, handled ids, failures) and clear `in_flight`.
8. Return one concise report. Surface failures and missing permissions. Do not guess, bypass access controls, or silently discard items.

## Safety

- Initialize monitored feeds at the cursor. Never historical backfill unless the caller asks.
- Podcasts: prefer publisher transcripts. YouTube: local transcription only. Captions are not the source of truth.
- Cap items and audio minutes from `knowledge.guardrails`.
- Treat delivery as captured, not consumed.
- Apply `knowledge.routing_policy`. Do not cross a boundary the policy rejects.
- Do not publish, email, reply, unsubscribe, or modify calendar events.
- Prefer deterministic fetch, parse, hash, and transcribe scripts. Use judgment for routing, ambiguity, and wiki synthesis.
- Leave recoverable failures pending for the next run.
- The host routine owns the clock. This skill reads `workspace.timezone` only when a capture skill asks for it.

## Completion

Complete only when state is saved, each raw blob and its `kb.raw-index` row are verified, the requested wiki-ingest is verified, and deferred or failed items are listed.
