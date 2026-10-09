---
name: capture-youtube
description: >-
  Use when transcribing a video, processing a video URL, monitoring a channel
  feed, or preparing a transcript as raw Markdown with a kb.raw-index row.
  Transcription is local. Captions are not the source of truth.
metadata:
  bstack-config: "sources: kb.raw-index | settings: knowledge.raw_dir knowledge.loop_state knowledge.youtube_channels? knowledge.guardrails"
---
# Capture YouTube

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`knowledge.youtube_channels` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or a missing file means there is no channel list. A submitted video URL still runs. Do not ask for the setting.

## Prerequisites

Write raw Markdown under `knowledge.raw_dir` and one index row in `kb.raw-index`. Cursors live in `knowledge.loop_state`. Do not create a database.

Skip platform captions as the source of truth. Transcribe locally. If the downloader, ffmpeg, or the local engine is missing, ask before bootstrapping. The model and tools directory are `knowledge.transcription.whisper_cpp_model` and `knowledge.transcription.tools_dir`.

## Submitted link

1. Resolve metadata with the downloader.
2. Download temporary best-audio.
3. Convert to 16 kHz mono WAV with local ffmpeg.
4. Transcribe with the local engine.
5. Write one immutable Markdown file under `knowledge.raw_dir`.
6. Delete temporary audio after a non-empty raw transcript exists.

Run the capture script with `--config`. A flag overrides one run.

## Channel review

For each active channel in `knowledge.youtube_channels`: on first initialization record current video ids as seen and process none. Later runs process unseen videos oldest-first. Advance the cursor in `knowledge.loop_state` only after the raw write and the `kb.raw-index` upsert both succeed. Honor `knowledge.guardrails` for how many items this run may take.

## Raw write and index

Frontmatter: `source_type: youtube`, `platform: youtube`, `external_id` (video id), `title`, `channel`, `published_at`, `captured_at`, `duration_minutes`, `source_url`, `transcript_source`, `visibility: private`, `status: raw`, `raw_path`.

Upsert a `kb.raw-index` row pointing at the blob. Do not paste a full transcript into the index when it is large.

## Result

Return counts and exact filenames and index row refs. Do not invoke wiki-ingest. Return control to the orchestrator.
