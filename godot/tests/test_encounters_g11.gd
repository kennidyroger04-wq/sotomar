extends SceneTree

const Registry = preload("res://scripts/encounter_registry_g11.gd")
const StateStore = preload("res://scripts/encounter_state_store_g11.gd")
const Rules = preload("res://scripts/combat_rules_g10.gd")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var passed := 0
	var overlay_script: Script = load("res://scripts/combat_overlay_g10.gd")
	var registry = Registry.new()
	var catalog: Dictionary = registry.catalog()
	_check(catalog.get("audit", {}).get("canonical_encounter_count", 0) == 12, "catalog preserves all 12 canonical encounters")
	passed += 1
	_check(catalog.audit.provisional_playable_encounters == ["ENC_01", "ENC_05"] and catalog.audit.pending_encounters.size() == 10, "only explicitly placed supported encounters receive provisional world triggers")
	passed += 1
	_check(not catalog.audit.canonical_rewards_defined and not catalog.audit.canonical_trigger_conditions_defined and not catalog.audit.canonical_repeat_policies_defined, "unspecified canonical policies remain explicit")
	passed += 1
	var definition: Dictionary = registry.combat_definition("ENC_01")
	_check(definition.get("ok", false) and definition.enemies.size() == 1 and definition.enemies[0].canonical_id == "CRE_CASCUDO_DE_CAL", "ENC_01 builds its canonical unit profile")
	passed += 1
	var multi: Dictionary = registry.combat_definition("ENC_02", [Vector2i(4, 3), Vector2i(5, 3)])
	_check(multi.get("ok", false) and multi.enemies.size() == 2 and multi.godot_status == "PENDING", "pending canonical composition can be exercised without activating its world trigger")
	passed += 1
	_check(not registry.combat_definition("ENC_02", [Vector2i(4, 3)]).get("ok", false), "spawn count must match composition")
	passed += 1
	_check(not registry.combat_definition("ENC_02", [Vector2i(1, 2), Vector2i(5, 3)]).get("ok", false), "spawn cells cannot overlap the player")
	passed += 1
	_check(not registry.world_trigger_available("ENC_02") and registry.world_trigger_available("ENC_05"), "world trigger gating follows catalog status")
	passed += 1
	var store = StateStore.new()
	var start: Dictionary = store.start("SYNTHETIC_G11")
	_check(start.ok and not store.start("SYNTHETIC_G11").ok, "state store prevents duplicate concurrent starts")
	passed += 1
	_check(store.finish("SYNTHETIC_G11", "VICTORY", {}, [{"id": "TEST_REWARD"}]).ok, "state store records victory and declared reward candidates")
	passed += 1
	_check(store.reserve_reward_claim("SYNTHETIC_G11", "TEST_REWARD").ok and store.reserve_reward_claim("SYNTHETIC_G11", "TEST_REWARD").reason == "DUPLICATE_CLAIM", "state store reserves a declared claim only once without granting it")
	passed += 1
	_check(store.start("SYNTHETIC_G11").reason == "ALREADY_RESOLVED" and store.start("SYNTHETIC_G11", true).ok, "resolved encounters obey their supplied repetition policy")
	passed += 1
	store.finish("SYNTHETIC_G11", "VICTORY", {}, [{"id": "TEST_REWARD"}])
	_check(store.reserve_reward_claim("SYNTHETIC_G11", "TEST_REWARD").reason == "DUPLICATE_CLAIM", "reward claim IDs persist across an explicitly repeatable session encounter")
	passed += 1
	var snapshot: Dictionary = store.snapshot()
	var restored = StateStore.new()
	_check(restored.restore_snapshot(snapshot) and restored.is_resolved("SYNTHETIC_G11"), "versioned encounter snapshot can be restored")
	passed += 1
	var synthetic_store = StateStore.new()
	synthetic_store.start("SYNTHETIC_MULTI")
	multi.encounter_id = "SYNTHETIC_MULTI"
	var overlay = overlay_script.new()
	overlay.configure(multi, synthetic_store)
	root.add_child(overlay)
	await process_frame
	_check(overlay.combat.units.size() == 3 and overlay.combat.turn_order.size() == 3 and overlay.combat.turn_order[0] == "player", "multi-unit combat uses stable agility initiative")
	passed += 1
	var enemy_ids: Array[String] = []
	for unit: Dictionary in overlay.combat.units:
		if unit.side == "mob":
			enemy_ids.append(String(unit.id))
	_check(enemy_ids.size() == 2 and enemy_ids[0] != enemy_ids[1], "combatants retain distinct canonical unit identities")
	passed += 1
	var occupied: Array[Vector2i] = Rules.occupied_cells(overlay.combat.units, "player")
	_check(occupied.size() == 2 and occupied.has(Vector2i(int(overlay.combat.units[1].x), int(overlay.combat.units[1].y))), "living enemies reserve their board cells")
	passed += 1
	overlay.combat.units[0].x = 3
	overlay.combat.units[0].y = 3
	overlay._try_move(Vector2i(4, 3))
	_check(Vector2i(int(overlay.combat.units[0].x), int(overlay.combat.units[0].y)) == Vector2i(3, 3), "combat controller rejects movement into another living unit")
	passed += 1
	# Place both synthetic enemies adjacent and low on health to deterministically test the last-enemy victory condition.
	overlay.combat.units[0].x = 3
	overlay.combat.units[0].y = 3
	for index in 2:
		overlay.combat.units[index + 1].x = 4 if index == 0 else 3
		overlay.combat.units[index + 1].y = 3 if index == 0 else 4
		overlay.combat.units[index + 1].hp = 1
	overlay.combat.phase = "PLAYER"
	overlay.active_unit_id = "player"
	overlay.combat.units[0].pa = 6
	overlay._choose_action("attack")
	overlay._try_attack(overlay.combat.units[0], overlay.combat.units[1], true)
	_check(not overlay.finished and overlay.combat.units[2].hp == 1, "defeating one of several enemies does not end the encounter")
	passed += 1
	overlay.combat.units[0].pa = 6
	overlay.combat.units[0].cooldowns.clear()
	overlay._choose_action("attack")
	overlay._try_attack(overlay.combat.units[0], overlay.combat.units[2], true)
	_check(overlay.finished and overlay.combat.result == "VICTORY" and synthetic_store.is_resolved("SYNTHETIC_MULTI"), "encounter ends only after the final enemy falls")
	passed += 1
	_check(overlay.finished and overlay.result_record.get("defeated_units", []).size() == 2 and overlay.result_record.get("events", []).size() == 3 and not overlay.result_record.get("rewards_applied", true), "victory records each kill and resolution without granting rewards")
	passed += 1
	# Test independent enemy turns in a fresh combat and return to player phase.
	var ai_definition: Dictionary = registry.combat_definition("ENC_02", [Vector2i(4, 3), Vector2i(5, 3)])
	ai_definition.encounter_id = "SYNTHETIC_AI"
	var ai_overlay = overlay_script.new()
	ai_overlay.configure(ai_definition, null)
	root.add_child(ai_overlay)
	await process_frame
	ai_overlay.combat.turn_order = [String(ai_overlay.combat.units[1].id), String(ai_overlay.combat.units[2].id), "player"]
	ai_overlay.combat.turn_index = -1
	ai_overlay.combat.phase = "ENEMY"
	ai_overlay.combat.units[2].x = 2
	ai_overlay.combat.units[2].y = 2
	var player_hp_before_ai := int(ai_overlay.combat.units[0].hp)
	ai_overlay._advance_turn()
	ai_overlay._run_enemy_queue()
	var ai_positions: Array[Vector2i] = []
	for index in [1, 2]:
		ai_positions.append(Vector2i(int(ai_overlay.combat.units[index].x), int(ai_overlay.combat.units[index].y)))
	_check(ai_overlay.combat.turn_order.size() == 3 and ai_overlay.combat.phase == "PLAYER" and ai_positions[0] != Vector2i(4, 3) and ai_overlay.combat.units[0].hp < player_hp_before_ai and ai_positions[0] != ai_positions[1], "multiple enemy turns move around an occupied cell, attack independently and return control to player")
	passed += 1
	ai_overlay.queue_free()
	overlay.queue_free()
	var map_scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(map_scene)
	await process_frame
	map_scene.map_id = "MAP_04"
	map_scene.map_data = MapCatalog.get_map("MAP_04")
	var protagonist_before: Vector2i = map_scene.logical_position
	map_scene._load_map_visuals()
	map_scene._refresh_encounter_interaction()
	_check(map_scene.selected_encounter_id == "ENC_05" and map_scene.encounter_button.visible, "MAP_04 exposes its supported encounter interaction")
	passed += 1
	map_scene._start_encounter()
	await process_frame
	var map_overlay: Node = map_scene.get_node_or_null("CombatOverlayG10")
	_check(map_overlay != null and map_overlay.combat.encounter_id == "ENC_05" and map_overlay.combat.units.size() == 2, "MAP_04 starts the canonical Topetao encounter")
	passed += 1
	if map_overlay != null:
		map_overlay.combat.units[0].x = 3
		map_overlay.combat.units[0].y = 3
		map_overlay.combat.units[1].x = 4
		map_overlay.combat.units[1].y = 3
		map_overlay.combat.units[1].hp = 1
		map_overlay.combat.units[0].pa = 6
		map_overlay._choose_action("attack")
		map_overlay._try_attack(map_overlay.combat.units[0], map_overlay.combat.units[1], true)
		await process_frame
		_check(map_scene._combat_overlay == null and map_scene.map_id == "MAP_04" and map_scene.logical_position == protagonist_before and map_scene.actor.visible and map_scene._encounter_state_store.is_resolved("ENC_05"), "victory returns to the same map and protagonist cell")
		passed += 1
	map_scene.queue_free()
	print("G11 encounter tests: %d passed" % passed)
	quit(0)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: " + label)
	else:
		push_error("FAIL: " + label)
		quit(1)
