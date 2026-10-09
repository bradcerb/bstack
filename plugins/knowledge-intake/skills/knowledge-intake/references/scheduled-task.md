# Scheduled task

The host routine owns the clock. Do not store a cadence here. When the routine needs a zone, read `workspace.timezone`.

Caps are `knowledge.guardrails` (`max_podcast_items_per_run`, `max_meeting_artifacts_per_run`, `max_audio_minutes_per_run`). Paths are the settings in `workspace.json`. Pass `--config` so the scripts read them. A flag on the command overrides one run.

## Task prompt

Use `knowledge-intake` in the current workspace. Read `workspace.json` (copy `examples/workspace.json.example` once, then fill the entries this run needs). Review `email.newsletters`, the queue at `knowledge.monitored_pages`, the feeds at `knowledge.podcast_feeds`, and authorized completed meetings from `calendar.events`. Initialize new podcast feeds without historical backfill. Write only verified, immutable sources under `knowledge.raw_dir`, then invoke the skill named by `knowledge.wiki_ingest_skill` only for the raw files created in this run. Respect `knowledge.routing_policy`. Leave recoverable failures pending. Update `knowledge.loop_state` atomically. Report discovered, written, ingested, deferred, skipped, and failed counts with filenames.

## Dependency behavior

If a provider transcript is unavailable and the local transcriber or ffmpeg is not installed, ask before running:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --yes
```

If setup is not approved or fails, defer that item and report the missing dependency. Do not advance its handled cursor.

## Podcast capture command

```bash
python3 skills/capture-podcasts/scripts/run_podcast_capture.py \
  --config workspace.json \
  --write-state
```

New podcast and channel feeds initialize without historical backfill. A historical backfill is an explicit one-off run.

## Video capture commands

A submitted video uses local transcription. Captions are not the source of truth.

```bash
python3 skills/capture-youtube/scripts/capture_youtube.py \
  --config workspace.json \
  --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

Configured channels:

```bash
python3 skills/capture-youtube/scripts/run_youtube_capture.py \
  --config workspace.json \
  --write-state
```

Check local tools:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --check
```
