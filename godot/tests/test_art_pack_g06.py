#!/usr/bin/env python3
"""Raster and source-manifest checks for original G06 character art."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]


def check(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)
    print(f"PASS: {message}")


def main() -> None:
    actions = ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
    manifest = json.loads((ROOT / "resources/characters/warrior_male_g06.json").read_text())
    check(manifest["frame_size"] == [128, 160] and manifest["pivot_feet"] == [64, 152], "character contract records shared 128x160 frame and feet pivot")
    check(manifest["events"] == {"attack": {"frame": 2, "event": "impact"}, "defend": {"frame": 2, "event": "block"}, "cast": {"frame": 2, "event": "release"}, "hurt": {"frame": 1, "event": "damage_received"}, "death": {"frame": 3, "event": "defeated"}}, "combat event markers match the G05 character contract")
    total = 0
    for action in actions:
        path = ROOT / f"assets/characters/warrior_male_g06/warrior_male_{action}.png"
        sheet = Image.open(path)
        check(sheet.mode == "RGBA" and sheet.size == (512, 640), f"{action} atlas is 512x640 RGBA")
        geometry_ok = True
        unique_ok = True
        for direction in range(4):
            frames = [sheet.crop((direction * 128, frame * 160, (direction + 1) * 128, (frame + 1) * 160)) for frame in range(4)]
            for frame in frames:
                bbox = frame.getchannel("A").getbbox()
                geometry_ok = geometry_ok and bbox is not None and bbox[3] - 1 == 152
                total += 1
            for first in range(4):
                for second in range(first + 1, 4):
                    unique_ok = unique_ok and ImageChops.difference(frames[first], frames[second]).getbbox() is not None
        check(geometry_ok, f"{action} atlas has 16 visible frames aligned to feet baseline y=152")
        check(unique_ok, f"{action} four-frame cycles are non-duplicated in all four directions")
    check(total == 112, "all 112 male animation frames contain visible pixels")
    for slot in ["sword", "shield"]:
        sheet = Image.open(ROOT / f"assets/equipment/g06/warrior_male_{slot}.png")
        check(sheet.mode == "RGBA" and sheet.size == (512, 160), f"male {slot} atlas is 512x160 RGBA")
        valid_directions = True
        for direction in range(4):
            cell = sheet.crop((direction * 128, 0, (direction + 1) * 128, 160))
            valid_directions = valid_directions and cell.getchannel("A").getbbox() is not None
        check(valid_directions, f"male {slot} has four visible isometric orientations")
    sources = [ROOT / Path(item.replace("res://", "")) for item in manifest["sources"]]
    check(all(path.exists() for path in sources), "all editable G06 source masters referenced by metadata exist")
    print("PASS: G06 art pack raster checks")


if __name__ == "__main__":
    main()
