#!/usr/bin/env python3
"""Technical integrity checks for the G18D deterministic sprite factory."""
import hashlib, json, unittest
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT.parent / "reports/g18d/sprite-factory-integrity.json"
DIRECTIONS = ["front", "left", "back", "right"]
ACTIONS = ["idle", "walk", "attack", "hurt", "defeat"]
SPECIES = [
 "cre_cascudo_de_cal", "cre_papa_mel", "cre_topetao", "cre_fiandeira",
 "cre_sapo_de_poca", "cre_lerdo_de_musgo", "cre_farejador_de_brejo"
]
NPCS = ["npc_lia", "npc_nilo", "npc_bram"]

class SpriteFactoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = json.loads(REPORT.read_text())

    def test_report_counts_all_656_distinct_visible_frames(self):
        self.assertEqual(self.report["total_frames"], 656)
        self.assertEqual(self.report["total_unique_frames"], 656)
        generated = {species["id"].lower(): species for species in self.report["species"]}
        for sid in SPECIES:
            species = generated[sid]
            self.assertEqual(species["unique"], 80, species["id"])
            self.assertEqual(species["duplicate_cycles"], [], species["id"])
            self.assertEqual(species["transparent"], [], species["id"])
            self.assertEqual(species["pivot_outliers"], [], species["id"])

    def test_each_species_has_editable_structured_source_and_complete_actions(self):
        families = set()
        silhouettes = set()
        for sid in SPECIES:
            spec_path = ROOT / "art/source/sprite_factory/specs" / f"{sid}.json"
            manifest_path = ROOT / "resources/art" / f"{sid}_g18d.json"
            spec = json.loads(spec_path.read_text())
            manifest = json.loads(manifest_path.read_text())
            families.add(spec["family"])
            self.assertEqual(manifest["frame_size"], [192, 224])
            self.assertEqual(manifest["pivot_feet"], [96, 214])
            self.assertEqual(set(manifest["actions"]), set(ACTIONS))
            for action in ACTIONS:
                source = ROOT / "art/source/sprite_factory/creatures" / sid / "frames" / action
                frame_hashes = []
                bottoms = []
                for direction in DIRECTIONS:
                    cycle = []
                    for frame in range(4):
                        path = source / f"{direction}_{frame:02d}.png"
                        im = Image.open(path).convert("RGBA")
                        self.assertEqual(im.size, (192, 224))
                        bbox = im.getchannel("A").getbbox()
                        self.assertIsNotNone(bbox, path)
                        self.assertLessEqual(abs((bbox[3] - 1) - 214), 19, path)
                        ground_alpha = im.getchannel("A").crop((0, 198, 192, 214))
                        self.assertGreaterEqual(sum(value > 200 for value in ground_alpha.get_flattened_data()), 5, f"visible body/paw pixels near pivot: {path}")
                        cycle.append(hashlib.sha1(im.tobytes()).hexdigest())
                        if action == "idle" and frame == 0 and direction == "front":
                            silhouettes.add(hashlib.sha1(im.tobytes()).hexdigest())
                    self.assertEqual(len(set(cycle)), 4, f"{sid}/{action}/{direction}")
                    frame_hashes.extend(cycle)
                self.assertEqual(len(set(frame_hashes)), 16, f"{sid}/{action}: directions/frames should be distinguishable")
            for action in ACTIONS:
                runtime = ROOT / "assets/characters" / f"{sid}_g18d" / f"{sid}_{action}.png"
                sheet = Image.open(runtime).convert("RGBA")
                self.assertEqual(sheet.size, (768, 896))
        self.assertGreaterEqual(len(families), 6)
        self.assertEqual(len(silhouettes), len(SPECIES), "species should not be palette-only variants")

    def test_all_seven_godot_spriteframes_resources_exist(self):
        board = (ROOT / "scripts/combat_board_g10.gd").read_text()
        for sid in SPECIES:
            self.assertTrue((ROOT / "resources/animations" / f"{sid}_g18d.tres").exists())
            self.assertIn(f'"{sid.upper()}"', board)
            self.assertIn(f"{sid}_g18d.tres", board)

    def test_three_npcs_have_two_directional_actions_and_keep_existing_world_markers(self):
        scene = (ROOT / "scripts/scenery_layer.gd").read_text()
        for npc in NPCS:
            spec = json.loads((ROOT / "art/source/sprite_factory/specs" / f"{npc}.json").read_text())
            manifest = json.loads((ROOT / "resources/art" / f"{npc}_g18d.json").read_text())
            self.assertEqual(spec["actions"], ["idle", "walk"])
            self.assertEqual(manifest["integrity"]["frame_count"], 32)
            self.assertEqual(manifest["integrity"]["unique_frame_count"], 32)
            self.assertEqual(manifest["integrity"]["duplicates"], [])
            self.assertEqual(manifest["integrity"]["transparent_frames"], [])
            self.assertEqual(manifest["integrity"]["pivot_outliers"], [])
            self.assertEqual(set(manifest["actions"]), {"idle", "walk"})
            self.assertTrue((ROOT / "resources/animations" / f"{npc}_g18d.tres").exists())
            self.assertIn(npc.removeprefix("npc_"), scene)
            for action in ["idle", "walk"]:
                for direction in DIRECTIONS:
                    paths = ROOT / "art/source/sprite_factory/creatures" / npc / "frames" / action
                    hashes = []
                    for frame in range(4):
                        path = paths / f"{direction}_{frame:02d}.png"
                        im = Image.open(path).convert("RGBA")
                        ground_alpha = im.getchannel("A").crop((0, 198, 192, 214))
                        self.assertGreaterEqual(sum(value > 200 for value in ground_alpha.get_flattened_data()), 5, f"NPC feet pivot {path}")
                        hashes.append(hashlib.sha1(im.tobytes()).hexdigest())
                    self.assertEqual(len(set(hashes)), 4, f"{npc}/{action}/{direction}")

if __name__ == "__main__":
    unittest.main(verbosity=2)
