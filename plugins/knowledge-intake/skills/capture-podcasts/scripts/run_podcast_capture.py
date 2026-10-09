#!/usr/bin/env python3
"""Capture new configured podcast RSS items into the workspace raw folder."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

_PLUGIN_ROOT = Path(__file__).resolve().parents[3]
if str(_PLUGIN_ROOT) not in sys.path:
    sys.path.append(str(_PLUGIN_ROOT))

import review_feed
import workspace_config


def duration_minutes(value: str | None) -> float:
    if not value:
        return 0.0
    parts = str(value).split(":")
    try:
        numbers = [int(part) for part in parts]
    except ValueError:
        return 0.0
    if len(numbers) == 3:
        hours, minutes, seconds = numbers
    elif len(numbers) == 2:
        hours, minutes, seconds = 0, numbers[0], numbers[1]
    elif len(numbers) == 1:
        hours, minutes, seconds = 0, 0, numbers[0]
    else:
        return 0.0
    return hours * 60 + minutes + seconds / 60


def run_transcription(
    config_path: Path,
    runner: Path,
    raw_dir: Path,
    rss_feed: str,
    show: str,
    item: dict[str, object],
    threads: int,
) -> dict:
    command = [
        sys.executable,
        str(runner),
        "--config",
        str(config_path),
        "--raw-dir",
        str(raw_dir),
        "--threads",
        str(threads),
        "--external-id",
        str(item.get("id") or item.get("guid") or item.get("enclosure_url")),
        "--title",
        str(item.get("title") or "Untitled episode"),
        "--show",
        show,
        "--published-at",
        str(item.get("published") or ""),
        "--duration",
        str(item.get("duration") or ""),
        "--rss-feed",
        rss_feed,
        "--episode-url",
        str(item.get("link") or ""),
        "--audio-url",
        str(item.get("enclosure_url") or ""),
    ]
    completed = subprocess.run(command, text=True, capture_output=True)
    if completed.returncode != 0:
        return {
            "status": "failed",
            "title": item.get("title"),
            "error": completed.stderr[-4000:] or completed.stdout[-4000:],
        }
    payload = json.loads(completed.stdout)
    return {"status": "written", "title": item.get("title"), **payload}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", help="Path to workspace.json. Defaults to a walk upward from the working directory.")
    parser.add_argument("--workspace-root", help="Override the workspace root for this run.")
    parser.add_argument("--registry", type=Path, help="Override knowledge.podcast_feeds for this run.")
    parser.add_argument("--state", type=Path, help="Override knowledge.loop_state for this run.")
    parser.add_argument("--raw-dir", type=Path, help="Override knowledge.raw_dir for this run.")
    parser.add_argument("--runner", type=Path, help="Override the episode transcriber for this run.")
    parser.add_argument("--max-items", type=int, help="Override knowledge.guardrails.max_podcast_items_per_run for this run.")
    parser.add_argument("--max-audio-minutes", type=float, help="Override knowledge.guardrails.max_audio_minutes_per_run for this run.")
    parser.add_argument("--workers", type=int, default=1, help="Reserved for future use; daily capture is serial for cursor safety")
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--write-state", action="store_true")
    args = parser.parse_args()
    config_path, workspace_root, data = workspace_config.open_workspace(args.config, args.workspace_root)
    if args.registry is None:
        args.registry = workspace_config.under(
            workspace_root,
            workspace_config.knowledge_value(data, "podcast_feeds", workspace_config.DEFAULT_PODCAST_FEEDS),
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
        args.runner = Path(__file__).resolve().with_name("transcribe_episode.py")
    else:
        args.runner = workspace_config.under(workspace_root, args.runner)
    if args.max_items is None:
        args.max_items = int(workspace_config.guardrail_value(data, "max_podcast_items_per_run", workspace_config.DEFAULT_MAX_PODCAST_ITEMS))
    if args.max_audio_minutes is None:
        args.max_audio_minutes = float(
            workspace_config.guardrail_value(data, "max_audio_minutes_per_run", workspace_config.DEFAULT_MAX_AUDIO_MINUTES)
        )

    registry = review_feed.load_json(args.registry)
    loop_state = review_feed.load_json(args.state)
    feeds_state = review_feed.podcast_state(loop_state)
    written: list[dict] = []
    initialized: list[dict] = []
    failed: list[dict] = []
    queued_count = 0
    used_minutes = 0.0

    for feed in registry.get("feeds", []):
        if not feed.get("active", True):
            continue
        url = feed["rss_url"]
        previous = feeds_state.get(url, {})
        try:
            payload, headers = review_feed.fetch_feed(url, previous.get("etag"), previous.get("last_modified"))
            if payload is None:
                continue
            show, items = review_feed.parse_feed(payload)
            latest_id = items[0]["id"] if items else None
            now = datetime.now(timezone.utc).isoformat()
            if not previous.get("latest_id"):
                feeds_state[url] = {
                    "name": feed.get("name") or show,
                    "initialized_at": now,
                    "latest_id": latest_id,
                    "etag": headers.get("etag"),
                    "last_modified": headers.get("last_modified"),
                    "final_url": headers.get("final_url", url),
                }
                initialized.append({"feed": url, "show": show, "latest_id": latest_id})
                continue

            new_items: list[dict[str, object]] = []
            for item in items:
                if item["id"] == previous["latest_id"]:
                    break
                new_items.append(item)

            selected: list[dict[str, object]] = []
            for item in reversed(new_items):
                minutes = duration_minutes(str(item.get("duration") or ""))
                if queued_count >= args.max_items:
                    break
                if used_minutes + minutes > args.max_audio_minutes:
                    break
                if not item.get("enclosure_url"):
                    continue
                selected.append(item)
                queued_count += 1
                used_minutes += minutes

            feed_successes: list[dict[str, object]] = []
            for item in selected:
                result = run_transcription(config_path, args.runner, args.raw_dir, url, show, item, args.threads)
                if result["status"] == "written":
                    written.append(result)
                    feed_successes.append(item)
                else:
                    failed.append(result)
                    break

            previous.update(
                {
                    "name": feed.get("name") or show,
                    "checked_at": now,
                    "etag": headers.get("etag"),
                    "last_modified": headers.get("last_modified"),
                    "final_url": headers.get("final_url", url),
                }
            )
            if feed_successes and len(feed_successes) == len(selected):
                previous["latest_id"] = feed_successes[-1]["id"]
            feeds_state[url] = previous
        except Exception as exc:
            failed.append({"feed": url, "status": "failed", "error": f"{type(exc).__name__}: {exc}"})

    if args.write_state:
        review_feed.atomic_json_write(args.state, loop_state)

    print(
        json.dumps(
            {
                "status": "complete" if not failed else "failed",
                "initialized": initialized,
                "written": written,
                "failed": failed,
                "audio_minutes": round(used_minutes, 2),
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
