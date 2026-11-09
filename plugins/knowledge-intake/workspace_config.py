"""Load a v2 workspace.json for knowledge-intake scripts.

The file is the one named by --config, or the first workspace.json found by
walking upward from the working directory. The workspace root is the folder
that holds that file, unless workspace.root says otherwise.
"""

from __future__ import annotations

import json
from pathlib import Path


DEFAULT_RAW_DIR = "learnings/raw"
DEFAULT_LOOP_STATE = ".agents/loops/knowledge-intake.json"
DEFAULT_PODCAST_FEEDS = "knowledge/podcast-feeds.json"
DEFAULT_YOUTUBE_CHANNELS = "knowledge/youtube-channels.json"
DEFAULT_TOOLS_DIR = "tools"
DEFAULT_WHISPER_MODEL = "tools/whisper.cpp/models/ggml-base.en.bin"
DEFAULT_MAX_PODCAST_ITEMS = 2
DEFAULT_MAX_AUDIO_MINUTES = 180


def find_config(explicit: str | None, cwd: Path | None = None) -> Path:
    base = (cwd or Path.cwd()).resolve()
    if explicit:
        path = Path(explicit).expanduser()
        if not path.is_absolute():
            path = base / path
        path = path.resolve()
        if not path.is_file():
            raise SystemExit(f"workspace.json not found: {path}")
        return path
    for candidate in [base, *base.parents]:
        found = candidate / "workspace.json"
        if found.is_file():
            return found
    raise SystemExit("workspace.json not found. Pass --config, or run from a folder that contains it.")


def load(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit(f"workspace.json must be an object: {path}")
    return data


def root_of(config_path: Path, data: dict) -> Path:
    folder = config_path.parent
    workspace = data.get("workspace")
    raw_root = workspace.get("root") if isinstance(workspace, dict) else None
    if raw_root in (None, ""):
        raw_root = data.get("workspace_root")
    if raw_root in (None, ""):
        return folder
    root = Path(str(raw_root)).expanduser()
    if not root.is_absolute():
        root = folder / root
    return root.resolve()


def open_workspace(
    config: str | None,
    root_override: str | None = None,
    cwd: Path | None = None,
) -> tuple[Path, Path, dict]:
    config_path = find_config(config, cwd)
    data = load(config_path)
    root = root_of(config_path, data)
    if root_override:
        override = Path(root_override).expanduser()
        if not override.is_absolute():
            override = (cwd or Path.cwd()) / override
        root = override.resolve()
    return config_path, root, data


def under(root: Path, value: str | Path) -> Path:
    path = Path(value).expanduser()
    if path.is_absolute():
        return path
    return (root / path).resolve()


def _block(data: dict, name: str) -> dict:
    knowledge = data.get("knowledge")
    if isinstance(knowledge, dict):
        block = knowledge.get(name)
        if isinstance(block, dict):
            return block
    legacy = data.get(name)
    if isinstance(legacy, dict):
        return legacy
    return {}


def knowledge_value(data: dict, key: str, default: str) -> str:
    knowledge = data.get("knowledge")
    if isinstance(knowledge, dict) and knowledge.get(key) not in (None, ""):
        return str(knowledge[key])
    if data.get(key) not in (None, ""):
        return str(data[key])
    return default


def guardrail_value(data: dict, key: str, default: int | float) -> int | float:
    value = _block(data, "guardrails").get(key, default)
    return default if value in (None, "") else value


def transcription_value(data: dict, key: str, default: str) -> str:
    value = _block(data, "transcription").get(key)
    if value in (None, ""):
        return default
    return str(value)
