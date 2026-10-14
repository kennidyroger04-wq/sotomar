#!/usr/bin/env python3
"""Normalize the original G06 master sheets to the shared 128x160 frame contract."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/source/generated_g06"
CHARACTER_OUT = ROOT / "assets/characters/warrior_male_g06"
EQUIPMENT_OUT = ROOT / "assets/equipment/g06"
ACTIONS = ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
DIRECTIONS = ["ne", "se", "sw", "nw"]
FRAME = (128, 160)


def split_grid(image: Image.Image, columns: int, rows: int):
    width, height = image.size
    for y in range(rows):
        for x in range(columns):
            yield (x, y), image.crop(
                (round(x * width / columns), round(y * height / rows),
                 round((x + 1) * width / columns), round((y + 1) * height / rows))
            )


def main() -> None:
    CHARACTER_OUT.mkdir(parents=True, exist_ok=True)
    EQUIPMENT_OUT.mkdir(parents=True, exist_ok=True)
    for action in ACTIONS:
        master = Image.open(SOURCE / f"male_warrior_{action}_master.png").convert("RGBA")
        if master.size != (1122, 1402):
            raise ValueError(f"Unexpected {action} source size: {master.size}")
        sheet = Image.new("RGBA", (FRAME[0] * 4, FRAME[1] * 4), (0, 0, 0, 0))
        # Columns are four animation frames; rows are NE, SE, SW, NW.
        for (col, row), cell in split_grid(master, 4, 4):
            frame = cell.resize(FRAME, Image.Resampling.LANCZOS)
            alpha_bounds = frame.getchannel("A").getbbox()
            if alpha_bounds is None:
                raise ValueError(f"Empty {action} frame at row {row}, column {col}")
            target_bottom = 152
            shift_y = target_bottom - (alpha_bounds[3] - 1)
            adjusted = Image.new("RGBA", FRAME, (0, 0, 0, 0))
            adjusted.alpha_composite(frame, (0, shift_y))
            sheet.alpha_composite(adjusted, (row * FRAME[0], col * FRAME[1]))
        path = CHARACTER_OUT / f"warrior_male_{action}.png"
        sheet.save(path, optimize=True)
    equipment = Image.open(SOURCE / "male_equipment_master.png").convert("RGBA")
    if equipment.size != (1586, 992):
        raise ValueError(f"Unexpected equipment source size: {equipment.size}")
    for row, slot in enumerate(["sword", "shield"]):
        sheet = Image.new("RGBA", (FRAME[0] * 4, FRAME[1]), (0, 0, 0, 0))
        equipment_row = equipment.crop((0, round(row * equipment.height / 2), equipment.width, round((row + 1) * equipment.height / 2)))
        for (col, _), cell in split_grid(equipment_row, 4, 1):
            sheet.paste(cell.resize(FRAME, Image.Resampling.LANCZOS), (col * FRAME[0], 0))
        sheet.save(EQUIPMENT_OUT / f"warrior_male_{slot}.png", optimize=True)
    manifest = {
        "id": "character.warrior_male.g06",
        "display_name": "Guerreiro",
        "frame_size": list(FRAME),
        "pivot_feet": [64, 152],
        "directions_in_source": DIRECTIONS,
        "actions": {
            action: {
                "path": f"res://assets/characters/warrior_male_g06/warrior_male_{action}.png",
                "fps": {"idle": 4, "walk": 8, "defend": 5, "death": 4}.get(action, 6),
                "loop": action in ["idle", "walk"],
                "frame_count": 16,
                "directions": {direction: {"frames": 4, "rects": [[i * 128, j * 160, 128, 160] for j in range(4)]} for i, direction in enumerate(DIRECTIONS)},
                "impact_event": {"attack": 2, "defend": 2, "cast": 2, "hurt": 1, "death": 3}.get(action),
            }
            for action in ACTIONS
        },
        "equipment": {
            slot: {"path": f"res://assets/equipment/g06/warrior_male_{slot}.png", "directions": DIRECTIONS, "frame_size": list(FRAME), "slot": "weapon" if slot == "sword" else "shield"}
            for slot in ["sword", "shield"]
        },
        "planned_slots": ["weapon", "shield", "helmet", "armor"],
        "events": {
            "attack": {"frame": 2, "event": "impact"},
            "defend": {"frame": 2, "event": "block"},
            "cast": {"frame": 2, "event": "release"},
            "hurt": {"frame": 1, "event": "damage_received"},
            "death": {"frame": 3, "event": "defeated"},
        },
        "sources": [f"res://art/source/generated_g06/male_warrior_{action}_master.png" for action in ACTIONS] + ["res://art/source/generated_g06/male_equipment_master.png"],
        "rendering_note": "Generated illustrated master sheets normalized to a common frame canvas; GDScript/SpriteFrames share the G05 feet transform."
    }
    (ROOT / "resources/characters/warrior_male_g06.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("Built seven 512x640 action sheets, two 512x160 equipment sheets, and metadata.")


if __name__ == "__main__":
    main()
