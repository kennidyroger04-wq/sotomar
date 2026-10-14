"""Fast structural checks for a Godot Web export produced by the G07 preset."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "build" / "web"


class WebExportTests(unittest.TestCase):
    def test_export_contains_the_complete_web_runtime(self):
        expected = [
            "index.html",
            "index.js",
            "index.wasm",
            "index.pck",
            "index.audio.worklet.js",
            "index.audio.position.worklet.js",
        ]
        for name in expected:
            with self.subTest(file=name):
                self.assertTrue((BUILD / name).is_file(), f"missing {BUILD / name}")

    def test_wasm_and_resource_pack_have_valid_signatures_and_size(self):
        wasm = (BUILD / "index.wasm").read_bytes()
        pack = (BUILD / "index.pck").read_bytes()
        self.assertEqual(wasm[:4], b"\0asm")
        self.assertEqual(pack[:4], b"GDPC")
        self.assertGreater(len(wasm), 1_000_000)
        self.assertGreater(len(pack), 100_000)

    def test_export_is_single_thread_web_and_uses_godot_storage(self):
        preset = (ROOT / "godot" / "export_presets.cfg").read_text()
        project = (ROOT / "godot" / "project.godot").read_text()
        roster = (ROOT / "godot" / "scripts" / "characters" / "character_roster.gd").read_text()
        html = (BUILD / "index.html").read_text()
        self.assertIn('platform="Web"', preset)
        self.assertIn("variant/thread_support=false", preset)
        self.assertIn('renderer/rendering_method="gl_compatibility"', project)
        self.assertIn('window/stretch/aspect.web="expand"', project)
        self.assertIn("pointing/emulate_mouse_from_touch=true", project)
        self.assertIn('user://character_selection.cfg', roster)
        self.assertIn('"index.pck"', html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
