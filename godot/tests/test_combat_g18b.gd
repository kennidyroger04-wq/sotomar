extends SceneTree

const Effects = preload("res://scripts/combat_effects_g18b.gd")
const AI = preload("res://scripts/combat_ai_g18b.gd")
const Registry = preload("res://scripts/encounter_registry_g11.gd")

var passed := 0
var failures := 0
var fixture: Dictionary

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var file := FileAccess.open("res://resources/combat/g18b_parity_fixtures.json", FileAccess.READ)
	fixture = JSON.parse_string(file.get_as_text())
	_test_avanco()
	_test_cruz()
	_test_lanca()
	_test_fortificar()
	_test_ai()
	_test_encounters()
	await _test_integrated_overlay()
	if failures == 0:
		print("G18B combat parity tests: %d passed" % passed)
		quit(0)
	else:
		push_error("G18B combat parity tests: %d/%d failed" % [failures, passed + failures])
		quit(1)

func _test_avanco() -> void:
	var data: Dictionary = fixture.avanco
	var engine := Effects.new(1)
	var state := _state([_unit(data.actor), _unit(data.target)], data.width, data.height)
	var target := _cell(data.target_cell)
	var cast: Dictionary = engine.cast(state, "player", "avanco", target, _rolls(data.roll))
	_check(cast.ok and state.units[0].pa == data.expected.ap_cost, "Avanço validates and spends exactly 3 PA")
	_check(_cell([state.units[0].x, state.units[0].y]) == _cell(data.expected.player_cell), "Avanço moves up to the target cell without occupying it")
	_check(state.units[1].hp == data.expected.target_hp, "Avanço applies canonical physical damage")
	var blocked := _state([_unit(data.actor), _unit(data.target)], data.width, data.height, [_cell(data.blocked_path_cell)])
	_check(engine.validate(blocked, blocked.units[0], engine.ability("avanco"), target).reason == data.expected.blocked_reason, "Avanço rejects an occupied dash lane")
	var low_ap_unit := _unit(data.actor)
	low_ap_unit.pa = 2
	var low_ap := _state([low_ap_unit, _unit(data.target)], data.width, data.height)
	_check(engine.validate(low_ap, low_ap.units[0], engine.ability("avanco"), target).reason == data.expected.low_ap_reason, "Avanço rejects insufficient PA")

func _test_cruz() -> void:
	var data: Dictionary = fixture.cruz
	var units: Array[Dictionary] = []
	for source: Dictionary in data.actors:
		units.append(_unit(source))
	var state := _state(units, data.width, data.height)
	var engine := Effects.new(2)
	var cast: Dictionary = engine.cast(state, "player", "cruz", _cell(data.target_cell), _rolls(data.roll, 2))
	_check(cast.ok and state.units[0].pa == 2, "Explosão em Cruz spends 4 PA and resolves")
	for id: String in ["center", "arm"]:
		var target := engine.unit_by_id(state, id)
		_check(target.hp == data.expected.hostile_hp and target.effects.size() == data.expected.hostile_status_count, "%s receives magical damage and one status" % id)
		_check(target.effects[0].status_id == data.expected.status and target.effects[0].duration == data.expected.duration, "%s receives Vulnerable for two turns" % id)
		_check(is_equal_approx(engine.resistance(target, "PHYSICAL"), data.expected.resistance_modifier), "%s resistance includes Vulnerable modifier" % id)
	var ally := engine.unit_by_id(state, "ally")
	_check(ally.hp == data.expected.ally_hp and ally.effects.is_empty(), "cross area filters out allies")

func _test_lanca() -> void:
	var data: Dictionary = fixture.lanca
	var units: Array[Dictionary] = []
	for source: Dictionary in data.actors:
		units.append(_unit(source))
	var state := _state(units, data.width, data.height)
	var engine := Effects.new(3)
	var cast: Dictionary = engine.cast(state, "player", "lanca", _cell(data.target_cell), _rolls(data.roll))
	var target := engine.unit_by_id(state, "mob")
	_check(cast.ok and units[0].pa == data.expected.ap_cost and target.hp == data.expected.after_cast_hp, "Lança checks range, spends 3 PA and applies direct damage")
	_check(target.effects.size() == 1 and target.effects[0].status_id == data.expected.status and target.effects[0].duration == data.expected.duration, "Lança applies canonical two-turn poison")
	var first_tick: Dictionary = engine.start_turn(state, "mob")
	_check(target.hp == data.expected.after_first_tick_hp and _has_event(first_tick, "DAMAGE_APPLIED"), "poison ticks at the start of the target turn")
	engine.end_turn(state, "mob")
	engine.start_turn(state, "mob")
	var second_end: Dictionary = engine.end_turn(state, "mob")
	_check(target.hp == data.expected.after_second_tick_hp and target.effects.is_empty(), "poison ticks twice and expires after the second target turn")
	_check(_has_event(second_end, "STATUS_EXPIRED"), "poison expiry emits a status event")

func _test_fortificar() -> void:
	var data: Dictionary = fixture.fortificar
	var actor := _unit(data.actor)
	var state := _state([actor], data.width, data.height)
	var engine := Effects.new(4)
	var cast: Dictionary = engine.cast(state, "player", "fortificar", Vector2i(1, 2))
	_check(cast.ok and actor.pa == 6 - int(data.expected.ap_cost), "Fortificar spends 2 PA")
	_check(is_equal_approx(engine.resistance(actor, "PHYSICAL"), data.expected.physical_resistance) and is_equal_approx(engine.resistance(actor, "MAGICAL"), data.expected.magical_resistance), "Fortificar modifies physical and magical resistance")
	_check(actor.effects[0].duration == data.expected.duration and actor.cooldowns.fortificar == data.expected.cooldown, "Fortificar sets duration and cooldown from source")
	engine.end_turn(state, "player")
	_check(actor.effects[0].duration == 1, "Fortificar remains active after its first own turn")
	engine.start_turn(state, "player")
	var expired: Dictionary = engine.end_turn(state, "player")
	_check(actor.effects.is_empty() and _has_event(expired, "STATUS_EXPIRED"), "Fortificar expires on the second own turn")
	engine.start_turn(state, "player")
	engine.start_turn(state, "player")
	var refreshed: Dictionary = engine.cast(state, "player", "fortificar", Vector2i(1, 2))
	_check(refreshed.ok and actor.effects.size() == data.expected.refresh_count and actor.effects[0].duration == 2, "same-source reapplication refreshes instead of stacking")
	engine.end_turn(state, "player")
	engine.end_turn(state, "player")
	_check(actor.effects.is_empty(), "refreshed status still expires deterministically")

func _test_ai() -> void:
	var data: Dictionary = fixture.ai_lanca
	var profile_policies := {"melee": "MELEE", "ranged_control": "RANGED", "control": "CONTROL", "support": "SUPPORT", "pack": "MELEE", "special_deferred": "DEFERRED", "boss_reference_only": "DEFERRED"}
	var policy_ai := AI.new()
	for profile: String in profile_policies:
		_check(policy_ai.policy_for_profile(profile) == String(profile_policies[profile]), "%s profile maps to its source planner policy" % profile)
	var units: Array[Dictionary] = []
	for source: Dictionary in data.actors:
		units.append(_unit(source))
	var blocked: Array[Vector2i] = []
	for pair: Array in data.blocked:
		blocked.append(_cell(pair))
	var state := _state(units, data.width, data.height, blocked)
	var engine := Effects.new(5)
	var ai := AI.new(engine)
	var plan: Dictionary = ai.choose_ability(state, units[1], ["lanca"])
	_check(plan.ok and plan.ability.id == data.expected.ability_id and plan.target_id == data.expected.target_id, "Fiandeira AI selects the profile ability and a valid enemy")
	_check(plan.role == "RANGED", "canonical ranged_control profile invokes the ranged planner policy")
	_check(_cell([plan.cell.x, plan.cell.y]) == _cell(data.expected.cell), "Fiandeira AI chooses the canonical LOS-clearing position")
	var path_cells: Array = []
	for cell: Vector2i in plan.path:
		path_cells.append([int(cell.x), int(cell.y)])
	var expected_path: Array = []
	for pair: Array in data.expected.path:
		expected_path.append([int(pair[0]), int(pair[1])])
	_check(path_cells == expected_path and int(units[1].pm) - plan.path.size() == data.expected.remaining_pm, "Fiandeira AI path respects obstacles and PM")
	var actor := units[1]
	actor.x = plan.cell.x
	actor.y = plan.cell.y
	actor.pm -= plan.path.size()
	var cast: Dictionary = engine.cast(state, "fiandeira", String(plan.ability.id), plan.target, _rolls({"base": 0, "crit": 0.99}))
	_check(cast.ok and units[0].effects.size() == 1 and units[0].effects[0].status_id == "POISON", "AI casts Lança and applies its canonical effect")
	var deferred_actor := _unit(data.actors[1])
	deferred_actor.ai_profile = "special_deferred"
	_check(not ai.choose_ability(_state([_unit(data.actors[0]), deferred_actor], data.width, data.height), deferred_actor, ["lanca"]).ok, "deferred profiles do not receive invented actions")

func _test_encounters() -> void:
	var data: Dictionary = fixture.multiple_encounters
	var registry := Registry.new()
	var trigger_ids: Array[String] = []
	for id: String in data.ids:
		var definition: Dictionary = registry.combat_definition(id)
		_check(definition.get("ok", false) and definition.get("technical_ready", false), "%s builds a technical combat definition" % id)
		_check(definition.enemies.size() == definition.composition.size(), "%s preserves all encounter units" % id)
		if registry.world_trigger_available(id):
			trigger_ids.append(id)
	_check(trigger_ids == data.expected.world_trigger_ids, "only existing provisional world triggers remain available")
	_check(not registry.world_trigger_available("ENC_02") and registry.encounter("ENC_02").get("activation_condition", "") == "UNSPECIFIED_IN_CANON", "technical support does not invent an exploration trigger")

func _test_integrated_overlay() -> void:
	var main_scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main_scene)
	await process_frame
	main_scene.set("selected_encounter_id", "ENC_01")
	main_scene.call("_start_encounter")
	await process_frame
	var overlay: Variant = main_scene.get_node_or_null("CombatOverlayG10")
	_check(overlay != null, "canonical exploration interaction starts the existing combat overlay")
	if overlay == null:
		main_scene.queue_free()
		return
	var player: Dictionary = overlay.combat.units[0]
	var enemy: Dictionary = overlay.combat.units[1]
	player.x = 1
	player.y = 3
	player.pa = 6
	enemy.x = 4
	enemy.y = 3
	enemy.hp = 70
	var target := Vector2i(4, 3)
	overlay._choose_action("avanco")
	_check(overlay.board.targetable_cells.has(target), "mobile combat HUD highlights Avanço targets")
	var touch := InputEventScreenTouch.new()
	touch.pressed = true
	touch.position = overlay.board.cell_to_local(target)
	overlay._unhandled_input(touch)
	_check(Vector2i(int(player.x), int(player.y)) == Vector2i(3, 3) and enemy.hp < 70 and player.pa == 3, "existing encounter overlay casts Avanço from a touch selection")
	player.pa = 6
	overlay._choose_action("cruz")
	var cruz_center := Vector2i(int(enemy.x), int(enemy.y))
	touch.position = overlay.board.cell_to_local(cruz_center)
	overlay._unhandled_input(touch)
	_check(overlay.board.affected_cells.has(cruz_center), "mobile HUD previews Explosão em Cruz cells before confirmation")
	overlay._unhandled_input(touch)
	_check(enemy.hp < 50 and enemy.effects.size() == 1 and enemy.effects[0].status_id == "VULNERABLE", "second touch confirms the area ability and applies its status")
	player.pa = 6
	overlay._choose_action("fortificar")
	_check(player.effects.any(func(effect: Dictionary) -> bool: return String(effect.status_id) == "FORTIFIED"), "self-targeted defense integrates with the existing player turn")
	for size: Vector2 in [Vector2(360, 800), Vector2(390, 844), Vector2(844, 390), Vector2(1280, 720)]:
		overlay._layout_ui_at(size)
		var hud: Control = overlay.get_node("CombatHUD")
		var actions: Control = hud.get_node("CombatActions")
		_check(actions.position.x >= 0.0 and actions.position.y >= 0.0 and actions.position.x + actions.size.x <= size.x + 0.5 and actions.position.y + actions.size.y <= size.y + 0.5, "combat action grid fits %s" % str(size))
		_check(overlay.board.cell_scale >= 0.58 and overlay.board.cell_scale <= 1.5, "combat board remains fitted at %s" % str(size))
	main_scene.queue_free()

func _unit(source: Dictionary) -> Dictionary:
	var unit: Dictionary = source.duplicate(true)
	unit["max_hp"] = int(source.get("maxHp", source.get("hp", 0)))
	unit["max_pa"] = int(source.get("maxPa", source.get("pa", 0)))
	unit["max_pm"] = int(source.get("maxPm", source.get("pm", 0)))
	unit["combat_stats"] = source.get("combatStats", {}).duplicate(true)
	unit["physical_resistance"] = float(source.get("resistances", {}).get("PHYSICAL", 0.0))
	unit["magical_resistance"] = float(source.get("resistances", {}).get("MAGICAL", 0.0))
	unit["cooldowns"] = source.get("cooldowns", {}).duplicate(true)
	unit["effects"] = []
	return unit

func _state(units: Array[Dictionary], width: int, height: int, blocked: Array[Vector2i] = []) -> Dictionary:
	return {"width": width, "height": height, "blocked": blocked, "units": units, "event_sequence": 0}

func _cell(pair: Array) -> Vector2i:
	return Vector2i(int(pair[0]), int(pair[1]))

func _rolls(roll: Dictionary, count := 1) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for _index in count:
		result.append(roll.duplicate(true))
	return result

func _has_event(result: Dictionary, type: String) -> bool:
	for event: Dictionary in result.get("events", []):
		if String(event.get("type", "")) == type:
			return true
	return false

func _check(condition: bool, label: String) -> void:
	if condition:
		passed += 1
		print("PASS: " + label)
	else:
		failures += 1
		push_error("FAIL: " + label)
