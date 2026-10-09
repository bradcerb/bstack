#!/usr/bin/env python3
"""Capture new videos from configured YouTube channel RSS feeds."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

_PLUGIN_ROOT = Path(__file__).resolve().parents[3]
if str(_PLUGIN_ROOT) not in sys.path:
    sys.path.append(str(_PLUGIN_ROOT))

import workspace_config

USER_AGENT = "LocalKnowledgeIntake/1.0 (+private YouTube reader)"
DEFAULT_MAX_YOUTUBE_ITEMS = 2


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def child_text(node: ET.Element, names: set[str]) -> str:
    for child in node:
        if local_name(child.tag) in names and child.text:
            value = child.text.strip()
            if value:
                return value
    return ""


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json_write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def youtube_state(loop_state: dict) -> dict:
    state = loop_state.setdefault("state", {})
    cursors = state.setdefault("cursors", {})
    return cursors.setdefault("youtube", {})


def channel_feed_url(channel: dict) -> str:
    if channel.get("rss_url"):
        return channel["rss_url"]
    channel_id = channel["channel_id"]
    return f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"


def fetch_feed(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def parse_feed(payload: bytes) -> tuple[str, list[dict[str, str]]]:
    root = ET.fromstring(payload)
    channel_title = child_text(root, {"title"}) or "Unknown YouTube channel"
    videos: list[dict[str, str]] = []
    for entry in root:
        if local_name(entry.tag) != "entry":
            continue
        video_id = child_text(entry, {"videoid", "id"})
        link = ""
        for child in entry:
            if local_name(child.tag) == "link":
                link = child.attrib.get("href", "")
                break
        videos.append(
            {
                "id": video_id or link,
                "title": child_text(entry, {"title"}),
                "published": child_text(entry, {"published"}),
                "url": link,
            }
        )
    return channel_title, [video for video in videos if video["id"] and video["url"]]


def capture_video(config_path: Path, runner: Path, raw_dir: Path, video: dict[str, str], threads: int) -> dict:
    command = [
        sys.executable,
        str(runner),
        "--config",
        str(config_path),
        "--url",
        video["url"],
        "--raw-dir",
        str(raw_dir),
        "--threads",
        str(threads),
    ]
    completed = subprocess.run(command, text=True, capture_output=True)
    if completed.returncode != 0:
        return {
            "status": "failed",
            "title": video["title"],
            "url": video["url"],
            "error": completed.stderr[-4000:] or completed.stdout[-4000:],
        }
    payload = json.loads(completed.stdout)
    return {"status": "written", **payload}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", help="Path to workspace.json. Defaults to a walk upward from the working directory.")
    parser.add_argument("--workspace-root", help="Override the workspace root for this run.")
    parser.add_argument("--registry", type=Path, help="Override knowledge.youtube_channels for this run.")
    parser.add_argument("--state", type=Path, help="Override knowledge.loop_state for this run.")
    parser.add_argument("--raw-dir", type=Path, help="Override knowledge.raw_dir for this run.")
    parser.add_argument("--runner", type=Path, help="Override the video capturer for this run.")
    parser.add_argument("--max-items", type=int, help="Per-run item cap. Defaults to 2 when omitted.")
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--write-state", action="store_true")
    args = parser.parse_args()
    config_path, workspace_root, data = workspace_config.open_workspace(args.config, args.workspace_root)
    if args.registry is None:
        args.registry = workspace_config.under(
            workspace_root,
            workspace_config.knowledge_value(data, "youtube_channels", workspace_config.DEFAULT_YOUTUBE_CHANNELS),
        )
    else:
        args.registry = workspace_config.under(workspace_root, args.registry)
    if args.state is None:
        args.state = workspace_config.under(
            workspace_root,
            workspace_config.knowledge_value(data, "loop_state", workspace_config.DEFAULT_LOOP_STATE),
        )
    else:
        args.state = workspace_config.under(workspace_root, args.state)
    if args.raw_dir is None:
        args.raw_dir = workspace_config.under(
            workspace_root,
            workspace_config.knowledge_value(data, "raw_dir", workspace_config.DEFAULT_RAW_DIR),
        )
    else:
        args.raw_dir = workspace_config.under(workspace_root, args.raw_dir)
    if args.runner is None:
        args.runner = Path(__file__).resolve().with_name("capture_youtube.py")
    else:
        args.runner = workspace_config.under(workspace_root, args.runner)
    if args.max_items is None:
        args.max_items = DEFAULT_MAX_YOUTUBE_ITEMS

    registry = load_json(args.registry)
    loop_state = load_json(args.state)
    cursors = youtube_state(loop_state)
    initialized: list[dict] = []
    written: list[dict] = []
    failed: list[dict] = []
    remaining = args.max_items

    for channel in registry.get("channels", []):
        if not channel.get("active", True):
            continue
        url = channel_feed_url(channel)
        previous = cursors.get(url, {})
        try:
            title, videos = parse_feed(fetch_feed(url))
            latest_id = videos[0]["id"] if videos else None
            now = datetime.now(timezone.utc).isoformat()
            if channel.get("initialize_without_backfill", True) and not previous.get("latest_id"):
                cursors[url] = {
                    "name": channel.get("name") or title,
                    "initialized_at": now,
                    "latest_id": latest_id,
                }
                initialized.append({"feed": url, "channel": title, "latest_id": latest_id})
                continue

            new_videos: list[dict[str, str]] = []
            for video in videos:
                if video["id"] == previous.get("latest_id"):
                    break
                new_videos.append(video)
            selected = list(reversed(new_videos))[:remaining]
            successes: list[dict[str, str]] = []
            for video in selected:
                result = capture_video(config_path, args.runner, args.raw_dir, video, args.threads)
                if result["status"] == "written":
                    written.append(result)
                    successes.append(video)
                    remaining -= 1
                else:
                    failed.append(result)
                    break
            previous.update({"name": channel.get("name") or title, "checked_at": now})
            if successes and len(successes) == len(selected):
                previous["latest_id"] = successes[-1]["id"]
            cursors[url] = previous
            if remaining <= 0:
                break
        except Exception as exc:
            failed.append({"feed": url, "status": "failed", "error": f"{type(exc).__name__}: {exc}"})

    if args.write_state:
        atomic_json_write(args.state, loop_state)

    print(json.dumps({"status": "complete" if not failed else "failed", "initialized": initialized, "written": written, "failed": failed}, indent=2, ensure_ascii=False))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
