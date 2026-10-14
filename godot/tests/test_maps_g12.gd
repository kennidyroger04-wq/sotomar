extends SceneTree

const MapCatalog = preload("res://scripts/map_catalog.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	for map_id: String in ["MAP_01", "MAP_02", "MAP_03", "MAP_04", "MAP_05", "MAP_06", "MAP_07", "MAP_08", "MAP_09", "MAP_10", "MAP_11"]:
		var data := MapCatalog.get_map(map_id)
		_check(not data.is_empty(), "%s is available from the shared map catalog" % map_id)
		scene.map_id = map_id
		scene.map_data = data
		var spawn: Dictionary = data.spawns.get("SPAWN_DEFAULT", {"x": 0, "y": 0})
		scene.logical_position = Vector2i(int(spawn.x), int(spawn.y))
		scene._load_map_visuals()
		scene._layout_viewport()
		await process_frame
		_check(scene.terrain_tiles.get_used_cells().size() == int(data.width) * int(data.height), "%s renders all variable-size terrain cells" % map_id)
		_check(scene.scenery.get_child_count() == data.props.size() + data.npcs.size(), "%s renders its sourced props and NPCs" % map_id)
		for cell: Dictionary in data.blocked_cells:
			_check(scene.board.blocked_cells.has(Vector2i(int(cell.x), int(cell.y))), "%s retains blocked cell %s,%s" % [map_id, cell.x, cell.y])
		_check(data.exits.size() == 0 or scene.board.portal_cells.size() == data.exits.size(), "%s only draws authored portals" % map_id)
	_check(MapCatalog.get_map("MAP_03").exits.is_empty() and MapCatalog.get_map("MAP_09").exits.is_empty(), "maps without source exits remain renderable without invented navigation")
	scene.queue_free()
	await process_frame
	if failures == 0:
		print("PASS: G12 all 11 canonical maps render on the shared main scene")
		quit(0)
	else:
		push_error("%d G12 rendering check(s) failed" % failures)
		quit(1)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
