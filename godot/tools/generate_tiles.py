#!/usr/bin/env python3
"""Generate editable SVG sources and matching 2x PNG isometric ground tiles."""

from __future__ import annotations

import random
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/source/tiles/isometric"
OUTPUT = ROOT / "assets/tiles/terrain"
WIDTH, HEIGHT = 128, 80
DIAMOND = "64,0 128,32 64,64 0,32"

TILES = [
    ("terrain_grass_base", "#83c84e", "#4d9b42", "grass"),
    ("terrain_dirt", "#c89152", "#95633f", "dirt"),
    ("path_stone", "#c8b58b", "#918268", "path"),
    ("terrain_stone", "#9fa6a0", "#69736f", "stone"),
    ("terrain_water", "#50c6cc", "#287f91", "water"),
    ("terrain_grass_flowers", "#a1d95b", "#5a9b46", "flowers"),
]


def make_svg(name: str, top: str, side: str, kind: str, seed: int) -> str:
    rng = random.Random(seed)
    top_details: list[str] = []
    if kind in {"grass", "flowers"}:
        for _ in range(32):
            x = rng.uniform(19, 109)
            y = rng.uniform(15, 52)
            if abs(x - 64) / 62 + abs(y - 33) / 31 < 0.79:
                height = rng.uniform(3, 7)
                color = rng.choice(["#387c43", "#4d9148", "#d4e678"])
                top_details.append(f'<path d="M{x:.1f} {y+3:.1f}q-2 -{height:.1f} -3 -{height+1:.0f}m3 {height+1:.0f}q2 -{height+2:.0f} 4 -{height+3:.0f}" fill="none" stroke="{color}" stroke-width="1.5" stroke-linecap="round"/>')
        if kind == "flowers":
            for x, y in [(42, 28), (83, 42), (68, 20), (96, 31), (53, 47)]:
                top_details.append(f'<g><circle cx="{x}" cy="{y}" r="2.2" fill="#fff2c7"/><circle cx="{x}" cy="{y}" r="0.8" fill="#e8a83c"/></g>')
    elif kind == "dirt":
        for _ in range(42):
            x = rng.uniform(10, 118)
            y = rng.uniform(7, 58)
            if abs(x - 64) / 62 + abs(y - 33) / 31 < 0.88:
                radius = rng.uniform(0.7, 1.8)
                color = rng.choice(["#e6b56c", "#ad7045", "#f1cd85"])
                top_details.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius:.1f}" fill="{color}" opacity="0.85"/>')
    elif kind == "path":
        for x, y, rx, ry in [(64, 16, 12, 5), (43, 27, 11, 5), (78, 30, 12, 5), (59, 40, 13, 5), (91, 43, 9, 4), (34, 43, 8, 4), (73, 53, 10, 4)]:
            top_details.append(f'<path d="M{x-rx} {y}q0 -{ry} {rx} -{ry}q{rx} 0 {rx} {ry}q0 {ry} -{rx} {ry}q-{rx} 0 -{rx} -{ry}Z" fill="#dbcba7" stroke="#927e5f" stroke-width="1.3"/><path d="M{x-rx+3} {y-1}q4 -3 8 -3" fill="none" stroke="#f4e7c9" stroke-width="1.2" stroke-linecap="round"/>')
    elif kind == "stone":
        for x, y, radius in [(35, 25, 4), (80, 17, 3), (92, 37, 5), (53, 48, 3.5), (75, 40, 2.5), (30, 43, 2.5), (64, 30, 3)]:
            top_details.append(f'<path d="M{x-radius} {y+1}l{radius*.4:.1f} -{radius:.1f}l{(radius*.8):.1f} -{radius*.4:.1f}l{(radius*.8):.1f} {(radius*.7):.1f}l-{radius*.4:.1f} {radius:.1f}l-{(radius*.9):.1f} 0Z" fill="#737e78" stroke="#46574f" stroke-width="1"/><path d="M{x-radius*.3:.1f} {y-radius*.5:.1f}l{radius*.5:.1f} -{radius*.2:.1f}" stroke="#d1d4c8" stroke-width="1"/>')
    elif kind == "water":
        for x, y, rx in [(42, 22, 10), (77, 18, 8), (88, 36, 13), (51, 43, 12), (70, 53, 9), (29, 34, 7)]:
            top_details.append(f'<path d="M{x-rx} {y}q{rx/2:.1f} -3  {rx} 0q{rx/2:.1f} 3 {rx} 0" fill="none" stroke="#b5f3e7" stroke-width="1.6" opacity="0.85" stroke-linecap="round"/><path d="M{x-rx/2:.1f} {y+3}q{rx/2:.1f} -1.5 {rx} 0" fill="none" stroke="#2c91a2" stroke-width="1" opacity="0.8"/>')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="top" x1="0" y1="0" x2="0.8" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{side}"/></linearGradient>
    <clipPath id="top-diamond"><polygon points="{DIAMOND}"/></clipPath>
  </defs>
  <g stroke="#384c3c" stroke-width="2.2" stroke-linejoin="round">
    <path d="M0 32 64 64 128 32 128 46 64 78 0 46Z" fill="{side}"/>
    <path d="M0 32 64 64 64 78 0 46Z" fill="{side}" opacity="0.72"/>
    <polygon points="{DIAMOND}" fill="url(#top)"/>
    <g clip-path="url(#top-diamond)" stroke="none">{''.join(top_details)}</g>
    <polygon points="{DIAMOND}" fill="none" stroke="#384c3c" stroke-width="2.2"/>
    <path d="M8 33 64 61 119 33" fill="none" stroke="#ffffff" stroke-opacity="0.17" stroke-width="1.2"/>
  </g>
</svg>'''


def main() -> None:
    SOURCE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for index, (name, top, side, kind) in enumerate(TILES):
        svg_path = SOURCE / f"{name}.svg"
        png_path = OUTPUT / f"{name}.png"
        svg_path.write_text(make_svg(name, top, side, kind, index + 1), encoding="utf-8")
        subprocess.run([
            "inkscape", str(svg_path), "--export-type=png",
            f"--export-filename={png_path}", f"--export-width={WIDTH}",
            f"--export-height={HEIGHT}",
        ], check=True, stdout=subprocess.DEVNULL)
        print(f"{svg_path.relative_to(ROOT)} -> {png_path.relative_to(ROOT)} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
