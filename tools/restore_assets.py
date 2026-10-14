#!/usr/bin/env python3
"""Safely plan or restore assets/ files from the project's original ZIP."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path, PurePosixPath
import stat
import sys
import zipfile


def safe_asset_path(name: str) -> Path | None:
    if "\\" in name or name.startswith("/"):
        raise ValueError(f"unsafe ZIP path: {name!r}")
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise ValueError(f"unsafe ZIP path: {name!r}")
    if not path.parts or path.parts[0] != "assets" or len(path.parts) < 2:
        return None
    return Path(*path.parts)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="original project ZIP")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root (default: current directory)")
    parser.add_argument("--apply", action="store_true", help="write missing assets after validating the full archive")
    args = parser.parse_args()
    root = args.root.resolve()
    plan: list[tuple[Path, bytes, str]] = []
    conflicts: list[str] = []
    seen: set[Path] = set()

    try:
        with zipfile.ZipFile(args.archive) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                rel = safe_asset_path(info.filename)
                if rel is None:
                    continue
                mode = info.external_attr >> 16
                if stat.S_ISLNK(mode) or (mode and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode))):
                    raise ValueError(f"non-regular ZIP entry: {info.filename!r}")
                if rel in seen:
                    raise ValueError(f"duplicate ZIP path: {rel.as_posix()}")
                seen.add(rel)
                data = archive.read(info)
                target = root / rel
                if any(part.is_symlink() for part in [root, *(root / Path(*rel.parts[:i]) for i in range(1, len(rel.parts)))]):
                    conflicts.append(f"{rel.as_posix()}: target path contains a symlink")
                    continue
                if target.exists():
                    if target.is_symlink() or not target.is_file():
                        conflicts.append(f"{rel.as_posix()}: target is not a regular file")
                    elif digest(target.read_bytes()) == digest(data):
                        print(f"SAME {rel.as_posix()} sha256={digest(data)}")
                    else:
                        conflicts.append(f"{rel.as_posix()}: existing file differs; left untouched")
                else:
                    plan.append((rel, data, digest(data)))
                    print(f"{'ADD' if args.apply else 'WOULD_ADD'} {rel.as_posix()} bytes={len(data)} sha256={digest(data)}")
    except (OSError, zipfile.BadZipFile, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print(f"Summary: {len(plan)} missing assets; {len(seen)} ZIP assets checked; {len(conflicts)} conflicts.")
    if conflicts:
        for conflict in conflicts:
            print(f"CONFLICT {conflict}", file=sys.stderr)
        print("No files were written because conflicts exist.", file=sys.stderr)
        return 1
    if not args.apply:
        print("Dry run only. Pass --apply to add missing files.")
        return 0

    written: list[Path] = []
    try:
        for rel, data, _ in plan:
            target = root / rel
            if any(part.is_symlink() for part in [root, *(root / Path(*rel.parts[:i]) for i in range(1, len(rel.parts)))]):
                raise OSError(f"target path contains a symlink: {rel.as_posix()}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open("xb") as stream:
                stream.write(data)
            written.append(target)
    except OSError as exc:
        print(f"ERROR while writing {exc}; removing files written in this run.", file=sys.stderr)
        for target in reversed(written):
            target.unlink(missing_ok=True)
        return 2
    print(f"Restored {len(written)} files under {root / 'assets'}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
