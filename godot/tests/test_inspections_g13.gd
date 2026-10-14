extends SceneTree

const MapCatalog = preload("res://scripts/map_catalog.gd")
const InspectionCatalog = preload("res://scripts/inspection_catalog_g13.gd")
const QuestState = preload("res://scripts/quest_progress_state_g13.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var catalog = InspectionCatalog.new()
	var map_registry := {}
	for map_id: String in ["MAP_01", "MAP_02", "MAP_03", "MAP_04", "MAP_05", "MAP_06", "MAP_07", "MAP_08", "MAP_09", "MAP_10", "MAP_11"]:
		map_registry[map_id] = MapCatalog.get_map(map_id)
	_check(catalog.validate(map_registry).is_empty(), "all source inspection points are in bounds, walkable and distinct from spawns and exits")
	var points := catalog.points_for_map("MAP_02")
	_check(points.size() == 1 and points[0].id == "POINT_TUFO_PALIDO" and points[0].position_status == "PROVISIONAL_LOGICAL", "MAP_02 marker identifies the canonical item and discloses its provisional position")
	var state = QuestState.new()
	var first := state.record_inspection(points[0])
	var second := state.record_inspection(points[0])
	_check(first.accepted and second.reason == "ALREADY_INSPECTED", "inspection event is one-time and idempotent")
	_check(state.pending_item_claims().size() == 1 and state.pending_item_claims()[0].item_id == "QITEM_TUFO_PALIDO", "inspection queues its sourced canonical item for a G14 transaction")
	_check(state.progress("MAIN_02", "main02_tufo") == 0, "COLLECT objective waits for item transaction instead of granting inventory early")
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	scene.map_id = "MAP_02"
	scene.map_data = MapCatalog.get_map("MAP_02")
	scene.logical_position = Vector2i(1, 2)
	scene._load_map_visuals()
	_check(scene.inspect_button.visible and scene.inspect_button.text.contains("posição provisória"), "nearby point exposes a clear mobile action and provisional-position notice")
	scene._inspect_nearest_point()
	_check(scene._quest_state.is_point_inspected("POINT_TUFO_PALIDO") and scene._inventory_state.has("QITEM_TUFO_PALIDO"), "exploration controller commits the canonical item to inventory")
	_check(scene._quest_state.pending_item_claims()[0].status == "COMMITTED", "COLLECT handoff follows the successful inventory transaction")
	_check(scene.inventory_button.text == "Mochila · 1", "touch inventory button reflects the collected item")
	scene.queue_free()
	await process_frame
	if failures == 0:
		print("PASS: G13 inspection catalog, provisional positions, mobile interaction and pending item handoff")
		quit(0)
	else:
		push_error("%d G13 inspection check(s) failed" % failures)
		quit(1)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
