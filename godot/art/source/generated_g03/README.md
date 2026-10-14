# G03 master artwork

These four lossless PNG master sheets are original illustrated artwork generated specifically for Sotomar/Fímbria and retained as editable raster sources. They are not resources from Dofus or another game. Use Krita, GIMP, or another raster editor to revise them; the deterministic crop/export step is `godot/tools/build_art_pack.py`.

| Master | Layout | Used for |
|---|---|---|
| `terrain_materials_master.png` | 5×3 concept atlas | 3 grass, 2 earth, 2 stone and 3 water tiles. Two additional path-like cells are reference only. |
| `paths_master.png` | 3×2 atlas | 5 path variants (center, two straights, bend and cross). The sixth piece is not exported in this pack. |
| `transitions_master.png` | 4×2 atlas | Five grass/earth transitions, two water shores and one earth cliff edge. |
| `props_master.png` | 2 isolated objects | Mosswood tree and planted stone outcrop. |
| `wayfarer_character_master.png` | 8×4 frames | Four directions; first four columns idle, last four walk. |

The master atlas pixels remain the editable illustration source. Cropped game PNGs are normalized to fixed cells by the exporter, so modifications should be made in the master and re-exported. The source images are raster paintings, therefore no fake vector/SVG version is included.

Quality stage: **ART PROTOTYPE — pending desktop visual review**. Technical dimensions and transparency are validated separately; the art is not declared final or approved.
