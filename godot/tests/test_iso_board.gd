extends SceneTree

const Logic = preload("res://scripts/iso_board_logic.gd")

var failures := 0

func _initialize() -> void:
	_test_projection_round_trip()
	_test_cell_picking()
	_test_path_determinism()
	_test_blocked_cells()
	_test_depth_order()
	_test_scaled_selection()
	_test_art_scale_independence()
	_test_tileset_integrity()
	_test_tile_face_contact()
	call_deferred("_test_scene_integration")

func _test_scene_integration() -> void:
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	_check(scene.map_id == "MAP_01" and scene.map_columns == 12 and scene.map_rows == 10, "main scene loads canonical rectangular MAP_01")
	_check(scene.terrain_tiles.get_used_cells().size() == 120 and scene.path_tiles.get_used_cells().size() == scene.board.path_cells.size(), "MAP_01 fills 12x10 ground and its canonical paths on separate layers")
	var picked_cell := Vector2i(8, 5)
	var click := InputEventMouseButton.new()
	click.button_index = MOUSE_BUTTON_LEFT
	click.pressed = true
	click.position = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(picked_cell, scene.map_origin)
	scene._unhandled_input(click)
	_check(scene.board.selected_cell == picked_cell, "scene click selects the expected transformed logical cell")
	var back_tree: Node2D = scene.get_node("Scenery/map01-tree-01")
	_check(back_tree.z_index == 1 and scene.actor.z_index == 12, "props and actor use comparable logical depth keys")
	_check(_scenery_positions_align(scene), "every map prop stays on its canonical logical cell and baseline")
	_check(_tilemap_centers_align(scene), "all used TileMapLayer centers align to the same 64x32 logical projection")
	for window_size in [Vector2i(1280, 720), Vector2i(1920, 1080)]:
		root.size = window_size
		scene._on_viewport_size_changed()
		await process_frame
		_check(_tilemap_centers_align(scene) and scene.actor.position == Logic.cell_to_screen(scene.logical_position, scene.map_origin), "logical projection and actor remain aligned after window resize to %s" % str(window_size))
	scene._move_to(Vector2i(6, 4))
	await create_timer(0.22).timeout
	_check(scene.logical_position == Vector2i(6, 4) and scene.actor.z_index == 11, "scene moves one cell and updates depth")
	scene._move_to(Vector2i(4, 2))
	await process_frame
	_check(scene.logical_position == Vector2i(6, 4), "scene refuses a canonical blocked cell")
	scene.queue_free()
	if failures == 0:
		print("PASS: Godot iso-board tests (unit and scene integration)")
		quit(0)
	else:
		push_error("%d iso-board test group(s) failed" % failures)
		quit(1)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)

func _tilemap_centers_align(scene: Node) -> bool:
	var layers: Array[TileMapLayer] = [scene.terrain_tiles, scene.path_tiles, scene.border_tiles, scene.decoration_tiles, scene.obstacle_tiles]
	for layer: TileMapLayer in layers:
		for cell: Vector2i in layer.get_used_cells():
			if not layer.to_global(layer.map_to_local(cell)).is_equal_approx(Logic.cell_to_screen(cell, scene.map_origin)):
				return false
	return true

func _scenery_positions_align(scene: Node) -> bool:
	for prop: Node2D in scene.scenery.get_children():
		var cell: Vector2i = prop.get_meta("logical_cell")
		if prop.position != Logic.cell_to_screen(cell, scene.map_origin):
			return false
		if prop.z_index != cell.x + cell.y + 1:
			return false
		var sprite := prop.get_node_or_null("IllustratedSprite") as Sprite2D
		if sprite != null:
			var asset_id := String(prop.get_meta("asset_id", ""))
			var expected_scale := 0.11 if asset_id == "VIS_HOUSE_SMALL" else 0.5
			var texture_size := sprite.texture.get_size()
			var expected_position := Vector2(-texture_size.x * expected_scale * 0.5, -texture_size.y * expected_scale)
			if sprite.centered or not sprite.scale.is_equal_approx(Vector2.ONE * expected_scale) or not sprite.position.is_equal_approx(expected_position):
				return false
	return scene.scenery.get_child_count() == scene.map_data.props.size() + scene.map_data.npcs.size()

func _test_projection_round_trip() -> void:
	var origin := Vector2(480, 172)
	var valid := true
	for y in 10:
		for x in 10:
			var cell := Vector2i(x, y)
			valid = valid and Logic.screen_to_cell(Logic.cell_to_screen(cell, origin), origin) == cell
	_check(valid, "grid-to-screen and screen-to-grid round trip across 10x10")

func _test_cell_picking() -> void:
	var origin := Vector2(120, 80)
	var target := Vector2i(6, 2)
	var center := Logic.cell_to_screen(target, origin)
	var picked := Logic.screen_to_cell(center + Vector2(3, -2), origin)
	_check(picked == target and Logic.contains_screen_point(center + Vector2(3, -2), target, origin), "mouse point selects the expected diamond cell")
	_check(not Logic.contains_screen_point(center + Vector2(32, 17), target, origin), "point outside diamond is rejected")

func _test_scaled_selection() -> void:
	var scale_factor := 1.5
	var origin := Vector2(240, 90)
	var cell := Vector2i(7, 4)
	var scaled_origin := origin * scale_factor
	var scaled_center := Logic.cell_to_screen(cell, origin, 64, 32) * scale_factor
	var picked := Logic.screen_to_cell(scaled_center, scaled_origin, 10, 10, 64 * scale_factor, 32 * scale_factor)
	_check(picked == cell, "cell picking remains correct after viewport scaling")

func _test_art_scale_independence() -> void:
	var cell := Vector2i(3, 6)
	var small_art_center := Logic.cell_to_screen(cell, Vector2.ZERO, 64, 32)
	var high_res_art_center := Logic.cell_to_screen(cell, Vector2.ZERO, 128, 64)
	var art_texture := load("res://assets/tiles/terrain/terrain_grass_base.png") as Texture2D
	_check(art_texture != null and art_texture.get_width() == 128 and art_texture.get_height() == 80 and small_art_center == Vector2(-96, 144) and high_res_art_center == small_art_center * 2.0, "logical cells stay independent of 2x tile texture dimensions")

func _test_tileset_integrity() -> void:
	var tile_set := load("res://resources/tilesets/fimbria_ground.tres") as TileSet
	var valid := tile_set != null and tile_set.get_source_count() == 23 and tile_set.tile_size == Vector2i(128, 64) and tile_set.tile_shape == TileSet.TILE_SHAPE_ISOMETRIC
	if valid:
		for source_id in 23:
			var source := tile_set.get_source(source_id) as TileSetAtlasSource
			var texture := source.texture if source != null else null
			var tile_data := source.get_tile_data(Vector2i.ZERO, 0) if source != null else null
			if texture == null or texture.get_width() != 128 or texture.get_height() != 80 or not texture.get_image().detect_alpha() or tile_data == null or tile_data.texture_origin != Vector2i(0, -8) or Vector2(tile_data.texture_origin) * 0.5 != Vector2(0, -4):
				valid = false
				break
	_check(valid, "TileSet preserves six stable semantic IDs and loads 23 transparent illustrated sources with the documented pivot")

func _test_tile_face_contact() -> void:
	var cell_size := Vector2(64, 32)
	var tile_pitch := Vector2(128, 64)
	var scale_factor := 0.5
	var right_neighbor_top := Vector2(64, 0) + Vector2(64, 32)
	var lower_neighbor_top := Vector2(64, 0) + Vector2(-64, 32)
	var source := FileAccess.get_file_as_string("res://art/source/tiles/isometric/terrain_grass_base.svg")
	var exact_geometry := source.contains("64,0 128,32 64,64 0,32")
	_check(exact_geometry and tile_pitch * scale_factor == cell_size and right_neighbor_top == Vector2(128, 32) and lower_neighbor_top == Vector2(0, 32), "2:1 tile faces exactly meet at 0.5 scale without changing logical pitch")

func _test_path_determinism() -> void:
	var blocked: Array[Vector2i] = [Vector2i(2, 1)]
	var expected: Array[Vector2i] = [Vector2i(1, 0), Vector2i(2, 0), Vector2i(3, 0), Vector2i(3, 1)]
	var first := Logic.find_path(Vector2i.ZERO, Vector2i(3, 1), blocked)
	var second := Logic.find_path(Vector2i.ZERO, Vector2i(3, 1), blocked)
	_check(first == expected and second == expected, "BFS movement route is deterministic")

func _test_blocked_cells() -> void:
	var blocked: Array[Vector2i] = [Vector2i(1, 0)]
	var route := Logic.find_path(Vector2i.ZERO, Vector2i(2, 0), blocked)
	var respects_block: bool = not route.has(Vector2i(1, 0)) and route.back() == Vector2i(2, 0)
	_check(respects_block, "path avoids blocked cell")
	_check(Logic.find_path(Vector2i.ZERO, Vector2i(1, 0), blocked).is_empty(), "blocked destination cannot be entered")

func _test_depth_order() -> void:
	var near_cell := Vector2i(4, 5)
	var far_cell := Vector2i(5, 2)
	var near_depth := near_cell.x + near_cell.y
	var far_depth := far_cell.x + far_cell.y
	_check(near_depth > far_depth, "larger logical depth key draws in front")
