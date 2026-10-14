#!/usr/bin/env python3
"""Renderer-independent integrity checks for G05 PNG sheets and metadata."""
import json
import unittest
from pathlib import Path
from PIL import Image
GODOT=Path(__file__).resolve().parents[1]
META=json.loads((GODOT/"resources/combat/combat_art_g05.json").read_text(encoding="utf-8"))

def resource(path): return GODOT/path.removeprefix("res://")

class G05ImageTests(unittest.TestCase):
    def test_character_actions_have_four_directions_and_four_frame_sheets(self):
        self.assertEqual(len(META["characters"]["wayfarer"]["actions"]),5)
        self.assertEqual(len(META["characters"]["moss_raider"]["actions"]),5)
        for character in ("wayfarer","moss_raider"):
            for action,data in META["characters"][character]["actions"].items():
                self.assertEqual(data["directions"],["se","sw","nw","ne"])
                self.assertEqual(data["frame_size"],[128,160])
                self.assertEqual(data["pivot"],[64,152])
                self.assertGreater(data["fps"],0)
                self.assertEqual(len(data["frames"]),16)
                path=resource(data["path"])
                self.assertTrue(path.is_file(),path)
                with Image.open(path) as image:
                    self.assertEqual(image.size,(512,640),path.name)
                    self.assertEqual(image.mode,"RGBA",path.name)
                    alpha=image.getchannel("A")
                    for row in range(4):
                        for col in range(4):
                            bbox=alpha.crop((col*128,row*160,(col+1)*128,(row+1)*160)).getbbox()
                            self.assertIsNotNone(bbox,(path.name,row,col))
                            self.assertLessEqual(abs(bbox[3]-152),1,(path.name,row,col))

    def test_g03_base_sheet_is_not_modified_or_replaced(self):
        way=META["characters"]["wayfarer"]
        self.assertEqual(way["base_sheet"],"res://assets/characters/wayfarer_v1/wayfarer_v1.png")
        self.assertTrue(resource(way["base_sheet"]).is_file())
        for action in ("idle","walk"):
            self.assertIn(action,way["existing_actions"])
            self.assertTrue(resource(way["existing_actions"][action]["path"]).is_file())

    def test_equipment_layers_are_separate_alpha_atlases(self):
        self.assertEqual(set(META["equipment"]),{"sword","shield"})
        for slot,data in META["equipment"].items():
            path=resource(data["path"])
            with Image.open(path) as image:
                self.assertEqual(image.size,(512,160))
                self.assertEqual(image.mode,"RGBA")
                alpha=image.getchannel("A")
                for col in range(4):
                    self.assertIsNotNone(alpha.crop((col*128,0,(col+1)*128,160)).getbbox(),(slot,col))
            self.assertEqual([pose["direction"] for pose in data["poses"]],["se","sw","nw","ne"])

    def test_event_frames_fit_four_frame_actions_and_effect_ids_exist(self):
        for event in META["impact_events"].values():
            self.assertGreaterEqual(event["frame"],0)
            self.assertLess(event["frame"],4)
        self.assertEqual(set(META["effect_ids"]),{"physical_slash","impact","shield_block","damage_flash","defeat_marker","spell_release"})

    def test_generated_masters_and_previous_death_source_are_preserved(self):
        sources=sorted((GODOT/"art/source/generated_g05").glob("*.png"))
        self.assertEqual(len(sources),12)
        for path in sources:
            with Image.open(path) as image:
                self.assertEqual(image.mode,"RGBA",path.name)
                self.assertIsNotNone(image.getchannel("A").getbbox(),path.name)
        self.assertTrue((GODOT/"art/source/generated_g05/wayfarer_death_master.png").is_file())
        self.assertTrue((GODOT/"art/source/generated_g05/wayfarer_death_master_v2.png").is_file())

    def test_review_boards_and_gifs_exist(self):
        index=json.loads((GODOT/"reviews/g05/review_index.json").read_text(encoding="utf-8"))
        self.assertEqual(len(index["boards"]),6)
        self.assertEqual(len(index["gifs"]),4)
        for path in index["boards"]+index["gifs"]: self.assertTrue((GODOT/path).is_file(),path)

if __name__=="__main__": unittest.main(verbosity=2)
