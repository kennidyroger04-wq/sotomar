extends SceneTree

const Logic = preload("res://scripts/iso_board_logic.gd")
const TILE_COUNT := 23
const DIRECTIONS := ["se", "sw", "nw", "ne"]
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_tileset_and_tile_pngs()
	_test_props()
	_test_character_sheet_and_animations()
	await _test_demo_scene()
	if failures == 0:
		print("PASS: G03 art pack checks")
		quit(0)
	else:
		push_error("%d G03 art pack check(s) failed" % failures)
		quit(1)

func _test_tileset_and_tile_pngs() -> void:
	var tile_set := load("res://resources/tilesets/fimbria_art_demo.tres") as TileSet
	var valid := tile_set != null and tile_set.get_source_count() == TILE_COUNT and tile_set.tile_size == Vector2i(128, 64) and tile_set.tile_shape == TileSet.TILE_SHAPE_ISOMETRIC
	if valid:
		for source_id in TILE_COUNT:
			var source := tile_set.get_source(source_id) as TileSetAtlasSource
			var texture := source.texture if source != null else null
			var data := source.get_tile_data(Vector2i.ZERO, 0) if source != null else null
			if texture == null or texture.get_width() != 128 or texture.get_height() != 80 or not texture.get_image().detect_alpha() or data == null or data.texture_origin != Vector2i(0, -8):
				valid = false
				break
	_check(valid, "23 TileSet atlas sources load with 128x80 RGBA pixels, shared pivot and the existing 128x64 pitch")
	var metadata := JSON.parse_string(FileAccess.get_file_as_string("res://resources/art_pack_g03.json")) as Dictionary
	_check(not metadata.is_empty() and metadata.get("tiles", []).size() == TILE_COUNT, "art metadata lists each exported terrain, path and transition tile")
	var references_exist := not metadata.is_empty()
	for tile: Dictionary in metadata.get("tiles", []):
		references_exist = references_exist and FileAccess.file_exists(tile.get("path", "")) and FileAccess.file_exists(tile.get("editable_source", ""))
	for source: Dictionary in metadata.get("editable_raster_masters", []):
		references_exist = references_exist and FileAccess.file_exists(source.get("path", ""))
	for prop: Dictionary in metadata.get("props", {}).values():
		references_exist = references_exist and FileAccess.file_exists(prop.get("path", ""))
	references_exist = references_exist and FileAccess.file_exists(metadata.get("character", {}).get("path", ""))
	_check(references_exist, "all manifest links to editable master sheets and exported PNGs resolve")
	_check(ResourceLoader.load("res://scenes/art_demo.tscn") != null and ResourceLoader.load("res://resources/animations/wayfarer_v1.tres") != null, "demo scene and animation resource resolve without broken references")

func _test_props() -> void:
	var valid := true
	for prop_path in ["res://assets/props/g03/tree_mosswood.png", "res://assets/props/g03/rock_moss_stone.png"]:
		var image := Image.load_from_file(ProjectSettings.globalize_path(prop_path))
		if image == null or image.get_width() != 256 or image.get_height() != 288 or not image.detect_alpha():
			valid = false
			break
		var bounds := image.get_used_rect()
		if bounds.size == Vector2i.ZERO or abs(bounds.end.y - 280) > 1:
			valid = false
	var metadata := JSON.parse_string(FileAccess.get_file_as_string("res://resources/art_pack_g03.json")) as Dictionary
	var props: Dictionary = metadata.get("props", {})
	var tree_pivot: Array = props.get("tree_mosswood", {}).get("pivot", [])
	var rock_pivot: Array = props.get("rock_moss_stone", {}).get("pivot", [])
	valid = valid and tree_pivot.size() == 2 and rock_pivot.size() == 2
	if valid:
		valid = int(tree_pivot[0]) == 128 and int(tree_pivot[1]) == 280 and int(rock_pivot[0]) == 128 and int(rock_pivot[1]) == 280
	_check(valid, "tree and rock PNGs retain transparency and share a documented base pivot")

func _test_character_sheet_and_animations() -> void:
	var image := Image.load_from_file(ProjectSettings.globalize_path("res://assets/characters/wayfarer_v1/wayfarer_v1.png"))
	var frames := load("res://resources/animations/wayfarer_v1.tres") as SpriteFrames
	var valid := image != null and image.get_width() == 1024 and image.get_height() == 640 and image.detect_alpha() and frames != null
	var bottom_positions: Array[int] = []
	if valid:
		for row in 4:
			for column in 8:
				var rect := Rect2i(column * 128, row * 160, 128, 160)
				var frame_image := image.get_region(rect)
				var bbox := frame_image.get_used_rect()
				if bbox.size == Vector2i.ZERO:
					valid = false
				else:
					bottom_positions.append(bbox.end.y)
		for direction in DIRECTIONS:
			for action in ["idle", "walk"]:
				var animation := "%s_%s" % [action, direction]
				if not frames.has_animation(animation) or frames.get_frame_count(animation) != 4:
					valid = false
				elif frames.get_animation_speed(animation) != (4.0 if action == "idle" else 8.0):
					valid = false
	var aligned: bool = not bottom_positions.is_empty() and bottom_positions.max() - bottom_positions.min() <= 2
	_check(valid and bottom_positions.size() == 32 and aligned, "32 transparent character frames share the foot baseline and all eight 4-frame animations load")
	var metadata := JSON.parse_string(FileAccess.get_file_as_string("res://resources/art_pack_g03.json")) as Dictionary
	var character: Dictionary = metadata.get("character", {})
	var pivot: Array = character.get("frame_pivot", [])
	_check(pivot.size() == 2 and int(pivot[0]) == 64 and int(pivot[1]) == 152 and character.get("directions", []).size() == 4, "character animation metadata documents four views, frame size and common foot pivot")

func _test_demo_scene() -> void:
	var scene := (load("res://scenes/art_demo.tscn") as PackedScene).instantiate()
	root.add_child(scene)
	await process_frame
	var valid: bool = scene.terrain.get_used_cells().size() == 100 and scene.paths.get_used_cells().size() == 6 and scene.transitions.get_used_cells().size() == 5
	valid = valid and scene.decorations.get_child_count() == 2 and scene.actor.is_playing() and scene.actor.animation == "walk_se"
	valid = valid and scene.terrain.to_global(scene.terrain.map_to_local(Vector2i(4, 4))).is_equal_approx(scene.map_origin + Vector2(0, 128))
	for layer: TileMapLayer in [scene.terrain, scene.paths, scene.transitions]:
		for cell in [Vector2i.ZERO, Vector2i(1, 0), Vector2i(0, 1), Vector2i(9, 9)]:
			valid = valid and layer.to_global(layer.map_to_local(cell)).is_equal_approx(Logic.cell_to_screen(cell, scene.map_origin))
	var tree: Sprite2D = scene.decorations.get_node("Tree")
	var rock: Sprite2D = scene.decorations.get_node("Rock")
	valid = valid and tree.position == Logic.cell_to_screen(Vector2i(2, 4), scene.map_origin) and tree.z_index == 6
	valid = valid and rock.position == Logic.cell_to_screen(Vector2i(7, 4), scene.map_origin) and rock.z_index == 11
	valid = valid and scene.actor.position == Logic.cell_to_screen(Vector2i(4, 4), scene.map_origin) and scene.actor.z_index == 8 and scene.actor.scale == Vector2(0.5, 0.5)
	_check(valid, "demo preserves tilemap centers, prop/character foot pivots and logical depth while showing the 10x10 art pack")
	scene.queue_free()

func _check(condition: bool, description: String) -> void:
	if condition:
		print("PASS: ", description)
	else:
		failures += 1
		push_error("FAIL: " + description)
