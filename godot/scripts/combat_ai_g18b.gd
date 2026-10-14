extends RefCounted
class_name CombatAIG18B
## Deterministic role/ability planner ported from js/systems/combat-ai.js.

const Rules = preload("res://scripts/combat_rules_g10.gd")
const EffectsScript = preload("res://scripts/combat_effects_g18b.gd")

var effects: CombatEffectsG18B

func _init(engine: CombatEffectsG18B = null) -> void:
	effects = engine if engine != null else EffectsScript.new()

func role_of(ability_data: Dictionary) -> String:
	for effect: Dictionary in ability_data.get("effects", []):
		if String(effect.get("type", "")) in ["HEAL", "BUFF"]:
			return "SUPPORT"
	for effect: Dictionary in ability_data.get("effects", []):
		if String(effect.get("type", "")) in ["DEBUFF", "STATUS"]:
			return "CONTROL"
	for effect: Dictionary in ability_data.get("effects", []):
		if String(effect.get("type", "")) == "DAMAGE":
			return "DAMAGE"
	return "OTHER"

func policy_for_profile(profile: String) -> String:
	match profile:
		"melee", "pack":
			return "MELEE"
		"ranged_control":
			return "RANGED"
		"control":
			return "CONTROL"
		"support":
			return "SUPPORT"
		"special_deferred", "boss_reference_only":
			return "DEFERRED"
		_:
			return "AUTO"

func choose_ability(state: Dictionary, actor: Dictionary, ability_ids: Array[String]) -> Dictionary:
	if not effects.alive(actor):
		return {"ok": false, "reason": "DEAD"}
	var policy := policy_for_profile(String(actor.get("ai_profile", "")))
	if policy == "DEFERRED":
		return {"ok": false, "reason": "PROFILE_DEFERRED"}
	var priorities := ["SUPPORT", "CONTROL", "DAMAGE", "OTHER"] if policy == "AUTO" else [policy]
	for role: String in priorities:
		var plans: Array[Dictionary] = []
		for ability_id: String in ability_ids:
			var ability_data := effects.ability(ability_id)
			if ability_data.is_empty() or (role not in ["MELEE", "RANGED"] and role_of(ability_data) != role):
				continue
			var plan := _plan_ability(state, actor, ability_data, role)
			if bool(plan.get("ok", false)):
				plans.append(plan)
		if not plans.is_empty():
			plans.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
				if int(a.path.size()) != int(b.path.size()):
					return int(a.path.size()) < int(b.path.size())
				if role == "RANGED" and int(a.target_distance) != int(b.target_distance):
					return int(a.target_distance) > int(b.target_distance)
				if role == "DAMAGE" and int(a.target_distance) != int(b.target_distance):
					return int(a.target_distance) > int(b.target_distance)
				if int(a.group_score) != int(b.group_score):
					return int(a.group_score) < int(b.group_score)
				if int(a.target_distance) != int(b.target_distance):
					return int(a.target_distance) < int(b.target_distance)
				if int(a.cell.y) != int(b.cell.y):
					return int(a.cell.y) < int(b.cell.y)
				if int(a.cell.x) != int(b.cell.x):
					return int(a.cell.x) < int(b.cell.x)
				return String(a.target_id) < String(b.target_id)
			)
			return plans[0]
	return {"ok": false, "reason": "NO_PATH"}

func _plan_ability(state: Dictionary, actor: Dictionary, ability_data: Dictionary, role: String) -> Dictionary:
	var cost := maxi(0, int(ability_data.get("apCost", 0)))
	if int(actor.get("pa", 0)) < cost:
		return {"ok": false, "reason": "PA"}
	if int(actor.get("cooldowns", {}).get(String(ability_data.id), 0)) > 0:
		return {"ok": false, "reason": "COOLDOWN"}
	var target_type := String(ability_data.get("targeting", {}).get("targetType", "ENEMY"))
	var enemy_units: Array[Dictionary] = []
	for unit: Dictionary in state.get("units", []):
		if effects.alive(unit) and String(unit.get("side", "")) != String(actor.get("side", "")):
			enemy_units.append(unit)
	if target_type == "SELF":
		if enemy_units.is_empty() and role != "SUPPORT":
			return {"ok": false, "reason": "NO_TARGET"}
		for effect: Dictionary in ability_data.get("effects", []):
			if String(effect.get("type", "")) == "BUFF":
				for active: Dictionary in actor.get("effects", []):
					if String(active.get("status_id", "")) == String(effect.get("statusId", "")):
						return {"ok": false, "reason": "NO_TARGET"}
		var self_cell := Vector2i(int(actor.x), int(actor.y))
		var self_check := effects.validate(state, actor, ability_data, self_cell)
		if not self_check.ok:
			return self_check
		return {"ok": true, "ability": ability_data, "target": self_cell, "target_id": String(actor.id), "cell": self_cell, "path": [], "target_distance": 0, "group_score": 0, "role": role}
	if target_type == "CELL":
		return _plan_area(state, actor, ability_data, role, enemy_units)
	if enemy_units.is_empty():
		return {"ok": false, "reason": "NO_TARGET"}
	var possible: Array[Dictionary] = []
	for target_unit: Dictionary in enemy_units:
		var target := Vector2i(int(target_unit.x), int(target_unit.y))
		for cell in _board_cells(state):
			var origin := Vector2i(int(actor.x), int(actor.y))
			if cell != origin and effects.blocked(state, cell, String(actor.id)):
				continue
			var path: Variant = _path_to(state, actor, cell)
			if path == null or path.size() > int(actor.get("pm", 0)):
				continue
			var hypothetical := actor.duplicate(true)
			hypothetical.x = cell.x
			hypothetical.y = cell.y
			var validation := effects.validate(state, hypothetical, ability_data, target)
			if not validation.ok:
				continue
			possible.append({"ok": true, "ability": ability_data, "target": target, "target_id": String(target_unit.id), "cell": cell, "path": path,
				"target_distance": effects.manhattan(cell, target), "group_score": _group_score(state, actor, target_unit, cell), "role": role})
	if possible.is_empty():
		return {"ok": false, "reason": "NO_PATH"}
	possible.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if int(a.path.size()) != int(b.path.size()):
			return int(a.path.size()) < int(b.path.size())
		if role == "RANGED" and int(a.target_distance) != int(b.target_distance):
			return int(a.target_distance) > int(b.target_distance)
		if role == "DAMAGE" and int(a.target_distance) != int(b.target_distance):
			return int(a.target_distance) > int(b.target_distance)
		if int(a.group_score) != int(b.group_score):
			return int(a.group_score) < int(b.group_score)
		if int(a.target_distance) != int(b.target_distance):
			return int(a.target_distance) < int(b.target_distance)
		if int(a.cell.y) != int(b.cell.y):
			return int(a.cell.y) < int(b.cell.y)
		if int(a.cell.x) != int(b.cell.x):
			return int(a.cell.x) < int(b.cell.x)
		return String(a.target_id) < String(b.target_id)
	)
	return possible[0]

func _plan_area(state: Dictionary, actor: Dictionary, ability_data: Dictionary, role: String, enemy_units: Array[Dictionary]) -> Dictionary:
	if enemy_units.is_empty():
		return {"ok": false, "reason": "NO_TARGET"}
	var possible: Array[Dictionary] = []
	for center in _board_cells(state):
		if not effects.validate(state, actor, ability_data, center).ok:
			continue
		var hit_count := 0
		for enemy: Dictionary in enemy_units:
			if effects.area_cells(String(ability_data.get("targeting", {}).get("shape", "SINGLE")), center).has(Vector2i(int(enemy.x), int(enemy.y))):
				hit_count += 1
		if hit_count == 0:
			continue
		possible.append({"ok": true, "ability": ability_data, "target": center, "target_id": "", "cell": center, "path": [],
			"target_distance": effects.manhattan(Vector2i(int(actor.x), int(actor.y)), center), "group_score": hit_count, "role": role})
	if possible.is_empty():
		return {"ok": false, "reason": "NO_TARGET"}
	possible.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if int(a.group_score) != int(b.group_score):
			return int(a.group_score) > int(b.group_score)
		if int(a.target_distance) != int(b.target_distance):
			return int(a.target_distance) < int(b.target_distance)
		if int(a.cell.y) != int(b.cell.y):
			return int(a.cell.y) < int(b.cell.y)
		return int(a.cell.x) < int(b.cell.x)
	)
	return possible[0]

func _board_cells(state: Dictionary) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	for y in int(state.get("height", 0)):
		for x in int(state.get("width", 0)):
			cells.append(Vector2i(x, y))
	return cells

func _path_to(state: Dictionary, actor: Dictionary, cell: Vector2i) -> Variant:
	var origin := Vector2i(int(actor.x), int(actor.y))
	if origin == cell:
		return []
	var obstacles: Array[Vector2i] = []
	for blocked_cell: Vector2i in state.get("blocked", []):
		obstacles.append(blocked_cell)
	for unit: Dictionary in state.get("units", []):
		if effects.alive(unit) and String(unit.id) != String(actor.id):
			obstacles.append(Vector2i(int(unit.x), int(unit.y)))
	var path: Array[Vector2i] = Rules.path(origin, cell, obstacles, int(state.get("width", 0)), int(state.get("height", 0)))
	return null if path.is_empty() else path

func _group_score(state: Dictionary, actor: Dictionary, target: Dictionary, cell: Vector2i) -> int:
	var score := 0
	var side_x := signi(cell.x - int(target.x))
	var side_y := signi(cell.y - int(target.y))
	for ally: Dictionary in state.get("units", []):
		if effects.alive(ally) and String(ally.id) != String(actor.id) and String(ally.side) == String(actor.side):
			if signi(int(ally.x) - int(target.x)) == side_x and signi(int(ally.y) - int(target.y)) == side_y:
				score += 1
	return score
