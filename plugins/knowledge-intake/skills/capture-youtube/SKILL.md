---
name: capture-youtube
description: >-
  Use when transcribing a video, processing a video URL, monitoring a channel
  feed, or preparing a transcript as raw Markdown with a kb.raw-index row.
  Transcription is local. Captions are not the source of truth.
metadata:
  bstack-config: "sources: kb.raw-index state.knowledge-intake? feeds.youtube? transcripts.media? | settings: knowledge.raw_dir knowledge.loop_state knowledge.youtube_channels? knowledge.guardrails"
  bstack-needs: "shell? files? web?"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Capture YouTube

## Runtime path

Before the config check, select the runtime path defined under Knowledge runtime bindings in SOURCES.md. Apply that contract and this skill's config check. Skip local settings, bootstrap, downloads, and scripts in runtime mode.

Accept an explicit video URL and resolve its stable video id from the provider. For monitoring, read `feeds.youtube` under the state and lease rules. An absent channel binding means no monitored channels. Without durable state, process only explicit submissions. Initialize monitored channels without backfill, then process pending and unseen videos oldest-first within caps and routing policy.

Use `transcripts.media` for audio-derived transcription with source provenance and duration. A caller-supplied complete audio-derived transcript is valid when its origin is stated. Platform captions, a summary, or unknown transcript provenance do not satisfy this path. If audio transcription is unavailable, defer and keep the video pending. Enforce the remaining minute budget before transcription. Do not install tools or claim local transcription occurred.

Save the existing YouTube frontmatter plus the full transcript `body` through `kb.raw-index`. Preserve available timestamps and speaker labels. Checkpoint only confirmed saves. Return counts and receipt ids, or prepared records for paste. Do not run the file workflow below in runtime mode.

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`knowledge.youtube_channels` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or a missing file means there is no channel list. A submitted video URL still runs. Do not ask for the setting.

## File workflow prerequisites

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
