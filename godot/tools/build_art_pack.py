#!/usr/bin/env python3
"""Crop the original G03 raster master sheets into deterministic game assets."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/source/generated_g03"
TERRAIN = ROOT / "assets/tiles/terrain/g03"
PROPS = ROOT / "assets/props/g03"
CHARACTERS = ROOT / "assets/characters/wayfarer_v1"
TILE_SIZE = (128, 80)
ALPHA_CROP_THRESHOLD = 96

MATERIAL_TILES = [
    ("grass_meadow", 0, 0), ("grass_clover", 1, 0), ("grass_fern", 2, 0),
    ("dirt_ochre", 3, 0), ("dirt_dappled", 4, 0),
    ("stone_moss", 0, 1), ("stone_lichen", 1, 1),
    ("water_clear", 0, 2), ("water_ripple", 1, 2), ("water_lily", 2, 2),
]
PATH_TILES = [
    "path_center", "path_straight_ne_sw", "path_straight_nw_se",
    "path_bend", "path_cross",
]
TRANSITION_TILES = [
    "transition_grass_earth_edge_north", "transition_grass_earth_edge_east",
    "transition_grass_earth_edge_south", "transition_grass_earth_edge_west",
    "transition_grass_earth_diagonal", "transition_grass_water_stones_a",
    "transition_grass_water_stones_b", "transition_earth_cliff_edge",
]


def crop_cell(image: Image.Image, columns: int, rows: int, x: int, y: int, inset_x: int = 0) -> Image.Image:
    box = (
        round(x * image.width / columns), round(y * image.height / rows),
        round((x + 1) * image.width / columns), round((y + 1) * image.height / rows),
    )
    cell = image.crop(box).convert("RGBA")
    if inset_x:
        cell = cell.crop((inset_x, 0, cell.width - inset_x, cell.height))
    mask = cell.getchannel("A").point(lambda value: 255 if value >= ALPHA_CROP_THRESHOLD else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"empty cell {x},{y} in {image.size}")
    sprite = cell.crop(bounds)
    # The raster source is painterly and not vector art. Fit it to the established
    # 128x80 texture contract; alpha outside the silhouette remains transparent.
    sprite = sprite.resize(TILE_SIZE, Image.Resampling.LANCZOS)
    return clear_low_alpha(sprite)


def crop_rect(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    sprite = image.crop(box).convert("RGBA")
    mask = sprite.getchannel("A").point(lambda value: 255 if value >= ALPHA_CROP_THRESHOLD else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"empty custom crop {box}")
    return clear_low_alpha(sprite.crop(bounds).resize(TILE_SIZE, Image.Resampling.LANCZOS))


def clear_low_alpha(image: Image.Image, cutoff: int = 12) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    alpha = alpha.point(lambda value: 0 if value < cutoff else value)
    image.putalpha(alpha)
    return image


def save_grid_tiles() -> list[dict[str, object]]:
    material_sheet = Image.open(SOURCE / "terrain_materials_master.png").convert("RGBA")
    path_sheet = Image.open(SOURCE / "paths_master.png").convert("RGBA")
    transition_sheet = Image.open(SOURCE / "transitions_master.png").convert("RGBA")
    TERRAIN.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    for name, x, y in MATERIAL_TILES:
        if name == "stone_moss":
            image = crop_rect(material_sheet, (0, round(material_sheet.height / 3), 275, round(2 * material_sheet.height / 3)))
        elif name == "stone_lichen":
            # The source sheet places a stray neighboring outline just left of
            # this stone; trim that 3px sliver without touching the tile face.
            image = crop_rect(material_sheet, (281, round(material_sheet.height / 3), 550, round(2 * material_sheet.height / 3)))
        else:
            image = crop_cell(material_sheet, 5, 3, x, y)
        filename = f"{name}.png"
        image.save(TERRAIN / filename, optimize=True)
        records.append(tile_record(name, filename, "terrain"))
    for index, name in enumerate(PATH_TILES):
        image = crop_cell(path_sheet, 3, 2, index % 3, index // 3)
        filename = f"{name}.png"
        image.save(TERRAIN / filename, optimize=True)
        records.append(tile_record(name, filename, "path"))
    for index, name in enumerate(TRANSITION_TILES):
        image = crop_cell(transition_sheet, 4, 2, index % 4, index // 4)
        filename = f"{name}.png"
        image.save(TERRAIN / filename, optimize=True)
        records.append(tile_record(name, filename, "transition"))
    return records


def tile_record(name: str, filename: str, group: str) -> dict[str, object]:
    master = {
        "terrain": "terrain_materials_master.png",
        "path": "paths_master.png",
        "transition": "transitions_master.png",
    }[group]
    return {
        "name": name,
        "group": group,
        "path": f"res://assets/tiles/terrain/g03/{filename}",
        "size": [128, 80],
        "tile_pitch": [128, 64],
        "texture_origin": [0, -8],
        "display_scale": 0.5,
        "pivot": [64, 32],
        "editable_source": f"res://art/source/generated_g03/{master}",
    }


def save_prop(sheet: Image.Image, filename: str, half: int) -> dict[str, object]:
    left = 0 if half == 0 else sheet.width // 2
    right = sheet.width // 2 if half == 0 else sheet.width
    crop = sheet.crop((left, 0, right, sheet.height)).convert("RGBA")
    mask = crop.getchannel("A").point(lambda value: 255 if value >= 80 else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f"missing prop in half {half}")
    prop = crop.crop(bounds)
    prop.thumbnail((240, 260), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 288), (0, 0, 0, 0))
    canvas.alpha_composite(prop, ((256 - prop.width) // 2, 280 - prop.height))
    canvas.save(PROPS / filename, optimize=True)
    return {
        "path": f"res://assets/props/g03/{filename}",
        "size": [256, 288],
        "pivot": [128, 280],
        "display_scale": 0.5,
        "origin": "asset base/feet; shadows included in original illustration",
    }


def save_props() -> dict[str, object]:
    PROPS.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE / "props_master.png").convert("RGBA")
    return {
        "tree_mosswood": save_prop(sheet, "tree_mosswood.png", 0),
        "rock_moss_stone": save_prop(sheet, "rock_moss_stone.png", 1),
    }


def save_character() -> dict[str, object]:
    sheet = Image.open(SOURCE / "wayfarer_character_master.png").convert("RGBA")
    frame_width, frame_height = 128, 160
    sprite_sheet = Image.new("RGBA", (frame_width * 8, frame_height * 4), (0, 0, 0, 0))
    frame_records = []
    for row in range(4):
        for column in range(8):
            box = (
                round(column * sheet.width / 8), round(row * sheet.height / 4),
                round((column + 1) * sheet.width / 8), round((row + 1) * sheet.height / 4),
            )
            frame = sheet.crop(box).convert("RGBA")
            mask = frame.getchannel("A").point(lambda value: 255 if value >= 64 else 0)
            bounds = mask.getbbox()
            if bounds is None:
                raise ValueError(f"empty character frame {row},{column}")
            frame = clear_low_alpha(frame.crop(bounds), 12)
            frame.thumbnail((116, 142), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (frame_width, frame_height), (0, 0, 0, 0))
            canvas.alpha_composite(frame, ((frame_width - frame.width) // 2, 152 - frame.height))
            sprite_sheet.alpha_composite(canvas, (column * frame_width, row * frame_height))
            frame_records.append({
                "row": row,
                "column": column,
                "rect": [column * frame_width, row * frame_height, frame_width, frame_height],
                "pivot": [64, 152],
            })
    CHARACTERS.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(CHARACTERS / "wayfarer_v1.png", optimize=True)
    return {
        "path": "res://assets/characters/wayfarer_v1/wayfarer_v1.png",
        "frame_size": [frame_width, frame_height],
        "columns": 8,
        "rows": 4,
        "directions": ["se", "sw", "nw", "ne"],
        "frame_pivot": [64, 152],
        "animation_groups": {"idle": [0, 1, 2, 3], "walk": [4, 5, 6, 7]},
        "idle_fps": 4,
        "walk_fps": 8,
        "frame_count": len(frame_records),
        "frames": frame_records,
        "source_art": "art/source/generated_g03/wayfarer_character_master.png",
    }


def main() -> None:
    expected_names = {
        f"{name}.png" for name, _, _ in MATERIAL_TILES
    } | {f"{name}.png" for name in PATH_TILES} | {f"{name}.png" for name in TRANSITION_TILES}
    TERRAIN.mkdir(parents=True, exist_ok=True)
    for old_file in TERRAIN.iterdir():
        if old_file.suffix in {".png", ".import"}:
            image_name = old_file.name.removesuffix(".import")
            if image_name not in expected_names:
                old_file.unlink()
    tile_records = save_grid_tiles()
    props = save_props()
    character = save_character()
    source_files = [
        "terrain_materials_master.png", "paths_master.png", "transitions_master.png",
        "props_master.png", "wayfarer_character_master.png",
    ]
    metadata = {
        "package": "Sotomar/Fímbria G03 original art prototype",
        "source_art": "Raster masters in res://art/source/generated_g03/",
        "editable_raster_masters": [
            {"path": f"res://art/source/generated_g03/{name}", "size": list(Image.open(SOURCE / name).size)}
            for name in source_files
        ],
        "art_status": "PROTOTYPE_REQUIRES_VISUAL_REVIEW",
        "tiles": tile_records,
        "props": props,
        "character": character,
    }
    (ROOT / "resources/art_pack_g03.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Exported {len(tile_records)} terrain/path/transition tiles, 2 props and {character['frame_count']} character frames")


if __name__ == "__main__":
    main()
