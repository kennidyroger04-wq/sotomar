extends SceneTree

const Rules = preload("res://scripts/combat_rules_g10.gd")
const Board = preload("res://scripts/combat_board_g10.gd")
const EncounterStateStore = preload("res://scripts/encounter_state_store_g11.gd")
const PLAYER := {"id": "player", "agility": 10}
const ENEMY := {"id": "enemy", "agility": 5}

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var passed := 0
	var fixture_file := FileAccess.open("res://resources/combat/g10_parity_fixtures.json", FileAccess.READ)
	var fixtures: Dictionary = JSON.parse_string(fixture_file.get_as_text())
	_check(Rules.initiative_order([PLAYER, ENEMY]) == ["player", "enemy"], "initiative follows agility")
	passed += 1
	_check(Rules.initiative_order([PLAYER, ENEMY], {"enemy": 6.0}) == ["enemy", "player"], "initiative includes deterministic tie roll")
	passed += 1
	var blocked: Array[Vector2i] = [Vector2i(2, 1)]
	var route := Rules.path(Vector2i(1, 1), Vector2i(3, 1), blocked)
	_check(route.size() == int(fixtures.movement.path_length) and route[0] != Vector2i(2, 1), "path routes around blocked cells using the JS BFS contract")
	passed += 1
	var mover := {"id": "player", "x": 1, "y": 1, "hp": 100, "pm": 4}
	var moved := Rules.move_unit(mover, Vector2i(3, 1), blocked)
	_check(moved.ok and moved.distance == 4 and Vector2i(mover.x, mover.y) == Vector2i(3, 1), "movement consumes exact PM")
	passed += 1
	var out_of_pm := {"id": "player", "x": 1, "y": 1, "hp": 100, "pm": 3}
	_check(not Rules.move_unit(out_of_pm, Vector2i(3, 1), blocked).ok and out_of_pm.x == 1, "movement rejects path above PM")
	passed += 1
	_check(not Rules.move_unit(out_of_pm, Vector2i(2, 1), [Vector2i(2, 1)]).ok, "movement rejects blocked destination")
	passed += 1
	var damage := Rules.physical_damage(40, 10, 0.99, 10, 0.0)
	_check(damage.amount == int(fixtures.damage.noncritical) and not damage.critical, "physical damage matches the shared EngineRules fixture")
	passed += 1
	var critical := Rules.physical_damage(40, 10, 0.0, 10, 0.0)
	_check(critical.amount == int(fixtures.damage.critical) and critical.critical, "critical hit matches EngineRules 1.5 multiplier")
	passed += 1
	var attacker := {"id": "p", "x": 1, "y": 1, "hp": 100, "pa": 6, "strength": 10, "agility": 10, "physical_resistance": 0.0, "damage_bonus": 0.0}
	var target := {"id": "m", "x": 2, "y": 1, "hp": 70, "pa": 6, "physical_resistance": 0.0}
	var attack := Rules.attack(attacker, target, 35, 45, 0.5, 0.99)
	_check(attack.ok and attack.base == int(fixtures.damage.base_roll) and attack.amount == int(fixtures.damage.noncritical) and target.hp == int(fixtures.damage.target_hp_after) and attacker.pa == 2, "Golpe Pesado uses AP, adjacent range, damage roll and vitality")
	passed += 1
	_check(not Rules.attack(attacker, target, 35, 45, 0.5, 0.99).ok, "attack enforces AP restriction")
	passed += 1
	var defender := {"id": "p", "hp": 100, "pa": 6, "physical_resistance": 0.0, "fortify_turns": 0, "fortify_cooldown": 0}
	_check(Rules.apply_fortify(defender) and defender.pa == 4 and defender.physical_resistance == 0.2, "Fortificar consumes AP and applies original resistance")
	passed += 1
	_check(not Rules.apply_fortify(defender), "Fortificar observes cooldown")
	passed += 1
	var resisted := Rules.physical_damage(40, 0, 0.99, 0, float(defender.physical_resistance))
	_check(resisted.amount == int(fixtures.defense.physical_damage_received), "resistance reduces incoming physical damage")
	passed += 1
	var defeated := {"id": "m", "x": 2, "y": 1, "hp": 30, "pa": 6, "physical_resistance": 0.0}
	var lethal := Rules.attack({"id": "p", "x": 1, "y": 1, "hp": 100, "pa": 6, "strength": 10, "agility": 0, "physical_resistance": 0.0, "damage_bonus": 0.0}, defeated, 35, 45, 0.5, 0.99)
	_check(lethal.defeated and defeated.hp == 0, "victory condition reaches zero HP without underflow")
	passed += 1
	_check(Rules.manhattan(Vector2i(1, 1), Vector2i(3, 2)) == 3, "combat range uses original Manhattan grid distance")
	passed += 1
	var scaled_board := Node2D.new()
	scaled_board.set_script(Board)
	scaled_board.origin = Vector2(320, 460)
	scaled_board.cell_scale = 2.0
	var portrait_cell := Vector2i(5, 3)
	_check(scaled_board.screen_to_cell(scaled_board.cell_to_local(portrait_cell)) == portrait_cell, "portrait board scale preserves cell picking")
	passed += 1
	scaled_board.free()
	var main_scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main_scene)
	await process_frame
	main_scene.map_id = "MAP_02"
	main_scene.map_data = MapCatalog.get_map("MAP_02")
	main_scene.logical_position = Vector2i(6, 2)
	main_scene._load_map_visuals()
	main_scene._layout_viewport()
	var exploration_route: Array[Vector2i] = [Vector2i(6, 3)]
	await main_scene._walk_route(exploration_route)
	_check(main_scene.encounter_button.visible, "touch encounter action appears after movement completes next to ENC_01")
	passed += 1
	main_scene._start_encounter()
	await process_frame
	var overlay: Node = main_scene.get_node_or_null("CombatOverlayG10")
	_check(overlay != null and overlay.combat.encounter_id == "ENC_01", "ENC_01 launches from main exploration scene")
	passed += 1
	if overlay != null:
		_check(String(overlay.log_label.text).begins_with("ENC_01 · Cascudo-de-cal"), "combat header names the active encounter rather than a hardcoded fallback")
		passed += 1
		_check(not main_scene.inventory_button.visible and not main_scene.quest_tracker.visible and not main_scene.talk_button.visible, "combat hides the exploration HUD to keep tactical actions clear")
		passed += 1
	if overlay != null:
		overlay.combat.units[0].x = 2
		overlay.combat.units[0].y = 2
		overlay._end_turn()
		_check(overlay.combat.phase == "PLAYER" and overlay.combat.units[0].hp < overlay.combat.units[0].max_hp and Vector2i(overlay.combat.units[1].x, overlay.combat.units[1].y) == Vector2i(2, 3), "enemy follows the original melee planner, approaches, attacks and returns control")
		passed += 1
		overlay.combat.units[1].hp = 1
		overlay._choose_action("attack")
		overlay._try_attack(overlay.combat.units[0], overlay.combat.units[1], true)
		await process_frame
		_check(main_scene._encounter_resolved and main_scene._combat_overlay == null and main_scene.board.visible and main_scene.actor.visible and main_scene.inventory_button.visible and main_scene.instructions.visible, "victory restores exploration HUD and resolves encounter for session")
		passed += 1
	main_scene._encounter_resolved = false
	main_scene._encounter_state_store = EncounterStateStore.new()
	main_scene.logical_position = Vector2i(6, 3)
	main_scene._load_map_visuals()
	main_scene._start_encounter()
	await process_frame
	var retry_overlay: Node = main_scene.get_node_or_null("CombatOverlayG10")
	if retry_overlay != null:
		retry_overlay.combat.units[0].hp = 1
		retry_overlay.combat.units[0].x = 2
		retry_overlay.combat.units[0].y = 2
		retry_overlay.combat.units[1].x = 3
		retry_overlay.combat.units[1].y = 2
		retry_overlay._end_turn()
		_check(retry_overlay.finished and retry_overlay.combat.result == "DEFEAT" and retry_overlay.retry_button.visible, "defeat displays an encounter retry")
		passed += 1
		retry_overlay._retry_encounter()
		_check(not retry_overlay.finished and retry_overlay.combat.units[0].hp == retry_overlay.combat.units[0].max_hp, "retry resets encounter state")
		passed += 1
		retry_overlay.queue_free()
	print("G10 combat tests: %d passed" % passed)
	quit(0)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: " + label)
	else:
		push_error("FAIL: " + label)
		quit(1)
