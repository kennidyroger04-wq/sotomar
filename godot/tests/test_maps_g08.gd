extends SceneTree

const Logic = preload("res://scripts/iso_board_logic.gd")
const MapCatalog = preload("res://scripts/map_catalog.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_rectangular_logic()
	_test_original_map_data()
	await _test_playable_integration()
	if failures == 0:
		print("PASS: G08 variable maps, MAP_01/MAP_02 integration, assets, portals and camera")
		quit(0)
	else:
		push_error("%d G08 map integration check(s) failed" % failures)
		quit(1)

func _test_rectangular_logic() -> void:
	var blocked: Array[Vector2i] = [Vector2i(4, 3)]
	var path := Logic.find_path(Vector2i(1, 1), Vector2i(8, 5), blocked, 12, 7)
	var outside := Logic.find_path(Vector2i(1, 1), Vector2i(12, 5), blocked, 12, 7)
	var selected := Vector2i(11, 6)
	var projected := Logic.cell_to_screen(selected, Vector2(90, 40))
	var selected_back := Logic.screen_to_cell(projected, Vector2(90, 40), 12, 7)
	_check(Logic.is_inside(selected, 12, 7) and not Logic.is_inside(Vector2i(3, 7), 12, 7), "rectangular dimensions bound valid cells independently")
	_check(not path.is_empty() and path.back() == Vector2i(8, 5) and not path.has(Vector2i(4, 3)) and outside.is_empty(), "rectangular pathfinding is deterministic, bounded and obstacle aware")
	_check(selected_back == selected, "rectangular selection round trips at the far map edge")

func _test_original_map_data() -> void:
	var caieira := MapCatalog.get_map("MAP_01")
	var rocas := MapCatalog.get_map("MAP_02")
	var trilha := MapCatalog.get_map("MAP_04")
	_check(caieira.get("width") == 12 and caieira.get("height") == 10 and caieira.get("name") == "Caieira", "MAP_01 dimensions and name match the original visual map")
	_check(rocas.get("width") == 12 and rocas.get("height") == 9 and rocas.get("name") == "Terraços das Roças", "MAP_02 dimensions and name match the original visual map")
	_check(trilha.get("width") == 12 and trilha.get("height") == 9 and trilha.get("name") == "Trilha do Lenhador", "MAP_04 Carroçal destination uses its original 12x9 visual layout")
	_check(Vector2i(int(caieira.spawns.SPAWN_DEFAULT.x), int(caieira.spawns.SPAWN_DEFAULT.y)) == Vector2i(6, 5) and Vector2i(int(rocas.spawns.SPAWN_DEFAULT.x), int(rocas.spawns.SPAWN_DEFAULT.y)) == Vector2i(6, 4), "canonical default spawns are retained")
	_check(_has_exit(caieira, "EXIT_MAP01_MAP02", "MAP_02", Vector2i(11, 5), Vector2i(1, 4)) and _has_exit(rocas, "EXIT_MAP02_MAP01", "MAP_01", Vector2i(0, 4), Vector2i(10, 5)), "stable bidirectional MAP_01/MAP_02 portal IDs and entry cells are retained")
	_check(_has_exit(caieira, "EXIT_CARROCAL", "MAP_04", Vector2i(6, 9), Vector2i(6, 1)) and _has_exit(trilha, "EXIT_MAP04_MAP01", "MAP_01", Vector2i(6, 0), Vector2i(6, 8)), "canonical Carroçal portals retain IDs, targets and original entry cells")
	_check(caieira.blocked_cells.size() == 23 and rocas.blocked_cells.size() == 20 and trilha.blocked_cells.size() == 33, "canonical collision sets remain intact")
	_check(caieira.npcs.size() == 4 and caieira.npcs[0].id == "guarda_mira" and Vector2i(int(caieira.npcs[0].x), int(caieira.npcs[0].y)) == Vector2i(1, 1), "all four original MAP_01 NPC IDs and positions are carried into the adapter")

func _has_exit(map_data: Dictionary, exit_id: String, target_id: String, cell: Vector2i, target_cell: Vector2i) -> bool:
	for exit_data: Dictionary in map_data.exits:
		if String(exit_data.id) == exit_id:
			return String(exit_data.to) == target_id and Vector2i(int(exit_data.x), int(exit_data.y)) == cell and Vector2i(int(exit_data.target_position.x), int(exit_data.target_position.y)) == target_cell
	return false

func _test_playable_integration() -> void:
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	var roster: Node = root.get_node("CharacterRoster")
	var original_character: String = String(roster.get("selected_id"))
	roster.set_selected("character.wayfarer.g05", false)
	_check(scene.map_id == "MAP_01" and scene.logical_position == Vector2i(6, 5) and scene.terrain_tiles.get_used_cells().size() == 120, "normal game scene starts on the illustrated 12x10 MAP_01")
	_check(scene.terrain_tiles.tile_set.get_source_count() == 23 and scene.terrain_tiles.tile_set.get_source(0).texture.resource_path.ends_with("g03/grass_meadow.png"), "main ground uses the G03 tile library while stable IDs 0-5 remain available")
	_check(scene.scenery.get_child_count() == scene.map_data.props.size() + 4 and scene.scenery.find_child("map01-tree-01", true, false).get_node_or_null("IllustratedSprite") != null and scene.scenery.get_node("NPC_guarda_mira").get_meta("visual_status") == "placeholder", "illustrated props and four canonical, identified NPC placeholders appear at their source positions")
	_check(scene.board.blocked_cells.has(Vector2i(11, 0)) and not Logic.find_path(scene.logical_position, Vector2i(11, 0), scene.board.blocked_cells, 12, 10), "water and props declared blocked cannot be traversed")
	var outer_cell := Vector2i(11, 9)
	var screen_pos: Vector2 = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(outer_cell, scene.map_origin)
	_check(scene._screen_to_cell(screen_pos) == outer_cell, "selection works at the far edge of the enlarged MAP_01")
	scene.camera.zoom = Vector2(2.0, 2.0)
	scene.camera.position = Vector2.ZERO
	scene._follow_actor_if_needed()
	_check(scene.camera.position.is_equal_approx(scene.actor.position), "camera follows the actor when the full map no longer fits at readable zoom")
	scene.camera.position = Vector2(10000, 10000)
	scene._clamp_camera()
	_check(scene.camera.position.x < 10000 and scene.camera.position.y < 10000, "camera remains inside the active map bounds")
	var east_exit: Dictionary = _find_exit(scene.map_data, "EXIT_MAP01_MAP02")
	scene._enter_exit(east_exit)
	await process_frame
	_check(scene.map_id == "MAP_02" and scene.logical_position == Vector2i(1, 4) and scene.terrain_tiles.get_used_cells().size() == 108, "portal loads the second original area and its own 12x9 tile layers")
	_check(roster.selected_id == "character.wayfarer.g05", "transition preserves selected protagonist")
	var west_exit: Dictionary = _find_exit(scene.map_data, "EXIT_MAP02_MAP01")
	scene._enter_exit(west_exit)
	await process_frame
	_check(scene.map_id == "MAP_01" and scene.logical_position == Vector2i(10, 5), "return portal restores MAP_01 at the canonical entry cell")
	var carrocal_exit: Dictionary = _find_exit(scene.map_data, "EXIT_CARROCAL")
	scene._enter_exit(carrocal_exit)
	await process_frame
	_check(scene.map_id == "MAP_04" and scene.logical_position == Vector2i(6, 1) and scene.terrain_tiles.get_used_cells().size() == 108, "canonical Carroçal portal loads the illustrated Trilha do Lenhador")
	_check(scene.scenery.get_child_count() == scene.map_data.props.size() and scene.scenery.get_child_count() == 33, "MAP_04 retains its existing forest prop layout")
	var return_to_caieira: Dictionary = _find_exit(scene.map_data, "EXIT_MAP04_MAP01")
	scene._enter_exit(return_to_caieira)
	await process_frame
	_check(scene.map_id == "MAP_01" and scene.logical_position == Vector2i(6, 8), "MAP_04 return portal restores its canonical MAP_01 entry cell")
	scene.map_id = "MAP_04"
	scene.map_data = MapCatalog.get_map("MAP_04")
	var map05_exit: Dictionary = _find_exit(scene.map_data, "EXIT_MAP04_MAP05")
	scene._enter_exit(map05_exit)
	await process_frame
	_check(scene.map_id == "MAP_05" and scene.logical_position == Vector2i(1, 4) and scene.terrain_tiles.get_used_cells().size() == 90, "MAP_04 portal loads the original MAP_05 layout")
	var gated_exit: Dictionary = _find_exit(scene.map_data, "EXIT_ESCADA_MARCO_PRUMO")
	scene._enter_exit(gated_exit)
	_check(scene.map_id == "MAP_05" and scene._last_notice.contains("FLAG_ESCADA_MARCO_PRUMO_UNLOCKED"), "MAP_05 to MAP_07 gate remains closed without its canonical flag")
	scene.set_world_flag("FLAG_ESCADA_MARCO_PRUMO_UNLOCKED")
	scene._enter_exit(gated_exit)
	await process_frame
	_check(scene.map_id == "MAP_07" and scene.logical_position == Vector2i(1, 5) and scene.terrain_tiles.get_used_cells().size() == 120, "canonical flag opens the MAP_07 passage")
	var map08_exit: Dictionary = _find_exit(scene.map_data, "EXIT_MAP07_MAP08")
	scene._enter_exit(map08_exit)
	await process_frame
	_check(scene.map_id == "MAP_08" and scene.terrain_tiles.get_used_cells().size() == 80, "MAP_07 portal loads variable-sized MAP_08")
	var return_map07: Dictionary = _find_exit(scene.map_data, "EXIT_MAP08_MAP07")
	scene._enter_exit(return_map07)
	await process_frame
	var onward_exit: Dictionary = _find_exit(scene.map_data, "EXIT_MAP07_MAP08")
	var map08_data: Dictionary = MapCatalog.get_map("MAP_08")
	scene.map_id = "MAP_08"
	scene.map_data = map08_data
	scene._enter_exit(_find_exit(map08_data, "EXIT_MAP08_MAP10"))
	await process_frame
	_check(scene.map_id == "MAP_10" and scene.terrain_tiles.get_used_cells().size() == 90, "MAP_08 portal loads MAP_10 through the authored route")
	scene._enter_exit(_find_exit(scene.map_data, "EXIT_MAP10_MAP11"))
	await process_frame
	_check(scene.map_id == "MAP_11" and scene.terrain_tiles.get_used_cells().size() == 120, "MAP_10 portal loads MAP_11")
	var return_map10: Dictionary = _find_exit(scene.map_data, "EXIT_MAP11_MAP10")
	scene._enter_exit(return_map10)
	await process_frame
	_check(scene.map_id == "MAP_10" and scene.logical_position == Vector2i(8, 4), "MAP_11 return portal restores its authored MAP_10 spawn")
	roster.set_selected(original_character, false)
	scene.queue_free()
	await process_frame

func _find_exit(map_data: Dictionary, exit_id: String) -> Dictionary:
	for exit_data: Dictionary in map_data.exits:
		if String(exit_data.id) == exit_id:
			return exit_data
	return {}

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
