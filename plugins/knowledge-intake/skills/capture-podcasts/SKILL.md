---
name: capture-podcasts
description: >-
  Use when monitoring a public podcast feed, initializing a podcast without
  backfill, transcribing new episodes, or resolving an episode link through its
  public feed into raw Markdown and a kb.raw-index row.
metadata:
  bstack-config: "sources: kb.raw-index state.knowledge-intake? feeds.podcasts? transcripts.media? | settings: knowledge.raw_dir knowledge.loop_state knowledge.podcast_feeds knowledge.guardrails"
  bstack-needs: "shell? files? web?"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Capture podcasts

## Runtime path

Before the config check, select the runtime path defined under Knowledge runtime bindings in SOURCES.md. Apply that contract and this skill's config check. Skip local settings, bootstrap, downloads, and scripts in runtime mode.

For monitoring, read `feeds.podcasts` and acquire or inherit the state lease. An absent feed binding means no monitored feeds; explicit episode submissions still run. Without durable state, process only explicit submissions. Resolve a submitted episode to a public feed and stable GUID; defer uncertain matches. Initialize monitored feeds without backfill, then process pending and unseen items under the shared state and cap rules. Apply feed exclusions and routing.

Prefer a complete publisher transcript attached to the feed item. Otherwise use `transcripts.media` for audio-derived transcription with provenance. A supplied complete authorized transcript is also valid. With no usable transcript or transcript tool, defer the episode without marking it handled. Never turn show notes or a summary into a transcript. Enforce the remaining audio-minute budget before transcription.

Include show notes before the transcript. Save the existing podcast frontmatter plus `body` through `kb.raw-index`. Keep timestamps and known speaker labels. Return counts and receipt ids, or prepared records for paste. Checkpoint only confirmed saves. Do not run the file workflow below in runtime mode.

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## File workflow prerequisites

Write raw Markdown under `knowledge.raw_dir` and one index row in `kb.raw-index`. The feed list is the file at `knowledge.podcast_feeds`. A missing file is an empty list. Cursors live in `knowledge.loop_state`. Caps live in `knowledge.guardrails`. Do not create a database.

If local transcription tools are missing when an episode needs them, ask before bootstrapping. Do not assume a machine-specific install path. Model and tools paths are `knowledge.transcription.whisper_cpp_model` and `knowledge.transcription.tools_dir`. See `references/local-transcription.md`.

## Feed review

1. Read `knowledge.podcast_feeds` and `knowledge.loop_state`.
2. Fetch each active public feed. Send conditional headers when an ETag or Last-Modified value exists.
3. Identify episodes by feed GUID. Fall back to the canonical episode URL.
4. On first initialization, record every current GUID as seen and process none.
5. Later runs queue only unseen episodes newer than the cursor. Apply exclusions and duration limits.
6. Honor `knowledge.guardrails.max_podcast_items_per_run` and `knowledge.guardrails.max_audio_minutes_per_run`.

Run the capture script with `--config`. Flags on that command override one run.

## Submitted links

Accept episode pages, feed item URLs, and direct audio URLs. Resolve them to a public feed and a GUID. Use an unauthenticated title lookup only for matching. Require a high-confidence match or defer.

## Transcript priority

1. Prefer a publisher transcript attached to the feed item when it is valid.
2. Otherwise download the enclosure temporarily and transcribe with the local engine.
3. Preserve timestamps and speaker labels when they are present. Never invent speakers.
4. Delete temporary audio only after a non-empty transcript is written.
5. If a dependency is missing, report it and leave the episode pending. Do not mark it handled.

## Raw write and index

Write one immutable Markdown file per episode under `knowledge.raw_dir` (slug plus a short hash). Frontmatter includes `source_type: podcast`, `external_id`, `title`, `show`, `published_at`, `captured_at`, `duration_minutes`, `rss_feed`, `source_url`, `audio_url`, `transcript_source`, `visibility: private`, `status: raw`, and `raw_path`.

Include show notes before the transcript body.

Upsert a `kb.raw-index` row pointing at the blob. Index metadata only when the transcript is large.

Advance the feed cursor only after the raw write and the index upsert both succeed.

## Result

Return counts and exact raw filenames and index row refs. Do not invoke the parent orchestrator or wiki-ingest. Historical backfill only when the caller requests it.
