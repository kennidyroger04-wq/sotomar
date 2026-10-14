extends SceneTree

const Logic = preload("res://scripts/iso_board_logic.gd")
const SIZES := [Vector2i(16, 16), Vector2i(24, 20), Vector2i(30, 24), Vector2i(40, 40)]

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	var results: Array[Dictionary] = []
	for size: Vector2i in SIZES:
		var benchmark_id := "STRESS_40x40" if size == Vector2i(40, 40) else "BENCH_%dx%d" % [size.x, size.y]
		scene.map_id = benchmark_id
		scene.map_data = {
			"id": benchmark_id,
			"name": "Benchmark",
			"width": size.x,
			"height": size.y,
			"base_floor_asset_id": "VIS_GRASS_BASE",
			"floor_overrides": [],
			"blocked_cells": [],
			"props": [],
			"exits": [],
		}
		var started := Time.get_ticks_usec()
		scene._load_map_visuals()
		var construction_ms := float(Time.get_ticks_usec() - started) / 1000.0
		await process_frame
		var path_started := Time.get_ticks_usec()
		var route: Array[Vector2i] = Logic.find_path(Vector2i.ZERO, size - Vector2i.ONE, [], size.x, size.y)
		var path_ms := float(Time.get_ticks_usec() - path_started) / 1000.0
		var cells: int = scene.terrain_tiles.get_used_cells().size()
		var passed: bool = cells == size.x * size.y and route.size() == size.x + size.y - 2 and route.back() == size - Vector2i.ONE
		print("G08_BENCH ", JSON.stringify({
			"map": benchmark_id,
			"width": size.x,
			"height": size.y,
			"cells": cells,
			"terrain_build_ms": construction_ms,
			"path_ms": path_ms,
			"path_cells": route.size(),
			"memory_static_bytes": int(Performance.get_monitor(Performance.MEMORY_STATIC)),
			"fps_headless": int(Performance.get_monitor(Performance.TIME_FPS)),
			"passed": passed,
		}))
		if not passed:
			push_error("Map size benchmark scenario failed: " + benchmark_id)
			quit(1)
			return
	scene.queue_free()
	print("PASS: 16x16, 24x20, 30x24 scenarios and 40x40 stress scenario")
	quit(0)
