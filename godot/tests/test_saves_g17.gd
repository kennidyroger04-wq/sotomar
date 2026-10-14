extends SceneTree

const MapCatalog = preload("res://scripts/map_catalog.gd")
const SaveState = preload("res://scripts/save_state_g17.gd")
var failures := 0
var prefix := "user://codex_g17_save_test"

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var map_ids := ["MAP_01", "MAP_02", "MAP_03", "MAP_04", "MAP_05", "MAP_06", "MAP_07", "MAP_08", "MAP_09", "MAP_10", "MAP_11"]
	var maps := {}
	for map_id: String in map_ids:
		maps[map_id] = MapCatalog.get_map(map_id)
	var item_file := FileAccess.open("res://resources/items/item_registry.json", FileAccess.READ)
	var item_registry: Dictionary = JSON.parse_string(item_file.get_as_text()).items
	var protagonists: Array[String] = ["character.warrior_male.g06", "character.wayfarer.g05"]
	var store = SaveState.new(maps, item_registry, protagonists, prefix, protagonists[1])
	var payload := _payload()
	var first := store.save(payload)
	_check(first.ok and first.generation == 1, "new game writes versioned save slot")
	var second_payload := payload.duplicate(true)
	second_payload.cell = {"x": 7, "y": 5}
	second_payload.inventory.QITEM_TUFO_PALIDO = 2
	var second := store.save(second_payload)
	_check(second.ok and second.generation == 2, "subsequent save advances journal generation")
	var loaded := store.load()
	_check(loaded.ok and loaded.payload.cell.x == 7 and loaded.payload.inventory.QITEM_TUFO_PALIDO == 2, "load restores latest location and inventory")
	var bad := payload.duplicate(true)
	bad.cell = {"x": -4, "y": -4}
	var after_bad := store.load()
	_check(not store.save(bad).ok and after_bad.get("payload", {}).get("cell", {}).get("x", -1) == 7, "invalid location cannot replace valid save")
	var export := store.export_json(payload)
	_check(export.ok and JSON.parse_string(export.text).schema_version == 1, "save exports a validated versioned JSON document")
	_check(not store.import_json("not json").ok, "invalid import is rejected")
	var imported := store.import_json(export.text)
	var imported_save := store.load()
	_check(imported.ok and imported_save.ok and imported_save.payload.cell.x == 5, "valid portable save imports through normal validation")
	var legacy := {"version": 2, "player": {"inventory": {"pocao_simples": 1}, "equipment": {"weapon": "espada_madeira"}, "stats": {"forca": 4}, "level": 2, "xp": 12, "xpNextLevel": 150}, "world": {"currentMapId": "MAP_01", "player": {"x": 5, "y": 5}}, "progression": {"quests": {}, "flags": {}, "currency": {"base": 13}}}
	var migrated := store.import_json(JSON.stringify(legacy))
	_check(migrated.ok and store.load().payload.progression.currency.base == 13 and store.load().payload.protagonist_id == protagonists[1] and FileAccess.file_exists("user://sotomar_save_migration_backup.json"), "legacy JavaScript Save V2 migrates with backup and preserves selected protagonist")
	var slot_a := FileAccess.open(prefix + "_a.json", FileAccess.WRITE)
	slot_a.store_string("{corrupt")
	slot_a.close()
	var recovered := store.load()
	_check(recovered.ok and recovered.payload.protagonist_id == protagonists[0], "corrupt newest slot falls back to prior valid journal slot")
	_cleanup()
	if failures == 0:
		print("G17 save-state tests passed")
		quit(0)
	else:
		push_error("%d G17 test(s) failed" % failures)
		quit(1)

func _payload() -> Dictionary:
	return {"schema_version": 1, "protagonist_id": "character.warrior_male.g06", "map_id": "MAP_01", "cell": {"x": 5, "y": 5}, "current_hp": 88, "stats": {"health": 100, "vitalidade": 0, "forca": 0, "inteligencia": 0, "agilidade": 0}, "inventory": {}, "equipment": {"weapon": ""}, "quests": {"states": {}, "processed_events": {}, "flags": {}}, "flags": {}, "encounters": {"schema_version": 1, "records": {}}, "progression": {"level": 1, "xp": 0, "xp_next_level": 100, "currency": {"base": 0}}, "claimed_rewards": {}, "arc_complete": false}

func _cleanup() -> void:
	for suffix: String in ["_a.json", "_b.json", "_a.json.tmp", "_b.json.tmp"]:
		var path := prefix + suffix
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	for path: String in ["user://sotomar_save_migration_backup.json", "user://sotomar_save_corrupt_backup.json"]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: " + label)
	else:
		failures += 1
		push_error("FAIL: " + label)
