#!/usr/bin/env python3
"""Static checks for G09's private-source, explicitly gated Web publication."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print("PASS:", message)


def main() -> int:
    workflow = (ROOT / ".github/workflows/godot-web.yml").read_text()
    experimental = (ROOT / ".github/workflows/godot-web-experimental.yml").read_text()
    firebase = json.loads((ROOT / "firebase.json").read_text())
    hosting = firebase["hosting"]
    check("Godot_v${version}-stable_linux.x86_64.zip" in workflow and "version='4.6.3'" in workflow and "Godot_v${version}-stable_export_templates.tpz" in workflow, "CI pins matching Godot 4.6.3 engine and export templates")
    check("pull_request:" in workflow and "branches: [main]" in workflow, "pull requests and main updates build without needing deployment credentials")
    check("github.event_name == 'workflow_dispatch' && inputs.publish == true" in workflow, "external publication is only possible after a manual dispatch with publish=true")
    check("FIREBASE_SERVICE_ACCOUNT" in workflow and "projectId: sotomar-eaf2c" in workflow, "deployment uses the protected service-account secret and the configured Firebase project ID")
    check(hosting["public"] == "build/web" and "**/node_modules/**" in hosting["ignore"], "hosting serves the export directory rather than the private project tree")
    project_aliases = json.loads((ROOT / ".firebaserc").read_text())["projects"]
    check(project_aliases.get("default") == "sotomar-eaf2c", "Firebase CLI defaults to the configured Sotomar project")
    headers = {entry["source"]: {h["key"]: h["value"] for h in entry["headers"]} for entry in hosting["headers"]}
    check(headers["index.html"].get("Cache-Control") == "no-cache", "the entry page revalidates so deployments do not leave a stale app bundle")
    check("immutable" not in json.dumps(hosting["headers"]), "fixed-name Godot runtime files are not cached as immutable across deployments")
    check(not hosting.get("rewrites"), "static Godot assets are not hidden behind a generic SPA rewrite")
    result = subprocess.run([sys.executable, str(ROOT / "tools/validate_g09_web_export.py"), str(ROOT / "build/web")], text=True, capture_output=True)
    check(result.returncode == 0 and "MiB" in result.stdout, "current export passes required-file, nonempty-file, and source-exclusion validation")
    check("4.6.3" in workflow and "permissions:" in workflow and "contents: read" in workflow, "workflow uses read-only repository permission and the engine version required by the project")
    check("actions/checkout@11d5960a326750d5838078e36cf38b85af677262" in workflow and "actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830" in workflow and "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02" in workflow and "action-hosting-deploy@500ac625ca2dd40cbd15f7659af953801858032a" in workflow, "GitHub Actions dependencies are pinned to immutable commit SHAs")
    check("branches: [operation/g12-g17]" in experimental and "workflow_dispatch:" in experimental, "experimental workflow runs only for the operation branch, its pull requests, or manual dispatch")
    check("sotomar-fimbria-experimental-web" in experimental and "retention-days: 7" in experimental and "Firebase" not in experimental and "secrets." not in experimental, "experimental workflow uploads a short-lived artifact without publication credentials")
    check("actions/checkout@11d5960a326750d5838078e36cf38b85af677262" in experimental and "actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830" in experimental and "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02" in experimental, "experimental workflow dependencies are pinned to immutable commit SHAs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
