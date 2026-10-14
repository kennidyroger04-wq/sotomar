#!/usr/bin/env python3
"""Create static review boards and GIFs for the G06 character pack."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reviews/g06"
ACTIONS = ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
DIRECTIONS = ["ne", "se", "sw", "nw"]
BG = (30, 39, 46, 255)
TEXT = (240, 229, 204, 255)


def font(size: int):
    for path in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def male_frame(action: str, direction: int, frame: int) -> Image.Image:
    sheet = Image.open(ROOT / f"assets/characters/warrior_male_g06/warrior_male_{action}.png").convert("RGBA")
    return sheet.crop((direction * 128, frame * 160, (direction + 1) * 128, (frame + 1) * 160))


def fit_center(canvas: Image.Image, sprite: Image.Image, center_x: int, ground_y: int, scale: int = 2):
    sprite = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST if scale == 1 else Image.Resampling.LANCZOS)
    canvas.alpha_composite(sprite, (center_x - sprite.width // 2, ground_y - 152 * scale))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # All 112 unique animation frames: action sections, four directions, four frames.
    cell_w, cell_h = 288, 96
    board = Image.new("RGBA", (4 * cell_w, len(ACTIONS) * (4 * cell_h + 32)), BG)
    draw = ImageDraw.Draw(board)
    for action_index, action in enumerate(ACTIONS):
        top = action_index * (4 * cell_h + 32)
        draw.text((8, top + 4), action.upper(), fill=TEXT, font=font(18))
        for direction_index, direction in enumerate(DIRECTIONS):
            y = top + 30 + direction_index * cell_h
            draw.text((4, y + 4), direction.upper(), fill=TEXT, font=font(11))
            for frame_index in range(4):
                x = 32 + frame_index * 64
                sprite = male_frame(action, direction_index, frame_index).resize((64, 80), Image.Resampling.LANCZOS)
                board.alpha_composite(sprite, (x, y))
    board.save(OUT / "male_all_animations.png")

    # Like-for-like SE idle comparison at the same display scale and pivot.
    comparison = Image.new("RGBA", (940, 390), BG)
    draw = ImageDraw.Draw(comparison)
    draw.text((145, 18), "GUERREIRA · WAYFARER", fill=TEXT, font=font(22))
    draw.text((585, 18), "GUERREIRO · G06", fill=TEXT, font=font(22))
    wayfarer = Image.open(ROOT / "assets/characters/wayfarer_v1/wayfarer_v1.png").convert("RGBA")
    # Existing G03 idle_se uses source row y=480.
    for frame_index in range(4):
        cel = wayfarer.crop((frame_index * 128, 480, (frame_index + 1) * 128, 640))
        if frame_index == 0:
            fit_center(comparison, cel, 300, 335, 2)
    fit_center(comparison, male_frame("idle", 1, 0), 675, 335, 2)
    draw.text((267, 350), "regras, atributos e slots iguais", fill=(192, 211, 201, 255), font=font(14))
    draw.text((644, 350), "pivot comum: (64, 152)", fill=(192, 211, 201, 255), font=font(14))
    comparison.save(OUT / "hero_comparison.png")

    # Static selection screen mock preview, preserving the two real character sprites.
    selection = Image.new("RGBA", (960, 640), (23, 36, 45, 255))
    draw = ImageDraw.Draw(selection)
    draw.text((280, 24), "SOTOMAR · FÍMBRIA", fill=(240, 214, 148, 255), font=font(32))
    draw.text((250, 67), "Escolha quem seguirá pela fronteira de Fímbria", fill=TEXT, font=font(19))
    for index, title in enumerate(["Guerreiro masculino", "Guerreira feminina"]):
        left = 105 + index * 390
        draw.rounded_rectangle((left, 110, left + 350, 565), radius=12, fill=(39, 57, 67, 255), outline=(232, 189, 98, 255), width=3)
        draw.text((left + 53, 128), title, fill=TEXT, font=font(20))
        if index == 0:
            sprite = male_frame("idle", 1, 0)
        else:
            sprite = wayfarer.crop((0, 480, 128, 640))
        fit_center(selection, sprite, left + 175, 470, 2)
        draw.rounded_rectangle((left + 95, 500, left + 255, 542), radius=6, fill=(51, 85, 75, 255), outline=(119, 151, 111, 255), width=1)
        draw.text((left + 134, 510), "Selecionar", fill=TEXT, font=font(16))
    draw.text((280, 594), "← → para escolher  ·  Enter para confirmar", fill=(201, 221, 213, 255), font=font(16))
    selection.save(OUT / "selection_preview.png")

    # Standalone sword/buckler overview, all four isometric angles.
    gear_board = Image.new("RGBA", (760, 430), BG)
    draw = ImageDraw.Draw(gear_board)
    for row, slot in enumerate(["sword", "shield"]):
        draw.text((18, 28 + row * 196), slot.upper(), fill=TEXT, font=font(20))
        sheet = Image.open(ROOT / f"assets/equipment/g06/warrior_male_{slot}.png").convert("RGBA")
        for direction in range(4):
            cell = sheet.crop((direction * 128, 0, (direction + 1) * 128, 160)).resize((128, 160), Image.Resampling.LANCZOS)
            gear_board.alpha_composite(cell, (80 + direction * 160, 20 + row * 196))
            draw.text((115 + direction * 160, 180 + row * 196), DIRECTIONS[direction].upper(), fill=TEXT, font=font(13))
    gear_board.save(OUT / "male_equipment_catalog.png")

    # Map composition placeholder with real imported terrain and all three rigs.
    map_board = Image.new("RGBA", (1080, 600), BG)
    draw = ImageDraw.Draw(map_board)
    tile = Image.open(ROOT / "assets/tiles/terrain/g03/grass_meadow.png").convert("RGBA")
    for y in range(7):
        for x in range(13):
            px = 540 + (x - y) * 32
            py = 76 + (x + y) * 16
            map_board.alpha_composite(tile, (px - 64, py - 40))
    fit_center(map_board, male_frame("idle", 1, 0), 360, 410, 2)
    female_se = wayfarer.crop((0, 480, 128, 640))
    fit_center(map_board, female_se, 555, 410, 2)
    raider = Image.open(ROOT / "assets/characters/moss_raider_g05/moss_raider_idle.png").convert("RGBA").crop((0, 0, 128, 160))
    fit_center(map_board, raider, 750, 410, 2)
    draw.text((292, 464), "WARRIOR", fill=TEXT, font=font(16))
    draw.text((500, 464), "WAYFARER", fill=TEXT, font=font(16))
    draw.text((697, 464), "MOSS RAIDER", fill=TEXT, font=font(16))
    map_board.save(OUT / "characters_on_map.png")

    # Four principal animation previews, one consistent SE direction per action.
    for action in ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]:
        frames = [male_frame(action, 1, index).resize((256, 320), Image.Resampling.LANCZOS) for index in range(4)]
        duration = 220 if action in ["idle", "death"] else 140
        frames[0].save(OUT / f"warrior_{action}.gif", save_all=True, append_images=frames[1:], duration=duration, loop=0, disposal=2, transparency=0)

    index = {
        "static_review_aids_only": True,
        "godot_desktop_capture": False,
        "images": ["male_all_animations.png", "hero_comparison.png", "selection_preview.png", "male_equipment_catalog.png", "characters_on_map.png"],
        "gifs": [f"warrior_{action}.gif" for action in ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]],
        "source_frames": 112,
        "art_approval": "pending in-engine visual inspection",
    }
    (OUT / "review_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

    print("G06 review boards and seven action GIFs generated.")


if __name__ == "__main__":
    main()
