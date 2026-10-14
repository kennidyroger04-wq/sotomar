#!/usr/bin/env python3
"""Compare two directory trees by relative path, size, and SHA-256."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from inventory import build_manifest


def compare(original: Path, repository: Path) -> dict:
    old = build_manifest(original)
    new = build_manifest(repository)
    old_files = {item["path"]: item for item in old["files"]}
    new_files = {item["path"]: item for item in new["files"]}
    missing = sorted(set(old_files) - set(new_files))
    additional = sorted(set(new_files) - set(old_files))
    modified = []
    for path in sorted(set(old_files) & set(new_files)):
        before, after = old_files[path], new_files[path]
        if (before.get("type"), before.get("size_bytes"), before.get("sha256"), before.get("target")) != (after.get("type"), after.get("size_bytes"), after.get("sha256"), after.get("target")):
            modified.append({"path": path, "original": before, "repository": after})
    return {
        "schema_version": 1,
        "original_root": str(original.resolve()),
        "repository_root": str(repository.resolve()),
        "summary": {"missing_count": len(missing), "modified_count": len(modified), "additional_count": len(additional)},
        "missing": [{"path": path, "priority": "HIGH"} for path in missing],
        "modified": [{**item, "priority": "HIGH"} for item in modified],
        "additional": [{"path": path, "priority": "REVIEW"} for path in additional],
        "note": "Comparison is by relative path; generated manifests are excluded from both trees.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("original", type=Path, help="original game directory")
    parser.add_argument("repository", type=Path, help="repository directory")
    parser.add_argument("--output", type=Path, help="write report here (default: stdout)")
    args = parser.parse_args()
    if not args.original.is_dir() or not args.repository.is_dir():
        parser.error("both original and repository paths must be existing directories")
    result = json.dumps(compare(args.original, args.repository), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result, encoding="utf-8")
    else:
        print(result, end="")


if __name__ == "__main__":
    main()
