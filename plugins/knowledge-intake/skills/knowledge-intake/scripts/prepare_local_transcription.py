#!/usr/bin/env python3
"""Prepare local transcription tools for the selected workspace.

Installs workspace-local helpers under knowledge.transcription.tools_dir:
- yt-dlp in youtube/venv
- ffmpeg via imageio-ffmpeg in ffmpeg/venv
- whisper.cpp, plus the model at knowledge.transcription.whisper_cpp_model

This script is intentionally conservative: it reports what it will do, keeps
artifacts inside the selected workspace, and does not require global package
managers.
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import stat
import subprocess
import sys
import urllib.request
import venv
from pathlib import Path


_PLUGIN_ROOT = Path(__file__).resolve().parents[3]
if str(_PLUGIN_ROOT) not in sys.path:
    sys.path.append(str(_PLUGIN_ROOT))

import workspace_config

MODEL_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
WHISPER_CPP_REPO = "https://github.com/ggerganov/whisper.cpp.git"
TOOLS_ROOT = Path("tools")
MODEL_FILE = Path("tools") / "whisper.cpp" / "models" / "ggml-base.en.bin"


def bind_workspace(config: str | None, root_override: str | None) -> Path:
    global TOOLS_ROOT, MODEL_FILE
    _, root, data = workspace_config.open_workspace(config, root_override)
    tools_dir = workspace_config.transcription_value(data, "tools_dir", workspace_config.DEFAULT_TOOLS_DIR)
    model = workspace_config.transcription_value(data, "whisper_cpp_model", workspace_config.DEFAULT_WHISPER_MODEL)
    TOOLS_ROOT = workspace_config.under(root, tools_dir)
    MODEL_FILE = workspace_config.under(root, model)
    return root


def is_windows() -> bool:
    return platform.system().lower().startswith("win")


def executable_names(name: str) -> list[str]:
    if is_windows():
        if name.endswith((".exe", ".cmd", ".bat")):
            return [name]
        return [f"{name}.exe", f"{name}.cmd", f"{name}.bat", name]
    return [name]


def tool_paths(name: str) -> list[Path]:
    paths = []
    for candidate in executable_names(name):
        paths.append(TOOLS_ROOT / "bin" / candidate)
    return paths


def find_tool(name: str) -> str | None:
    for candidate in executable_names(name):
        found = shutil.which(candidate)
        if found:
            return found
    for candidate in tool_paths(name):
        if candidate.exists():
            return str(candidate)
    return None


def model_path() -> Path:
    return MODEL_FILE


def report(workspace_root: Path) -> dict[str, object]:
    return {
        "workspace_root": str(workspace_root),
        "tools_dir": str(TOOLS_ROOT),
        "platform": platform.platform(),
        "machine": platform.machine(),
        "python": sys.executable,
        "yt_dlp": find_tool("yt-dlp"),
        "ffmpeg": find_tool("ffmpeg"),
        "whisper_cli": find_tool("whisper-cli"),
        "whisper_model": str(model_path()) if model_path().exists() else None,
    }


def run(command: list[str], cwd: Path | None = None) -> None:
    subprocess.run(command, cwd=str(cwd) if cwd else None, check=True)


def ensure_venv(venv_dir: Path) -> Path:
    if not (venv_dir / ("Scripts" if is_windows() else "bin")).exists():
        venv.create(venv_dir, with_pip=True)
    return venv_dir


def venv_python(venv_dir: Path) -> Path:
    return venv_dir / ("Scripts" if is_windows() else "bin") / ("python.exe" if is_windows() else "python")


def bin_dir() -> Path:
    path = TOOLS_ROOT / "bin"
    path.mkdir(parents=True, exist_ok=True)
    return path


def make_wrapper(name: str, target: Path) -> Path:
    destination = bin_dir() / (f"{name}.cmd" if is_windows() else name)
    if is_windows():
        destination.write_text(f'@echo off\r\n"{target}" %*\r\n', encoding="utf-8")
    else:
        destination.write_text(f'#!/usr/bin/env sh\nexec "{target}" "$@"\n', encoding="utf-8")
        destination.chmod(destination.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    return destination


def install_yt_dlp() -> Path:
    venv_dir = ensure_venv(TOOLS_ROOT / "youtube" / "venv")
    py = venv_python(venv_dir)
    run([str(py), "-m", "pip", "install", "--upgrade", "pip", "yt-dlp"])
    target = venv_dir / ("Scripts" if is_windows() else "bin") / ("yt-dlp.exe" if is_windows() else "yt-dlp")
    return make_wrapper("yt-dlp", target)


def install_ffmpeg() -> Path:
    venv_dir = ensure_venv(TOOLS_ROOT / "ffmpeg" / "venv")
    py = venv_python(venv_dir)
    run([str(py), "-m", "pip", "install", "--upgrade", "pip", "imageio-ffmpeg"])
    completed = subprocess.run(
        [str(py), "-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
        text=True,
        capture_output=True,
        check=True,
    )
    return make_wrapper("ffmpeg", Path(completed.stdout.strip()))


def locate_whisper_binary() -> Path | None:
    root = TOOLS_ROOT / "whisper.cpp"
    names = executable_names("whisper-cli") + executable_names("main")
    for base in [
        root / "build" / "bin",
        root / "build" / "bin" / "Release",
        root / "build" / "Release",
        root,
    ]:
        for name in names:
            candidate = base / name
            if candidate.exists():
                return candidate
    return None


def install_whisper_cpp(jobs: int) -> Path:
    root = TOOLS_ROOT / "whisper.cpp"
    if not root.exists():
        if not shutil.which("git"):
            raise RuntimeError("git is required to clone whisper.cpp when it is not already present")
        run(["git", "clone", "--depth", "1", WHISPER_CPP_REPO, str(root)])
    if not shutil.which("cmake"):
        raise RuntimeError("cmake is required to build whisper.cpp")
    build_dir = root / "build"
    run(["cmake", "-S", str(root), "-B", str(build_dir), "-DWHISPER_BUILD_TESTS=OFF"])
    run(["cmake", "--build", str(build_dir), "--config", "Release", "-j", str(jobs)])
    binary = locate_whisper_binary()
    if not binary:
        raise RuntimeError("whisper.cpp built, but no whisper-cli/main binary was found")
    return make_wrapper("whisper-cli", binary)


def ensure_model() -> Path:
    path = model_path()
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(MODEL_URL, headers={"User-Agent": "LocalKnowledgeIntake/1.0"})
    with urllib.request.urlopen(request, timeout=300) as response:
        with path.open("wb") as handle:
            shutil.copyfileobj(response, handle)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", help="Path to workspace.json. Defaults to a walk upward from the working directory.")
    parser.add_argument("--workspace-root", help="Override the workspace root for this run.")
    parser.add_argument("--check", action="store_true", help="Only print detected tools")
    parser.add_argument("--yes", action="store_true", help="Perform downloads/installs without an interactive prompt")
    parser.add_argument("--skip-whisper-cpp", action="store_true")
    parser.add_argument("--jobs", type=int, default=max(os.cpu_count() or 2, 2))
    args = parser.parse_args()

    workspace_root = bind_workspace(args.config, args.workspace_root)
    before = report(workspace_root)
    if args.check:
        print(json.dumps(before, indent=2))
        return 0

    if not args.yes:
        print(json.dumps(before, indent=2))
        print("Re-run with --yes to install missing workspace-local tools.")
        return 2

    if not find_tool("yt-dlp"):
        install_yt_dlp()
    if not find_tool("ffmpeg"):
        install_ffmpeg()
    if not args.skip_whisper_cpp and not find_tool("whisper-cli"):
        install_whisper_cpp(args.jobs)
    if not args.skip_whisper_cpp:
        ensure_model()

    print(json.dumps(report(workspace_root), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
