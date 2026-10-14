extends RefCounted
class_name CombatEffectsG18B
## Godot port of the data-driven CombatEffects rules in js/systems/combat-effects.js.

const Rules = preload("res://scripts/combat_rules_g10.gd")
const ABILITY_REGISTRY_PATH := "res://resources/combat/ability_registry_g15.json"
const RESISTANCE_MIN := -0.5
const RESISTANCE_MAX := 0.85

var _abilities: Dictionary = {}
var _rng := RandomNumberGenerator.new()

func _init(seed_value: int = 0xF1B12A) -> void:
	_rng.seed = seed_value
	var file := FileAccess.open(ABILITY_REGISTRY_PATH, FileAccess.READ)
	if file == null:
		push_error("Ability registry missing: " + ABILITY_REGISTRY_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		_abilities = parsed.get("abilities", {}).duplicate(true)

func ability(ability_id: String) -> Dictionary:
	return (_abilities.get(ability_id, {}) as Dictionary).duplicate(true)

func ability_catalog() -> Dictionary:
	return _abilities.duplicate(true)

func alive(unit: Dictionary) -> bool:
	return not unit.is_empty() and int(unit.get("hp", 0)) > 0

func unit_by_id(state: Dictionary, unit_id: String) -> Dictionary:
	for unit: Dictionary in state.get("units", []):
		if String(unit.get("id", "")) == unit_id:
			return unit
	return {}

func unit_at(state: Dictionary, cell: Vector2i, except_id := "") -> Dictionary:
	for unit: Dictionary in state.get("units", []):
		if String(unit.get("id", "")) != except_id and alive(unit) and Vector2i(int(unit.x), int(unit.y)) == cell:
			return unit
	return {}

func in_bounds(state: Dictionary, cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < int(state.get("width", 0)) and cell.y < int(state.get("height", 0))

func blocked(state: Dictionary, cell: Vector2i, except_id := "") -> bool:
	if not in_bounds(state, cell) or state.get("blocked", []).has(cell):
		return true
	return not unit_at(state, cell, except_id).is_empty()

func manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)

func line_of_sight(state: Dictionary, from: Vector2i, to: Vector2i, except_id := "") -> bool:
	var dx := absi(to.x - from.x)
	var dy := absi(to.y - from.y)
	var sx := 1 if from.x < to.x else -1
	var sy := 1 if from.y < to.y else -1
	var x := from.x
	var y := from.y
	var error := dx - dy
	while x != to.x or y != to.y:
		var twice := 2 * error
		if twice > -dy:
			error -= dy
			x += sx
		if twice < dx:
			error += dx
			y += sy
		if x == to.x and y == to.y:
			break
		if blocked(state, Vector2i(x, y), except_id):
			return false
	return true

func area_cells(shape: String, center: Vector2i) -> Array[Vector2i]:
	if shape == "CROSS":
		return [center, center + Vector2i.RIGHT, center + Vector2i.LEFT,
			center + Vector2i(2, 0), center + Vector2i(-2, 0),
			center + Vector2i.DOWN, center + Vector2i.UP,
			center + Vector2i(0, 2), center + Vector2i(0, -2)]
	return [center]

func validate(state: Dictionary, actor: Dictionary, ability_data: Dictionary, target: Vector2i) -> Dictionary:
	if not alive(actor):
		return {"ok": false, "reason": "DEAD"}
	if ability_data.is_empty():
		return {"ok": false, "reason": "ABILITY"}
	var ability_id := String(ability_data.get("id", ""))
	var ap_cost := maxi(0, int(ability_data.get("apCost", 0)))
	if int(actor.get("pa", 0)) < ap_cost:
		return {"ok": false, "reason": "PA"}
	if int(actor.get("cooldowns", {}).get(ability_id, 0)) > 0:
		return {"ok": false, "reason": "COOLDOWN"}
	var targeting: Dictionary = ability_data.get("targeting", {})
	var target_type := String(targeting.get("targetType", "ENEMY"))
	var actor_cell := Vector2i(int(actor.x), int(actor.y))
	var point := actor_cell if target_type == "SELF" else target
	if not in_bounds(state, point):
		return {"ok": false, "reason": "TARGET"}
	var range_data: Dictionary = ability_data.get("range", {})
	var distance := manhattan(actor_cell, point)
	if distance < int(range_data.get("min", 0)) or distance > int(range_data.get("max", 0)):
		return {"ok": false, "reason": "RANGE"}
	if bool(ability_data.get("requiresLoS", false)) and not line_of_sight(state, actor_cell, point, String(actor.get("id", ""))):
		return {"ok": false, "reason": "LOS"}
	var target_unit := unit_at(state, point)
	if target_type == "ENEMY" and (target_unit.is_empty() or String(target_unit.get("side", "")) == String(actor.get("side", ""))):
		return {"ok": false, "reason": "TARGET"}
	if target_type == "ALLY" and (target_unit.is_empty() or String(target_unit.get("side", "")) != String(actor.get("side", ""))):
		return {"ok": false, "reason": "TARGET"}
	if bool(ability_data.get("requiresStraightLine", false)) and point.x != actor_cell.x and point.y != actor_cell.y:
		return {"ok": false, "reason": "TARGET"}
	for effect: Dictionary in ability_data.get("effects", []):
		if String(effect.get("type", "")) == "MOVE" and String(effect.get("mode", "")) == "DASH":
			if not _dash_path_is_clear(state, actor, point, effect):
				return {"ok": false, "reason": "PATH"}
	return {"ok": true, "target": point, "target_unit_id": String(target_unit.get("id", "")), "cost": ap_cost}

func targetable_cells(state: Dictionary, actor: Dictionary, ability_data: Dictionary) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	if String(ability_data.get("targeting", {}).get("targetType", "")) == "SELF":
		var self_cell := Vector2i(int(actor.x), int(actor.y))
		if validate(state, actor, ability_data, self_cell).ok:
			cells.append(self_cell)
		return cells
	for y in int(state.get("height", 0)):
		for x in int(state.get("width", 0)):
			var cell := Vector2i(x, y)
			if validate(state, actor, ability_data, cell).ok:
				cells.append(cell)
	return cells

func _dash_path_is_clear(state: Dictionary, actor: Dictionary, target: Vector2i, effect: Dictionary) -> bool:
	var origin := Vector2i(int(actor.x), int(actor.y))
	var dx := target.x - origin.x
	var dy := target.y - origin.y
	if (dx != 0 and dy != 0) or (dx == 0 and dy == 0):
		return false
	var distance := maxi(absi(dx), absi(dy))
	if distance > int(effect.get("maxDistance", 0)):
		return false
	var step := Vector2i(signi(dx), signi(dy))
	for index in range(1, distance):
		if blocked(state, origin + step * index, String(actor.get("id", ""))):
			return false
	return true

func modifiers(unit: Dictionary) -> Dictionary:
	var combined: Dictionary = {}
	for effect: Dictionary in unit.get("effects", []):
		for key: String in effect.get("modifiers", {}):
			combined[key] = float(combined.get(key, 0.0)) + float(effect.modifiers[key])
	return combined

func resistance(unit: Dictionary, damage_type: String) -> float:
	var suffix := "magicalResistance" if damage_type == "MAGICAL" else "physicalResistance"
	var base_key := "magical_resistance" if damage_type == "MAGICAL" else "physical_resistance"
	var base := float(unit.get(base_key, 0.0))
	var effective := base + float(modifiers(unit).get(suffix, 0.0))
	return clampf(effective, RESISTANCE_MIN, RESISTANCE_MAX)

func cast(state: Dictionary, actor_id: String, ability_id: String, target: Vector2i, rolls: Array[Dictionary] = []) -> Dictionary:
	var actor := unit_by_id(state, actor_id)
	var ability_data := ability(ability_id)
	var check := validate(state, actor, ability_data, target)
	var events: Array[Dictionary] = []
	if not check.ok:
		return {"ok": false, "reason": String(check.reason), "events": events}
	actor.pa = int(actor.pa) - int(check.cost)
	var cooldown := int(ability_data.get("cooldown", 0))
	if cooldown > 0:
		if not actor.has("cooldowns"):
			actor.cooldowns = {}
		actor.cooldowns[ability_id] = cooldown
	_emit(state, events, "ABILITY_CAST", {"actor_id": actor_id, "ability_id": ability_id, "target": check.target, "ap_cost": check.cost})
	var context := {"target_unit_id": String(check.target_unit_id)}
	for effect: Dictionary in ability_data.get("effects", []):
		if not alive(actor):
			break
		if String(effect.get("type", "")) == "MOVE":
			_move(state, events, actor, Vector2i(check.target), effect)
			continue
		for unit: Dictionary in _target_units(state, actor, ability_data, Vector2i(check.target), effect, context):
			if not alive(unit) and String(effect.get("type", "")) != "DAMAGE":
				continue
			match String(effect.get("type", "")):
				"DAMAGE":
					_apply_damage(state, events, actor, unit, effect, rolls)
				"HEAL":
					_apply_heal(state, events, actor, unit, effect, rolls)
				"BUFF", "DEBUFF", "STATUS":
					_apply_temporal(state, events, actor, unit, effect)
	return {"ok": true, "events": events, "target": check.target, "target_unit_id": check.target_unit_id}

func _target_units(state: Dictionary, actor: Dictionary, ability_data: Dictionary, target: Vector2i, effect: Dictionary, context: Dictionary) -> Array[Dictionary]:
	var mode := String(effect.get("target", "TARGET"))
	if mode == "SELF":
		var self_targets: Array[Dictionary] = [actor]
		return self_targets
	if mode == "TARGET":
		var target_id := String(context.get("target_unit_id", ""))
		var chosen := unit_by_id(state, target_id) if not target_id.is_empty() else unit_at(state, target)
		var selected: Array[Dictionary] = []
		if not chosen.is_empty():
			selected.append(chosen)
		return selected
	var filter := String(effect.get("targetFilter", ability_data.get("targeting", {}).get("targetType", "ANY")))
	var result: Array[Dictionary] = []
	for cell in area_cells(String(ability_data.get("targeting", {}).get("shape", "SINGLE")), target):
		if not in_bounds(state, cell):
			continue
		var unit := unit_at(state, cell)
		if unit.is_empty():
			continue
		var valid: bool = filter in ["ANY", "CELL"] or (filter == "ENEMY" and unit.side != actor.side) or (filter == "ALLY" and unit.side == actor.side) or (filter == "SELF" and unit.id == actor.id)
		if valid:
			result.append(unit)
	return result

func _roll_amount(effect: Dictionary, rolls: Array[Dictionary], with_crit := true) -> Dictionary:
	var amount: Variant = effect.get("amount", 0)
	var base := 0 if amount is Array else int(amount)
	var crit_roll := 1.0
	if amount is Array and amount.size() >= 2:
		if not rolls.is_empty():
			var scripted: Dictionary = rolls.pop_front()
			base = int(amount[0]) + mini(int(floor(float(scripted.get("base", 0.0)) * float(int(amount[1]) - int(amount[0]) + 1))), int(amount[1]) - int(amount[0]))
			crit_roll = float(scripted.get("crit", 1.0)) if with_crit else 1.0
		else:
			base = _rng.randi_range(int(amount[0]), int(amount[1]))
			crit_roll = _rng.randf() if with_crit else 1.0
	elif not rolls.is_empty():
		var scripted_single: Dictionary = rolls.pop_front()
		crit_roll = float(scripted_single.get("crit", 1.0)) if with_crit else 1.0
	elif with_crit:
		crit_roll = _rng.randf()
	return {"base": base, "crit_roll": crit_roll}

func _apply_damage(state: Dictionary, events: Array[Dictionary], actor: Dictionary, target: Dictionary, effect: Dictionary, rolls: Array[Dictionary]) -> void:
	if not alive(target):
		return
	var sampled := _roll_amount(effect, rolls)
	var damage_type := "MAGICAL" if String(effect.get("damageType", "")) == "MAGICAL" else "PHYSICAL"
	var stats: Dictionary = actor.get("combat_stats", {})
	var attribute := int(stats.get("inteligencia", actor.get("intelligence", 0))) if damage_type == "MAGICAL" else int(stats.get("forca", actor.get("strength", 0)))
	var agility := int(stats.get("agilidade", actor.get("agility", 0)))
	var critical := float(sampled.crit_roll) < float(agility) * 0.005
	var source := roundi(float(sampled.base) * (1.0 + float(attribute) / 100.0) * (1.5 if critical else 1.0))
	var damage_bonus := float(modifiers(actor).get("damage", actor.get("damage_bonus", 0.0)))
	var amount := maxi(0, roundi(float(source) * (1.0 + clampf(damage_bonus, -0.9, 5.0)) * (1.0 - resistance(target, damage_type))))
	var before := int(target.hp)
	target.hp = maxi(0, before - amount)
	_emit(state, events, "DAMAGE_APPLIED", {"actor_id": actor.id, "target_id": target.id, "amount": before - int(target.hp), "damage_type": damage_type, "resistance": resistance(target, damage_type), "critical": critical})
	if int(target.hp) == 0 and not bool(target.get("death_processed", false)):
		target.death_processed = true
		_emit(state, events, "UNIT_DIED", {"target_id": target.id, "source_id": actor.id})

func _apply_heal(state: Dictionary, events: Array[Dictionary], actor: Dictionary, target: Dictionary, effect: Dictionary, rolls: Array[Dictionary]) -> void:
	var sampled := _roll_amount(effect, rolls, false)
	var before := int(target.hp)
	target.hp = mini(int(target.max_hp), before + maxi(0, int(sampled.base)))
	if int(target.hp) > before:
		_emit(state, events, "HEAL_APPLIED", {"actor_id": actor.id, "target_id": target.id, "amount": int(target.hp) - before})

func _apply_temporal(state: Dictionary, events: Array[Dictionary], actor: Dictionary, target: Dictionary, effect: Dictionary) -> void:
	if not target.has("effects"):
		target.effects = []
	var status_id := String(effect.get("statusId", effect.get("id", String(effect.get("type", "status")).to_lower())))
	var existing_index := -1
	for index in target.effects.size():
		var current: Dictionary = target.effects[index]
		if String(current.get("id", "")) == status_id and String(current.get("source_id", "")) == String(actor.id):
			existing_index = index
			break
	var entry := {"id": status_id, "source_id": String(actor.id), "kind": String(effect.type), "status_id": status_id,
		"duration": maxi(1, int(effect.get("duration", 1))), "modifiers": effect.get("modifiers", {}).duplicate(true),
		"tick": effect.get("tick", {}).duplicate(true)}
	if existing_index >= 0:
		target.effects[existing_index] = entry
	else:
		target.effects.append(entry)
	_emit(state, events, "STATUS_APPLIED", {"actor_id": actor.id, "target_id": target.id, "status_id": status_id, "duration": entry.duration, "kind": entry.kind, "refreshed": existing_index >= 0})

func _move(state: Dictionary, events: Array[Dictionary], actor: Dictionary, target: Vector2i, effect: Dictionary) -> void:
	var origin := Vector2i(int(actor.x), int(actor.y))
	var destination := target
	if String(effect.get("mode", "")) == "DASH":
		var step := Vector2i(signi(target.x - origin.x), signi(target.y - origin.y))
		var distance := mini(maxi(absi(target.x - origin.x), absi(target.y - origin.y)), maxi(0, int(effect.get("maxDistance", 0))))
		destination = origin
		for index in range(1, distance + 1):
			var candidate := origin + step * index
			if blocked(state, candidate, String(actor.id)):
				break
			destination = candidate
	if destination == origin or blocked(state, destination, String(actor.id)):
		return
	actor.x = destination.x
	actor.y = destination.y
	_emit(state, events, "UNIT_MOVED", {"actor_id": actor.id, "from": origin, "to": destination, "reason": String(effect.get("mode", "MOVE"))})

func start_turn(state: Dictionary, actor_id: String) -> Dictionary:
	var actor := unit_by_id(state, actor_id)
	var events: Array[Dictionary] = []
	if not alive(actor):
		return {"ok": false, "reason": "DEAD", "events": events}
	_emit(state, events, "TURN_STARTED", {"actor_id": actor_id})
	for ability_id: String in actor.get("cooldowns", {}).keys():
		actor.cooldowns[ability_id] = maxi(0, int(actor.cooldowns[ability_id]) - 1)
		if int(actor.cooldowns[ability_id]) == 0:
			actor.cooldowns.erase(ability_id)
	var effects: Array = actor.get("effects", []).duplicate(true)
	for effect: Dictionary in effects:
		if String(effect.get("status_id", "")) == "POISON" and effect.get("tick", {}) is Dictionary and not effect.get("tick", {}).is_empty():
			var source := unit_by_id(state, String(effect.get("source_id", "")))
			if source.is_empty():
				source = {"id": String(effect.get("source_id", "")), "combat_stats": {}, "effects": []}
			_apply_damage(state, events, source, actor, {"type": "DAMAGE", "damageType": effect.tick.get("damageType", "PHYSICAL"), "amount": effect.tick.get("amount", 0)}, [])
	if alive(actor):
		actor.pa = int(actor.get("max_pa", 0))
		actor.pm = int(actor.get("max_pm", 0))
		return {"ok": true, "events": events}
	return {"ok": false, "reason": "DEAD", "events": events}

func end_turn(state: Dictionary, actor_id: String) -> Dictionary:
	var actor := unit_by_id(state, actor_id)
	var events: Array[Dictionary] = []
	if actor.is_empty():
		return {"ok": false, "events": events}
	_emit(state, events, "TURN_ENDED", {"actor_id": actor_id})
	var snapshot: Array = actor.get("effects", []).duplicate()
	for effect: Dictionary in snapshot:
		effect.duration = int(effect.get("duration", 1)) - 1
		if int(effect.duration) <= 0:
			actor.effects.erase(effect)
			_emit(state, events, "STATUS_EXPIRED", {"target_id": actor.id, "status_id": effect.get("id", ""), "source_id": effect.get("source_id", "")})
	return {"ok": true, "events": events}

func _emit(state: Dictionary, events: Array[Dictionary], event_type: String, data: Dictionary) -> void:
	state.event_sequence = int(state.get("event_sequence", 0)) + 1
	var event := {"id": "combat-event:%d" % int(state.event_sequence), "type": event_type}
	event.merge(data, true)
	events.append(event)
