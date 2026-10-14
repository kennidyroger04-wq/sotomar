extends RefCounted
class_name EncounterRegistryG11
## Godot adapter for the canonical encounter registry generated from JavaScript.

const REGISTRY_PATH := "res://resources/combat/encounter_registry.json"
const BOARD_WIDTH := 8
const BOARD_HEIGHT := 6
const DEFAULT_PLAYER_CELL := Vector2i(1, 2)
const DEFAULT_ENEMY_CELLS := [Vector2i(4, 3), Vector2i(6, 1), Vector2i(6, 3), Vector2i(7, 1)]

var _data: Dictionary = {}

func _init() -> void:
	var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
	if file == null:
		push_error("Encounter registry missing: " + REGISTRY_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		_data = parsed

func catalog() -> Dictionary:
	return _data.duplicate(true)

func encounter(encounter_id: String) -> Dictionary:
	return (_data.get("encounters", {}) as Dictionary).get(encounter_id, {}).duplicate(true)

func encounters_for_map(map_id: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for entry: Dictionary in _data.get("encounters", {}).values():
		if String(entry.map_id) == map_id:
			result.append(entry.duplicate(true))
	return result

func world_trigger_available(encounter_id: String) -> bool:
	var entry := encounter(encounter_id)
	return not entry.is_empty() and String(entry.get("godot_status", "")) == "PROVISIONAL_PLAYABLE"

## Builds combat participants from canonical composition, accepting explicit cells.
## When omitted, fallback cells are a temporary combat-board layout, not world canon.
func combat_definition(encounter_id: String, enemy_cells: Array[Vector2i] = [], player_cell := DEFAULT_PLAYER_CELL) -> Dictionary:
	var entry := encounter(encounter_id)
	if entry.is_empty():
		return {"ok": false, "reason": "UNKNOWN_ENCOUNTER", "encounter_id": encounter_id}
	var composition: Array = entry.get("composition", [])
	if composition.is_empty():
		return {"ok": false, "reason": "EMPTY_COMPOSITION", "encounter_id": encounter_id}
	if enemy_cells.size() > 0 and enemy_cells.size() != composition.size():
		return {"ok": false, "reason": "POSITION_COUNT", "encounter_id": encounter_id}
	var chosen_cells: Array[Vector2i] = []
	var occupied: Array[Vector2i] = [player_cell]
	for index in composition.size():
		var cell: Vector2i = enemy_cells[index] if enemy_cells.size() > 0 else DEFAULT_ENEMY_CELLS[index % DEFAULT_ENEMY_CELLS.size()]
		if not _inside(cell) or occupied.has(cell):
			return {"ok": false, "reason": "INVALID_OR_OCCUPIED_SPAWN", "index": index}
		occupied.append(cell)
		chosen_cells.append(cell)
	var enemies: Array[Dictionary] = []
	for index in composition.size():
		var member: Dictionary = composition[index]
		var stats: Dictionary = member.get("stats", {})
		var ability: Dictionary = member.get("ability", {})
		if stats.is_empty() or String(ability.get("id", "")) != "golpe" or String(ability.get("mechanics_status", "")) != "BASIC_EFFECTS_AVAILABLE":
			return {"ok": false, "reason": "UNSUPPORTED_CREATURE_MECHANICS", "creature_id": member.get("creature_id", "")}
		var cell := chosen_cells[index]
		enemies.append({
			"id": String(member.unit_id), "side": "mob", "canonical_id": String(member.creature_id),
			"name": String(member.name), "exposure": String(member.exposure), "x": cell.x, "y": cell.y,
			"hp": int(stats.hp), "max_hp": int(stats.hp), "pa": int(stats.pa), "max_pa": int(stats.pa),
			"pm": int(stats.pm), "max_pm": int(stats.pm), "strength": int(stats.strength),
			"agility": int(stats.agility), "physical_resistance": float(stats.physical_resistance),
			"magical_resistance": float(stats.magical_resistance), "damage_bonus": 0.0,
			"attack_ability_id": "golpe", "attack_ap": int(ability.ap_cost),
			"attack_damage_min": int(ability.damage[0]), "attack_damage_max": int(ability.damage[1]),
			"attack_range_min": int(ability.range_min), "attack_range_max": int(ability.range_max),
			"cooldowns": {}, "fortify_turns": 0, "fortify_cooldown": 0,
			"provisional_balance": stats.provisional_balance == true
		})
	return {
		"ok": true, "encounter_id": encounter_id, "map_id": String(entry.map_id),
		"canonical_status": String(entry.canonical_status), "godot_status": String(entry.godot_status),
		"runtime_policy": String(entry.runtime_policy), "composition": composition.duplicate(true),
		"enemies": enemies, "width": BOARD_WIDTH, "height": BOARD_HEIGHT,
		"blocked": [Vector2i(3, 2), Vector2i(4, 2), Vector2i(4, 4)],
		"player_cell": player_cell, "encounter_rewards": entry.get("encounter_rewards", []).duplicate(true),
		"quest_dependencies": entry.get("quest_dependencies", []).duplicate(true)
	}

func _inside(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < BOARD_WIDTH and cell.y < BOARD_HEIGHT
