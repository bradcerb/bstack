# Local podcast transcription

This workflow keeps podcast transcription on a local engine.

## Current runner

Use `scripts/transcribe_episode.py` for one episode at a time. It:

- downloads the episode enclosure to a temporary directory;
- converts the audio with ffmpeg;
- transcribes with a local engine;
- writes one immutable Markdown file under `knowledge.raw_dir`;
- reports missing dependencies without marking the episode handled.

Pass `--config`. The model path is `knowledge.transcription.whisper_cpp_model`. Tools live under `knowledge.transcription.tools_dir`.

Check readiness:

```bash
python3 skills/capture-podcasts/scripts/transcribe_episode.py \
  --config workspace.json \
  --check-dependencies
```

## Workspace-local install

The tools directory from config holds:

- `bin/ffmpeg` (or the platform equivalent)
- `bin/whisper-cli` (or the platform equivalent)
- the model file named by `knowledge.transcription.whisper_cpp_model`

The runner discovers these paths from the workspace root. No shell path setup is required.

Check or prepare the workspace:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --check
```

After the caller agrees:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --yes
```

The local engine runs on CPU by default because that is the portable option. Enable machine-specific acceleration only after a successful local smoke test.

## Supported engines

Preferred: the local `whisper-cli` binary and the model file from `knowledge.transcription.whisper_cpp_model`.

Fallback: the local Python whisper CLI. `--model` overrides the Python model name for one run. This path is still local.

## Required tools

- ffmpeg
- either `whisper-cli` with the configured model file, or the Python whisper CLI

No remote transcription key is required for the local engines.
