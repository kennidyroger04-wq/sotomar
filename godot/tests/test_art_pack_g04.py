#!/usr/bin/env python3
"""Objective, renderer-independent checks for the G03/G04 art package."""
import json
import re
import unittest
from pathlib import Path
from PIL import Image

GODOT = Path(__file__).resolve().parents[1]
ROOT = GODOT.parent
META = json.loads((GODOT / "resources/art_pack_g03.json").read_text(encoding="utf-8"))

def local_resource(path):
    return GODOT / path.removeprefix("res://")

class ArtPackG04Tests(unittest.TestCase):
    def test_manifest_lists_23_unique_tiles_with_live_source_and_export(self):
        tiles = META["tiles"]
        self.assertEqual(len(tiles), 23)
        self.assertEqual(len({tile["name"] for tile in tiles}), 23)
        for tile in tiles:
            self.assertTrue(local_resource(tile["path"]).is_file(), tile["path"])
            self.assertTrue(local_resource(tile["editable_source"]).is_file(), tile["editable_source"])

    def test_tiles_have_documented_size_alpha_pivot_and_transparent_corners(self):
        for tile in META["tiles"]:
            path = local_resource(tile["path"])
            with Image.open(path) as image:
                self.assertEqual(image.size, (128, 80), path.name)
                self.assertEqual(image.mode, "RGBA", path.name)
                alpha = image.getchannel("A")
                self.assertIsNotNone(alpha.getbbox(), path.name)
                self.assertGreater(sum(1 for value in alpha.get_flattened_data() if value == 0), 0, path.name)
                self.assertGreater(max(alpha.get_flattened_data()), 240, path.name)
            self.assertEqual(tile["pivot"], [64, 32], tile["name"])
            self.assertEqual(tile["tile_pitch"], [128, 64], tile["name"])
            self.assertEqual(tile["texture_origin"], [0, -8], tile["name"])

    def test_master_files_match_manifest_dimensions(self):
        masters = META["editable_raster_masters"]
        self.assertEqual(len(masters), 5)
        for record in masters:
            path = local_resource(record["path"])
            self.assertTrue(path.is_file(), record["path"])
            with Image.open(path) as image:
                self.assertEqual(list(image.size), record["size"], path.name)
                self.assertEqual(image.mode, "RGBA", path.name)

    def test_props_preserve_transparency_and_base_pivot(self):
        self.assertEqual(set(META["props"]), {"tree_mosswood", "rock_moss_stone"})
        for name, prop in META["props"].items():
            path = local_resource(prop["path"])
            with Image.open(path) as image:
                self.assertEqual(image.size, (256, 288), name)
                self.assertEqual(image.mode, "RGBA", name)
                self.assertNotEqual(image.getchannel("A").getbbox(), None, name)
                self.assertLessEqual(abs(image.getchannel("A").getbbox()[3] - prop["pivot"][1]), 1, name)
            self.assertEqual(prop["pivot"], [128, 280], name)

    def test_all_32_character_cells_are_nonempty_and_share_baseline(self):
        char = META["character"]
        path = local_resource(char["path"])
        bottoms = []
        with Image.open(path) as sheet:
            self.assertEqual(sheet.size, (1024, 640))
            self.assertEqual(sheet.mode, "RGBA")
            for row in range(4):
                for col in range(8):
                    alpha = sheet.crop((col*128, row*160, (col+1)*128, (row+1)*160)).getchannel("A")
                    bounds = alpha.getbbox()
                    self.assertIsNotNone(bounds, (row, col))
                    bottoms.append(bounds[3])
        self.assertEqual(len(bottoms), 32)
        self.assertLessEqual(max(bottoms) - min(bottoms), 2)
        self.assertEqual(char["frame_pivot"], [64, 152])
        self.assertEqual(char["frame_count"], 32)

    def test_animation_resource_declares_four_frames_each_direction_and_action(self):
        text = (GODOT / "resources/animations/wayfarer_v1.tres").read_text(encoding="utf-8")
        for direction in ("se", "sw", "nw", "ne"):
            for action, fps in (("idle", "4.0"), ("walk", "8.0")):
                name = f"{action}_{direction}"
                marker = f'"name": &"{name}"'
                marker_pos = text.find(marker)
                self.assertNotEqual(marker_pos, -1, name)
                start = text.rfind('"frames": [{', 0, marker_pos)
                section = text[start:marker_pos]
                self.assertEqual(section.count('"texture": SubResource('), 4, name)
                speed = re.search(r'"speed": ([0-9.]+)', text[marker_pos:])
                self.assertIsNotNone(speed, name)
                self.assertEqual(speed.group(1), fps, name)

    def test_tileset_scene_and_review_script_exist(self):
        for relative in ("resources/tilesets/fimbria_art_demo.tres", "scenes/art_demo.tscn", "tools/review_art_g04.py"):
            self.assertTrue((GODOT / relative).is_file(), relative)
        self.assertEqual(len(list((GODOT / "reviews/g04").glob("*.png"))), 7)

    def test_demo_references_resolve_in_scene_and_tileset(self):
        scene = (GODOT / "scenes/art_demo.tscn").read_text(encoding="utf-8")
        tileset = (GODOT / "resources/tilesets/fimbria_art_demo.tres").read_text(encoding="utf-8")
        animations = (GODOT / "resources/animations/wayfarer_v1.tres").read_text(encoding="utf-8")
        for text in (scene, tileset, animations):
            for resource in set(__import__("re").findall(r'res://[^"\]]+', text)):
                self.assertTrue((GODOT / resource.removeprefix("res://")).exists(), resource)

if __name__ == "__main__":
    unittest.main(verbosity=2)
