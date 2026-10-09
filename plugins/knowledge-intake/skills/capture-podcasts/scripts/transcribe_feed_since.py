#!/usr/bin/env python3
"""Transcribe podcast RSS items published on or after a given date."""

from __future__ import annotations

import argparse
import concurrent.futures
import email.utils
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from pathlib import Path

_PLUGIN_ROOT = Path(__file__).resolve().parents[3]
if str(_PLUGIN_ROOT) not in sys.path:
    sys.path.append(str(_PLUGIN_ROOT))

import workspace_config


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def child_text(node: ET.Element, names: set[str]) -> str:
    for child in node:
        if local_name(child.tag) in names and child.text:
            value = child.text.strip()
            if value:
                return value
    return ""


def parsed_datetime(value: str) -> datetime | None:
    if not value:
        return None
    parsed = email.utils.parsedate_to_datetime(value)
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def parse_feed(path: Path, since: date, limit: int | None) -> list[dict[str, str]]:
    root = ET.parse(path).getroot()
    channel = root.find("channel")
    if channel is None:
        channel = next((node for node in root.iter() if local_name(node.tag) in {"channel", "feed"}), root)
    show = child_text(channel, {"title"}) or "Unknown podcast"
    episodes: list[dict[str, str]] = []
    for item in channel.findall("item"):
        published_at = child_text(item, {"pubdate", "published", "updated"})
        published = parsed_datetime(published_at)
        if published is None or published.date() < since:
            continue
        enclosure_url = ""
        for child in item:
            if local_name(child.tag) == "enclosure":
                enclosure_url = child.attrib.get("url", "")
                break
        if not enclosure_url:
            continue
        episodes.append(
            {
                "external_id": child_text(item, {"guid", "id"}) or enclosure_url,
                "title": child_text(item, {"title"}) or "Untitled episode",
                "show": show,
                "published_at": published_at,
                "published_sort": published.isoformat(),
                "duration": child_text(item, {"duration"}),
                "episode_url": child_text(item, {"link"}),
                "audio_url": enclosure_url,
                "description_html": child_text(item, {"description", "summary"}),
            }
        )
    episodes = sorted(episodes, key=lambda item: item["published_sort"])
    if limit is not None:
        episodes = episodes[:limit]
    return episodes


def run_episode(
    config_path: Path,
    workspace_root: Path,
    runner: Path,
    raw_dir: Path,
    rss_feed: str,
    episode: dict[str, str],
    threads: int,
) -> dict[str, object]:
    command = [
        sys.executable,
        str(runner),
        "--config",
        str(config_path),
        "--workspace-root",
        str(workspace_root),
        "--raw-dir",
        str(raw_dir),
        "--threads",
        str(threads),
        "--external-id",
        episode["external_id"],
        "--title",
        episode["title"],
        "--show",
        episode["show"],
        "--published-at",
        episode["published_at"],
        "--duration",
        episode["duration"],
        "--rss-feed",
        rss_feed,
        "--episode-url",
        episode["episode_url"],
        "--audio-url",
        episode["audio_url"],
        "--description-html",
        episode["description_html"],
    ]
    completed = subprocess.run(command, text=True, capture_output=True)
    if completed.returncode != 0:
        return {
            "title": episode["title"],
            "published_at": episode["published_at"],
            "status": "failed",
            "returncode": completed.returncode,
            "stderr_tail": completed.stderr[-4000:],
            "stdout_tail": completed.stdout[-4000:],
        }
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError:
        payload = {"raw_output": completed.stdout[-4000:]}
    return {"title": episode["title"], "published_at": episode["published_at"], "status": "written", **payload}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", help="Path to workspace.json. Defaults to a walk upward from the working directory.")
    parser.add_argument("--workspace-root", help="Override the workspace root for this run.")
    parser.add_argument("--feed-xml", required=True, type=Path)
    parser.add_argument("--rss-feed", required=True)
    parser.add_argument("--raw-dir", type=Path, help="Override knowledge.raw_dir for this run.")
    parser.add_argument("--runner", type=Path, help="Override the episode transcriber for this run.")
    parser.add_argument("--since", required=True)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    config_path, workspace_root, data = workspace_config.open_workspace(args.config, args.workspace_root)
    args.feed_xml = workspace_config.under(workspace_root, args.feed_xml)
    if args.raw_dir is None:
        args.raw_dir = workspace_config.under(
            workspace_root,
            workspace_config.knowledge_value(data, "raw_dir", workspace_config.DEFAULT_RAW_DIR),
        )
    else:
        args.raw_dir = workspace_config.under(workspace_root, args.raw_dir)
    if args.runner is None:
        args.runner = Path(__file__).resolve().with_name("transcribe_episode.py")
    else:
        args.runner = workspace_config.under(workspace_root, args.runner)

    since = date.fromisoformat(args.since)
    episodes = parse_feed(args.feed_xml, since, args.limit)
    print(
        json.dumps(
            {
                "status": "queued",
                "count": len(episodes),
                "first": episodes[0]["published_at"] if episodes else None,
                "latest": episodes[-1]["published_at"] if episodes else None,
            }
        ),
        flush=True,
    )
    results: list[dict[str, object]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [
            executor.submit(run_episode, config_path, workspace_root, args.runner, args.raw_dir, args.rss_feed, episode, args.threads)
            for episode in episodes
        ]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            print(json.dumps(result, ensure_ascii=False), flush=True)

    failed = [item for item in results if item.get("status") == "failed"]
    print(json.dumps({"status": "complete" if not failed else "failed", "written": len(results) - len(failed), "failed": len(failed)}, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
