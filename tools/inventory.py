#!/usr/bin/env python3
"""Create a portable, SHA-256 inventory of a project directory."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import os
from pathlib import Path
import subprocess
from datetime import datetime, timezone

MANIFEST_NAME = "repository_manifest.json"
ASSET_DIR_NAMES = {"asset", "assets", "audio", "fonts", "images", "maps", "music", "sfx", "sounds", "sprites", "textures"}
ASSET_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg", ".avif", ".mp3", ".ogg", ".wav", ".m4a", ".flac", ".ttf", ".otf", ".woff", ".woff2", ".glb", ".gltf", ".obj", ".fbx", ".json"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_paths(root: Path, *args: str) -> set[str]:
    try:
        result = subprocess.run(["git", "-C", str(root), "ls-files", *args], check=True, capture_output=True, text=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        return set()
    return {line.replace("\\", "/") for line in result.stdout.splitlines()}


def build_manifest(root: Path) -> dict:
    root = root.resolve()
    files: list[dict] = []
    directories: list[str] = []
    extensions: collections.Counter[str] = collections.Counter()
    sizes_by_directory: collections.Counter[str] = collections.Counter()
    duplicates: dict[str, list[str]] = collections.defaultdict(list)
    largest: list[tuple[int, str]] = []
    empty_files: list[str] = []
    asset_files: list[str] = []

    for current, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d != ".git")
        current_path = Path(current)
        for name in dirs:
            rel_dir = (current_path / name).relative_to(root).as_posix()
            directories.append(rel_dir)
        for name in sorted(names):
            path = current_path / name
            rel = path.relative_to(root).as_posix()
            if rel == f"reports/{MANIFEST_NAME}":
                continue
            is_link = path.is_symlink()
            if is_link:
                target = os.readlink(path)
                size = len(os.fsencode(target))
                entry = {"path": rel, "type": "symlink", "target": target, "size_bytes": size, "sha256": None}
            else:
                try:
                    size = path.stat().st_size
                    digest = sha256_file(path)
                except OSError as exc:
                    entry = {"path": rel, "type": "unreadable", "error": str(exc)}
                    files.append(entry)
                    continue
                entry = {"path": rel, "type": "file", "size_bytes": size, "sha256": digest}
                duplicates[digest].append(rel)
                suffix = path.suffix.lower() or "[no extension]"
                extensions[suffix] += 1
                sizes_by_directory[path.parent.relative_to(root).as_posix()] += size
                largest.append((size, rel))
                if size == 0:
                    empty_files.append(rel)
                if any(part.lower() in ASSET_DIR_NAMES for part in path.relative_to(root).parts[:-1]) or suffix in ASSET_EXTENSIONS:
                    asset_files.append(rel)
            files.append(entry)

    tracked = git_paths(root, "--cached")
    untracked = git_paths(root, "--others", "--exclude-standard")
    ignored = git_paths(root, "--others", "--ignored", "--exclude-standard")
    duplicate_groups = [sorted(paths) for paths in duplicates.values() if len(paths) > 1]
    return {
        "schema_version": 1,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "summary": {
            "file_count": len(files),
            "directory_count": len(directories),
            "total_size_bytes": sum(item.get("size_bytes", 0) for item in files),
            "asset_file_count": len(asset_files),
            "empty_file_count": len(empty_files),
            "unreadable_file_count": sum(item.get("type") == "unreadable" for item in files),
        },
        "directories": sorted(directories),
        "files": sorted(files, key=lambda item: item["path"].casefold()),
        "extensions": dict(sorted(extensions.items())),
        "size_bytes_by_directory": dict(sorted(sizes_by_directory.items())),
        "largest_files": [{"path": path, "size_bytes": size} for size, path in sorted(largest, reverse=True)[:50]],
        "duplicate_sha256_groups": sorted(duplicate_groups),
        "asset_files": sorted(asset_files),
        "empty_files": sorted(empty_files),
        "git": {
            "tracked_paths": sorted(tracked),
            "untracked_paths": sorted(untracked),
            "ignored_paths": sorted(ignored),
            "note": "Git path lists are empty when this directory is not a readable Git worktree.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path.cwd(), help="project root (default: current directory)")
    parser.add_argument("--output", type=Path, help="write JSON here (default: stdout)")
    args = parser.parse_args()
    result = json.dumps(build_manifest(args.root), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result, encoding="utf-8")
    else:
        print(result, end="")


if __name__ == "__main__":
    main()
