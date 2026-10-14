extends RefCounted
class_name SaveStateG17

const SCHEMA_VERSION := 1
const SLOT_A := "user://sotomar_save_a.json"
const SLOT_B := "user://sotomar_save_b.json"
const LEGACY_BACKUP := "user://sotomar_save_migration_backup.json"
const CORRUPT_BACKUP := "user://sotomar_save_corrupt_backup.json"

var base_path := "user://sotomar_save"
var map_registry: Dictionary
var item_registry: Dictionary
var character_ids: Array[String]
var preferred_protagonist_id := ""
var generation := 0
var active_slot := -1

func _init(maps: Dictionary = {}, items: Dictionary = {}, protagonists: Array[String] = [], path_prefix := "user://sotomar_save", preferred_protagonist := "") -> void:
	map_registry = maps
	item_registry = items
	character_ids = protagonists
	base_path = path_prefix
	preferred_protagonist_id = preferred_protagonist

func save(payload: Dictionary) -> Dictionary:
	var clean := _normalize(payload)
	if not clean.ok:
		return clean
	var next_generation := generation + 1
	var target_index := next_generation % 2
	var target := _slot_path(target_index)
	var temporary := target + ".tmp"
	var body := JSON.stringify(_canonical(clean.payload))
	var envelope := {"generation": next_generation, "payload": clean.payload, "checksum": _sha256(body)}
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return {"ok": false, "reason": "OPEN_FAILED"}
	file.store_string(JSON.stringify(envelope))
	file.flush()
	var write_error := file.get_error()
	file.close()
	if write_error != OK:
		return {"ok": false, "reason": "WRITE_FAILED"}
	var absolute_temp := ProjectSettings.globalize_path(temporary)
	var absolute_target := ProjectSettings.globalize_path(target)
	if FileAccess.file_exists(target):
		DirAccess.remove_absolute(absolute_target)
	var rename_error := DirAccess.rename_absolute(absolute_temp, absolute_target)
	if rename_error != OK:
		return {"ok": false, "reason": "COMMIT_FAILED"}
	generation = next_generation
	active_slot = target_index
	return {"ok": true, "generation": generation, "payload": clean.payload}

func load() -> Dictionary:
	var candidates: Array[Dictionary] = []
	var corrupt: Array[String] = []
	var rejected: Array[String] = []
	for index in 2:
		var path := _slot_path(index)
		if not FileAccess.file_exists(path):
			continue
		var file := FileAccess.open(path, FileAccess.READ)
		if file == null:
			continue
		var raw := file.get_as_text()
		file.close()
		var parser := JSON.new()
		if parser.parse(raw) != OK or not parser.data is Dictionary:
			corrupt.append(raw)
			rejected.append("INVALID_ENVELOPE")
			continue
		var envelope: Dictionary = parser.data
		var payload: Dictionary = envelope.payload
		if String(envelope.get("checksum", "")) != _sha256(JSON.stringify(_canonical(payload))):
			corrupt.append(raw)
			rejected.append("CHECKSUM_MISMATCH")
			continue
		var normalized := _normalize(payload)
		if not normalized.ok:
			corrupt.append(raw)
			rejected.append(String(normalized.reason))
			continue
		candidates.append({"generation": int(envelope.get("generation", 0)), "slot": index, "payload": normalized.payload})
	if candidates.is_empty():
		if not corrupt.is_empty():
			_write_backup(CORRUPT_BACKUP, corrupt.back())
		return {"ok": false, "reason": "NO_VALID_SAVE", "rejections": rejected, "backup_created": not corrupt.is_empty()}
	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.generation) > int(b.generation))
	generation = int(candidates[0].generation)
	active_slot = int(candidates[0].slot)
	return {"ok": true, "generation": generation, "payload": candidates[0].payload}

func export_json(payload: Dictionary) -> Dictionary:
	var normalized := _normalize(payload)
	if not normalized.ok:
		return normalized
	return {"ok": true, "text": JSON.stringify({"schema_version": SCHEMA_VERSION, "payload": normalized.payload}, "\t")}

func import_json(raw: String) -> Dictionary:
	var parser := JSON.new()
	if parser.parse(raw) != OK or not parser.data is Dictionary:
		return {"ok": false, "reason": "INVALID_JSON"}
	var parsed: Dictionary = parser.data
	var payload: Dictionary
	var schema := int(parsed.get("schema_version", 0))
	if schema == SCHEMA_VERSION and parsed.get("payload", {}) is Dictionary:
		payload = parsed.payload
	elif int(parsed.get("version", 0)) == 2:
		var migration := _migrate_js_v2(parsed)
		if not migration.ok:
			return migration
		payload = migration.payload
		_write_backup(LEGACY_BACKUP, raw)
	else:
		return {"ok": false, "reason": "UNSUPPORTED_VERSION"}
	return save(payload)

func _migrate_js_v2(old: Dictionary) -> Dictionary:
	var player: Dictionary = old.get("player", {})
	var world: Dictionary = old.get("world", {})
	var progression: Dictionary = old.get("progression", {})
	var position: Dictionary = world.get("player", {})
	var quests: Dictionary = progression.get("quests", {})
	var flags: Dictionary = progression.get("flags", {})
	var currency: Dictionary = progression.get("currency", {})
	if character_ids.is_empty():
		return {"ok": false, "reason": "NO_PROTAGONIST_CATALOG"}
	var map_id := String(world.get("currentMapId", "MAP_01"))
	var cell := {"x": int(position.get("x", 0)), "y": int(position.get("y", 0))}
	if not map_registry.has(map_id):
		map_id = "MAP_01"
		cell = _default_cell(map_registry[map_id])
	elif _invalid_cell(map_registry[map_id], cell):
		cell = _default_cell(map_registry[map_id])
	var old_equipment: Dictionary = player.get("equipment", {})
	var migrated_equipment := {}
	for slot: String in old_equipment:
		migrated_equipment[slot] = "" if old_equipment[slot] == null else String(old_equipment[slot])
	var protagonist := preferred_protagonist_id if character_ids.has(preferred_protagonist_id) else character_ids[0]
	var migrated := {
		"schema_version": SCHEMA_VERSION,
		"protagonist_id": protagonist,
		"map_id": map_id,
		"cell": cell,
		"stats": player.get("stats", {}), "inventory": player.get("inventory", {}),
		"equipment": migrated_equipment, "quests": quests, "flags": flags,
		"current_hp": int(player.get("hp", 100)),
		"encounters": {}, "progression": {"level": int(player.get("level", 1)), "xp": int(player.get("xp", 0)), "xp_next_level": int(player.get("xpNextLevel", 100)), "currency": currency},
		"claimed_rewards": {}, "arc_complete": false
	}
	return _normalize(migrated)

func _normalize(source: Dictionary) -> Dictionary:
	if int(source.get("schema_version", 0)) != SCHEMA_VERSION:
		return {"ok": false, "reason": "UNSUPPORTED_VERSION"}
	var protagonist := String(source.get("protagonist_id", ""))
	if not character_ids.has(protagonist):
		return {"ok": false, "reason": "UNKNOWN_PROTAGONIST"}
	var map_id := String(source.get("map_id", ""))
	if not map_registry.has(map_id):
		return {"ok": false, "reason": "UNKNOWN_MAP"}
	var cell_data: Dictionary = source.get("cell", {})
	var cell := Vector2i(int(cell_data.get("x", -1)), int(cell_data.get("y", -1)))
	var map: Dictionary = map_registry[map_id]
	if cell.x < 0 or cell.y < 0 or cell.x >= int(map.get("width", 0)) or cell.y >= int(map.get("height", 0)) or _blocked(map, cell):
		return {"ok": false, "reason": "INVALID_CELL"}
	var inventory: Dictionary = source.get("inventory", {})
	for item_id: String in inventory:
		var count := int(inventory[item_id])
		if not item_registry.has(item_id) or count <= 0 or float(inventory[item_id]) != count:
			return {"ok": false, "reason": "INVALID_INVENTORY"}
	var equipment: Dictionary = source.get("equipment", {})
	for slot: String in equipment:
		var item_id := String(equipment[slot])
		if item_id.is_empty():
			continue
		if not item_registry.has(item_id):
			return {"ok": false, "reason": "INVALID_EQUIPMENT"}
		var item: Dictionary = item_registry[item_id]
		var item_slot := String(item.get("equip", {}).get("slot", item.get("canonicalSlot", "")))
		if item_slot != slot:
			return {"ok": false, "reason": "INVALID_EQUIPMENT_SLOT"}
	for key: String in ["stats", "quests", "flags", "encounters", "progression", "claimed_rewards"]:
		if not source.get(key, {}) is Dictionary:
			return {"ok": false, "reason": "INVALID_%s" % key.to_upper()}
	var stats: Dictionary = source.get("stats", {})
	var max_hp := maxi(1, int(stats.get("health", 100)))
	var current_hp := int(source.get("current_hp", max_hp))
	if current_hp < 0 or current_hp > max_hp or float(source.get("current_hp", max_hp)) != current_hp:
		return {"ok": false, "reason": "INVALID_HP"}
	var progression: Dictionary = source.get("progression", {})
	for key: String in ["level", "xp", "xp_next_level"]:
		var minimum := 1 if key in ["level", "xp_next_level"] else 0
		if int(progression.get(key, minimum)) < minimum:
			return {"ok": false, "reason": "INVALID_PROGRESSION"}
	var clean := source.duplicate(true)
	clean["cell"] = {"x": cell.x, "y": cell.y}
	clean["current_hp"] = current_hp
	clean["arc_complete"] = source.get("arc_complete", false) == true
	return {"ok": true, "payload": clean}

func _blocked(map: Dictionary, cell: Vector2i) -> bool:
	for entry: Dictionary in map.get("blocked_cells", []):
		if int(entry.x) == cell.x and int(entry.y) == cell.y:
			return true
	return false

func _invalid_cell(map: Dictionary, cell: Dictionary) -> bool:
	var point := Vector2i(int(cell.get("x", -1)), int(cell.get("y", -1)))
	return point.x < 0 or point.y < 0 or point.x >= int(map.get("width", 0)) or point.y >= int(map.get("height", 0)) or _blocked(map, point)

func _default_cell(map: Dictionary) -> Dictionary:
	var spawn: Dictionary = map.get("spawns", {}).get("SPAWN_DEFAULT", {"x": 6, "y": 5})
	return {"x": int(spawn.get("x", 6)), "y": int(spawn.get("y", 5))}

func _slot_path(index: int) -> String:
	if base_path == "user://sotomar_save":
		return SLOT_A if index == 0 else SLOT_B
	return "%s_%s.json" % [base_path, "a" if index == 0 else "b"]

func _sha256(text: String) -> String:
	var context := HashingContext.new()
	context.start(HashingContext.HASH_SHA256)
	context.update(text.to_utf8_buffer())
	return context.finish().hex_encode()

func _canonical(value: Variant) -> Variant:
	if value is float and is_finite(value) and is_equal_approx(value, float(int(value))):
		return int(value)
	if value is Dictionary:
		var result := {}
		for key: Variant in value:
			result[key] = _canonical(value[key])
		return result
	if value is Array:
		var result: Array = []
		for entry: Variant in value:
			result.append(_canonical(entry))
		return result
	return value

func _write_backup(path: String, text: String) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file != null:
		file.store_string(text)
		file.flush()
		file.close()
