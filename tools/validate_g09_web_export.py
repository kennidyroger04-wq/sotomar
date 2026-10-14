#!/usr/bin/env python3
"""Validate and summarize the deployable Godot Web export without source files."""
from __future__ import annotations

import pathlib
import sys

REQUIRED = {"index.html", "index.js", "index.wasm", "index.pck"}
FORBIDDEN_SUFFIXES = {".gd", ".tscn", ".tres", ".svg", ".psd", ".aseprite", ".md"}


def main() -> int:
    export = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "build/web")
    if not export.is_dir():
        raise SystemExit(f"ERROR: export directory does not exist: {export}")
    files = sorted(path for path in export.rglob("*") if path.is_file())
    names = {path.name for path in files}
    missing = REQUIRED - names
    forbidden = [path.relative_to(export).as_posix() for path in files if path.suffix.lower() in FORBIDDEN_SUFFIXES]
    if missing:
        raise SystemExit("ERROR: missing export files: " + ", ".join(sorted(missing)))
    if forbidden:
        raise SystemExit("ERROR: development/source files included in web export: " + ", ".join(forbidden))
    if any(path.stat().st_size == 0 for path in files):
        raise SystemExit("ERROR: empty file in export")
    total = sum(path.stat().st_size for path in files)
    print(f"Web export validated: {len(files)} files, {total:,} bytes ({total / 1024 / 1024:.2f} MiB)")
    for path in files:
        print(f"{path.relative_to(export).as_posix()}: {path.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
