extends RefCounted
## Deterministic tactical subset of the original JS EngineRules/CombatEffects.

## Matches js/core/geometry.js BFS neighbor order.
const NEIGHBORS := [Vector2i.RIGHT, Vector2i.LEFT, Vector2i.DOWN, Vector2i.UP]

static func initiative_order(units: Array, tie_rolls: Dictionary = {}) -> Array[String]:
	var ranked: Array[Dictionary] = []
	for index in units.size():
		var unit: Dictionary = units[index]
		ranked.append({"id": String(unit.id), "score": float(unit.agility) + float(tie_rolls.get(String(unit.id), 0.0)), "index": index})
	ranked.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if is_equal_approx(float(a.score), float(b.score)):
			return int(a.index) < int(b.index)
		return float(a.score) > float(b.score)
	)
	var result: Array[String] = []
	for entry in ranked:
		result.append(String(entry.id))
	return result

static func manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)

static func path(start: Vector2i, goal: Vector2i, blocked: Array[Vector2i], width := 8, height := 6) -> Array[Vector2i]:
	if not _inside(goal, width, height) or blocked.has(goal):
		return []
	if start == goal:
		return []
	var queue: Array[Vector2i] = [start]
	var came_from := {start: Vector2i(-1, -1)}
	var cursor := 0
	while cursor < queue.size():
		var current := queue[cursor]
		cursor += 1
		if current == goal:
			break
		for direction in NEIGHBORS:
			var next: Vector2i = current + direction
			if not _inside(next, width, height) or blocked.has(next) or came_from.has(next):
				continue
			came_from[next] = current
			queue.append(next)
	if not came_from.has(goal):
		return []
	var route: Array[Vector2i] = []
	var current := goal
	while current != start:
		route.push_front(current)
		current = came_from[current]
	return route

static func move_unit(unit: Dictionary, destination: Vector2i, blocked: Array[Vector2i]) -> Dictionary:
	var origin := Vector2i(int(unit.x), int(unit.y))
	var route := path(origin, destination, blocked)
	if route.is_empty() or route.size() > int(unit.pm):
		return {"ok": false, "reason": "PATH" if route.is_empty() else "PM"}
	unit.x = destination.x
	unit.y = destination.y
	unit.pm -= route.size()
	return {"ok": true, "distance": route.size(), "path": route}

static func physical_damage(base: int, strength: int, crit_roll: float, agility: int, resistance: float, damage_bonus := 0.0) -> Dictionary:
	var crit := crit_roll < float(agility) * 0.005
	var source := roundi(float(base) * (1.0 + float(strength) / 100.0) * (1.5 if crit else 1.0))
	var safe_resistance := clampf(resistance, -0.5, 0.85)
	var amount := maxi(0, roundi(float(source) * (1.0 + clampf(damage_bonus, -0.9, 5.0)) * (1.0 - safe_resistance)))
	return {"amount": amount, "critical": crit, "resistance": safe_resistance}

static func attack(attacker: Dictionary, target: Dictionary, base_min: int, base_max: int, roll: float, crit_roll := 1.0, range_min := 1, range_max := 1, ap_cost := 4) -> Dictionary:
	if int(attacker.hp) <= 0 or int(target.hp) <= 0 or int(attacker.pa) < ap_cost:
		return {"ok": false, "reason": "ACTION"}
	var distance := manhattan(Vector2i(int(attacker.x), int(attacker.y)), Vector2i(int(target.x), int(target.y)))
	if distance < range_min or distance > range_max:
		return {"ok": false, "reason": "RANGE"}
	attacker.pa = int(attacker.pa) - ap_cost
	var base := base_min + mini(int(floor(roll * float(base_max - base_min + 1))), base_max - base_min)
	var result := physical_damage(base, int(attacker.strength), crit_roll, int(attacker.agility), float(target.physical_resistance), float(attacker.damage_bonus))
	target.hp = maxi(0, int(target.hp) - int(result.amount))
	result.merge({"ok": true, "base": base, "defeated": int(target.hp) == 0}, true)
	return result

static func occupied_cells(units: Array, except_id := "") -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for unit: Dictionary in units:
		if int(unit.get("hp", 0)) > 0 and String(unit.get("id", "")) != except_id:
			result.append(Vector2i(int(unit.x), int(unit.y)))
	return result

static func alive_enemies(units: Array) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for unit: Dictionary in units:
		if String(unit.get("side", "")) == "mob" and int(unit.get("hp", 0)) > 0:
			result.append(unit)
	return result

static func apply_fortify(unit: Dictionary) -> bool:
	if int(unit.hp) <= 0 or int(unit.pa) < 2 or int(unit.fortify_cooldown) > 0:
		return false
	unit.pa = int(unit.pa) - 2
	unit.physical_resistance = maxf(float(unit.physical_resistance), 0.2)
	unit.fortify_turns = 2
	unit.fortify_cooldown = 2
	return true

static func _inside(cell: Vector2i, width: int, height: int) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < width and cell.y < height
