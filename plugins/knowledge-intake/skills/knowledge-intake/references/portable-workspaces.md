# Portable workspaces

Raw Markdown lives under `knowledge.raw_dir`. Curated pages live in `kb.wiki`. The index is `kb.raw-index`. The log is `kb.wiki-log`. A connector is one way to bind those kinds. The binding is in `workspace.json`, not in this plugin.

Use this reference when running the intake skills from a new machine or a workspace that is not already obvious from the conversation.

## Finding the workspace

Ask which workspace to use when the task does not name one. The workspace root is the folder that holds `workspace.json`.

Pass that file as `--config`. If the flag is omitted, scripts walk upward from the working directory until they find `workspace.json`.

```bash
python3 skills/capture-youtube/scripts/capture_youtube.py \
  --config workspace.json \
  --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

Relative paths in the command resolve from the workspace root. `--raw-dir` overrides `knowledge.raw_dir` for one run.

## Local tool bootstrap

Use `skills/knowledge-intake/scripts/prepare_local_transcription.py` when local audio or video capture needs a downloader, ffmpeg, or the local transcriber. Tools install under `knowledge.transcription.tools_dir`. The model path is `knowledge.transcription.whisper_cpp_model`.

Check the current machine:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --check
```

Install missing workspace-local tools after the caller agrees:

```bash
python3 skills/knowledge-intake/scripts/prepare_local_transcription.py \
  --config workspace.json \
  --yes
```

The bootstrap keeps artifacts under the tools directory from config. It does not use a global package manager for those tools. It may need network access, a Python virtual environment, git, and cmake to build the transcriber when a binary is not already present.
