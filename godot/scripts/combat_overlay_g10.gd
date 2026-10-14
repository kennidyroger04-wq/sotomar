extends CanvasLayer
## UI and turn orchestration kept separate from the exploration controller.

signal combat_finished(result: String, remaining_hp: int)

const Rules = preload("res://scripts/combat_rules_g10.gd")
const BoardScript = preload("res://scripts/combat_board_g10.gd")
const RegistryScript = preload("res://scripts/encounter_registry_g11.gd")

var combat: Dictionary = {}
var board: Node2D
var status_label: Label
var log_label: Label
var action_hint: Label
var action_buttons: Dictionary = {}
var end_button: Button
var result_panel: PanelContainer
var result_label: Label
var retry_button: Button
var mode := ""
var finished := false
var resolved := false
var action_rng := RandomNumberGenerator.new()
var current_direction := "se"
var encounter_definition: Dictionary = {}
var encounter_state_store: EncounterStateStoreG11
var active_unit_id := ""
var result_record: Dictionary = {}

func configure(definition: Dictionary, state_store: EncounterStateStoreG11) -> void:
	encounter_definition = definition.duplicate(true)
	encounter_state_store = state_store

func _ready() -> void:
	name = "CombatOverlayG10"
	layer = 20
	action_rng.seed = 0xF1B12A
	if encounter_definition.is_empty():
		var registry := RegistryScript.new()
		var built: Dictionary = registry.combat_definition("ENC_01")
		if not built.get("ok", false):
			push_error("Could not prepare fallback encounter ENC_01")
			return
		encounter_definition = built
	_build_model()
	board = Node2D.new()
	board.name = "TacticalBoard"
	board.set_script(BoardScript)
	add_child(board)
	var selected_frames := CharacterRoster.get_character_frames()
	board.configure(combat, selected_frames)
	_build_ui()
	_advance_turn()
	_run_enemy_queue()
	_update_ui()
	get_viewport().size_changed.connect(_layout_ui)

func _build_model() -> void:
	var character := CharacterRoster.character_data(CharacterRoster.selected_id)
	var stats: Dictionary = character.get("stats", {})
	var player_cell: Vector2i = encounter_definition.get("player_cell", Vector2i(1, 2))
	var player_hp := int(encounter_definition.get("player_hp", stats.get("health", 100)))
	var player := {"id": "player", "side": "player", "name": String(character.get("name", "Protagonista")), "x": player_cell.x, "y": player_cell.y, "hp": player_hp, "max_hp": player_hp, "strength": int(stats.get("strength", 0)), "agility": int(stats.get("agility", 0)), "pa": 6, "max_pa": 6, "pm": 4, "max_pm": 4, "physical_resistance": 0.0, "magical_resistance": 0.0, "damage_bonus": 0.0, "attack_ability_id": "golpe", "attack_ap": 4, "attack_damage_min": 35, "attack_damage_max": 45, "attack_range_min": 1, "attack_range_max": 1, "attack_cooldown": 2, "cooldowns": {}, "fortify_turns": 0, "fortify_cooldown": 0}
	var units: Array[Dictionary] = [player]
	for enemy: Dictionary in encounter_definition.get("enemies", []):
		units.append(enemy.duplicate(true))
	var initial_order: Array[Dictionary] = []
	for unit: Dictionary in units:
		initial_order.append({"id": unit.id, "agility": unit.agility})
	var order := Rules.initiative_order(initial_order)
	combat = {
		"encounter_id": String(encounter_definition.get("encounter_id", "ENC_01")),
		"map_id": String(encounter_definition.get("map_id", "MAP_02")),
		"width": int(encounter_definition.get("width", 8)), "height": int(encounter_definition.get("height", 6)),
		"blocked": encounter_definition.get("blocked", [Vector2i(3, 2), Vector2i(4, 2), Vector2i(4, 4)]).duplicate(),
		"units": units, "turn_order": order, "turn_index": -1, "round": 0, "phase": "ENEMY",
		"result": "", "provisional_stats": true, "composition": encounter_definition.get("composition", []).duplicate(true)
	}
	active_unit_id = ""
	result_record.clear()

func _build_ui() -> void:
	var root := Control.new()
	root.name = "CombatHUD"
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	var header := PanelContainer.new()
	header.name = "CombatHeader"
	header.position = Vector2(14, 12)
	header.size = Vector2(410, 100)
	header.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	root.add_child(header)
	var header_stack := VBoxContainer.new()
	header.add_child(header_stack)
	status_label = Label.new()
	status_label.add_theme_color_override("font_color", Color("fff3ce"))
	status_label.add_theme_font_size_override("font_size", 19)
	header_stack.add_child(status_label)
	log_label = Label.new()
	log_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	log_label.add_theme_color_override("font_color", Color("edf3e5"))
	log_label.add_theme_font_size_override("font_size", 14)
	var encounter_names: Array[String] = []
	var provisional_balance := false
	for member: Dictionary in encounter_definition.get("composition", []):
		encounter_names.append(String(member.get("name", member.get("creature_id", "Criatura"))))
		provisional_balance = provisional_balance or bool(member.get("stats", {}).get("provisional_balance", false))
	log_label.text = "%s · %s%s" % [String(encounter_definition.get("encounter_id", "ENCONTRO")), " + ".join(encounter_names), " (balanceamento provisório)" if provisional_balance else ""]
	header_stack.add_child(log_label)
	var actions := HBoxContainer.new()
	actions.name = "CombatActions"
	root.add_child(actions)
	for item in [["move", "Mover"], ["attack", "Golpe 4 PA"], ["fortify", "Defender 2 PA"]]:
		var button := Button.new()
		button.name = String(item[0]).capitalize()
		button.text = String(item[1])
		button.custom_minimum_size = Vector2(126, 58)
		button.add_theme_font_size_override("font_size", 16)
		button.pressed.connect(_choose_action.bind(String(item[0])))
		actions.add_child(button)
		action_buttons[String(item[0])] = button
	end_button = Button.new()
	end_button.text = "Encerrar turno"
	end_button.custom_minimum_size = Vector2(150, 58)
	end_button.add_theme_font_size_override("font_size", 16)
	end_button.pressed.connect(_end_turn)
	actions.add_child(end_button)
	action_hint = Label.new()
	action_hint.add_theme_color_override("font_color", Color("fff3ce"))
	action_hint.add_theme_font_size_override("font_size", 15)
	root.add_child(action_hint)
	result_panel = PanelContainer.new()
	result_panel.visible = false
	result_panel.position = Vector2(0, 0)
	result_panel.custom_minimum_size = Vector2(320, 180)
	root.add_child(result_panel)
	var result_stack := VBoxContainer.new()
	result_panel.add_child(result_stack)
	result_label = Label.new()
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_label.add_theme_font_size_override("font_size", 24)
	result_stack.add_child(result_label)
	retry_button = Button.new()
	retry_button.text = "Reiniciar encontro"
	retry_button.custom_minimum_size = Vector2(0, 54)
	retry_button.pressed.connect(_retry_encounter)
	result_stack.add_child(retry_button)
	_layout_ui()

func _layout_ui() -> void:
	var root := get_node_or_null("CombatHUD") as Control
	if root == null:
		return
	var size := get_viewport().get_visible_rect().size
	var scale := 2.0 if size.x < size.y else clampf(size.x / 960.0, 0.82, 1.35)
	var board_scale := scale if size.x < size.y else 1.0
	board.cell_scale = board_scale
	var header := root.get_node("CombatHeader") as Control
	header.position = Vector2(12, 12)
	header.size = Vector2(minf(size.x - 24, 435 * scale), 92 * scale)
	var actions := root.get_node("CombatActions") as Control
	var buttons_width := minf(size.x - 20, 560 * scale)
	actions.position = Vector2((size.x - buttons_width) * 0.5, size.y - 76 * scale)
	actions.size = Vector2(buttons_width, 62 * scale)
	for child in actions.get_children():
		child.custom_minimum_size = Vector2(buttons_width / 4.0 - 5, 58 * scale)
		child.add_theme_font_size_override("font_size", int(15 * scale))
	status_label.add_theme_font_size_override("font_size", int(19 * scale))
	log_label.add_theme_font_size_override("font_size", int(14 * scale))
	action_hint.add_theme_font_size_override("font_size", int(15 * scale))
	action_hint.position = Vector2(14, size.y - 110 * scale)
	action_hint.size = Vector2(size.x - 28, 30 * scale)
	result_panel.position = (size - Vector2(320, 180)) * 0.5
	result_panel.size = Vector2(minf(320, size.x - 28), 180)
	if board != null:
		board.queue_redraw()

func _unhandled_input(event: InputEvent) -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	var point := Vector2.ZERO
	if event is InputEventScreenTouch and event.pressed:
		point = event.position
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		point = event.position
	else:
		return
	var cell: Vector2i = board.screen_to_cell(point)
	if cell.x < 0 or cell.y < 0 or cell.x >= combat.width or cell.y >= combat.height:
		return
	board.selected_cell = cell
	if mode == "move":
		_try_move(cell)
	elif mode == "attack":
		var target: Dictionary = board.unit_at(cell)
		if not target.is_empty() and String(target.get("side", "")) == "mob":
			_try_attack(combat.units[0], target, true)
		else:
			log_label.text = "Toque em um inimigo vivo para selecionar o alvo."
	board.queue_redraw()
	_update_ui()
	get_viewport().set_input_as_handled()

func _choose_action(action: String) -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	var player: Dictionary = combat.units[0]
	if action == "move":
		mode = "move"
	elif action == "attack":
		if int(player.pa) < 4 or int(player.cooldowns.get("golpe", 0)) > 0:
			log_label.text = "Golpe Pesado requer 4 PA e recarga concluída."
			_update_ui()
			return
		mode = "attack"
	elif action == "fortify":
		if not Rules.apply_fortify(player):
			log_label.text = "Postura Fortificada requer 2 PA e recarga concluída."
			_update_ui()
			return
		log_label.text = "Postura Fortificada: resistência física +20% por dois turnos próprios."
		board.animate_player("defend", current_direction)
		board.trigger_fx("shield_block", _cell(player))
		mode = ""
	board.set_mode(mode)
	_update_ui()

func _try_move(destination: Vector2i) -> void:
	var player: Dictionary = combat.units[0]
	var previous_position := _cell(player)
	var blocked: Array[Vector2i] = []
	for cell: Vector2i in combat.blocked:
		blocked.append(cell)
	blocked.append_array(Rules.occupied_cells(combat.units, "player"))
	var outcome := Rules.move_unit(player, destination, blocked)
	if outcome.ok:
		log_label.text = "Movimento: %d PM consumidos." % int(outcome.distance)
		current_direction = board.direction_from_step(destination - previous_position)
		board.animate_player("walk", current_direction)
		mode = ""
	else:
		log_label.text = "Célula inválida, bloqueada ou além dos PM disponíveis."
	board.set_mode(mode)
	_update_ui()

func _try_attack(attacker: Dictionary, target: Dictionary, player_action: bool) -> void:
	var ability_id := String(attacker.get("attack_ability_id", "golpe"))
	var cd: int = int(attacker.cooldowns.get(ability_id, 0))
	var ap_cost := int(attacker.get("attack_ap", 4))
	if cd > 0 or int(attacker.pa) < ap_cost:
		log_label.text = "Ação indisponível: confira PA e recarga."
		return
	var result := Rules.attack(
		attacker, target,
		int(attacker.get("attack_damage_min", 35)), int(attacker.get("attack_damage_max", 45)),
		action_rng.randf(), action_rng.randf(),
		int(attacker.get("attack_range_min", 1)), int(attacker.get("attack_range_max", 1)), ap_cost
	)
	if not result.ok:
		log_label.text = "Alvo fora do alcance desta habilidade." if result.reason == "RANGE" else "PA insuficiente."
		return
	attacker.cooldowns[ability_id] = int(attacker.get("attack_cooldown", 2))
	log_label.text = "%s causa %d de dano%s." % [String(attacker.get("name", "Você" if player_action else "Inimigo")), int(result.amount), " crítico" if result.critical else ""]
	if player_action:
		current_direction = board.direction_from_step(_cell(target) - _cell(attacker))
		board.animate_player("attack", current_direction)
		board.trigger_fx("physical_slash", _cell(attacker))
		board.trigger_fx("impact", _cell(target))
	else:
		current_direction = board.direction_from_step(_cell(attacker) - _cell(target))
		if String(target.side) == "player":
			board.animate_player("death" if int(target.hp) <= 0 else "hurt", current_direction)
		board.trigger_fx("defeat_marker" if int(target.hp) <= 0 else "damage_flash", _cell(target))
	mode = ""
	board.set_mode(mode)
	if int(combat.units[0].hp) <= 0:
		_resolve("DEFEAT")
		return
	if Rules.alive_enemies(combat.units).is_empty():
		_resolve("VICTORY")
		return
	_update_ui()

func _end_turn() -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	mode = ""
	_advance_turn()
	_run_enemy_queue()
	_update_ui()

func _run_enemy_queue() -> void:
	var visited := 0
	while not finished and String(combat.phase) == "ENEMY" and visited < combat.turn_order.size():
		_enemy_turn()
		if finished:
			return
		_advance_turn()
		visited += 1
	board.animate_player("idle", current_direction)
	mode = ""
	board.set_mode("")
	_update_ui()

func _enemy_turn() -> void:
	if finished or String(combat.phase) != "ENEMY":
		return
	var foe := _unit_by_id(active_unit_id)
	if foe.is_empty() or int(foe.get("hp", 0)) <= 0:
		return
	var player: Dictionary = combat.units[0]
	var min_range := int(foe.get("attack_range_min", 1))
	var max_range := int(foe.get("attack_range_max", 1))
	var distance := Rules.manhattan(_cell(foe), _cell(player))
	if distance < min_range or distance > max_range:
		var blocked: Array[Vector2i] = []
		for blocked_cell: Vector2i in combat.blocked:
			blocked.append(blocked_cell)
		blocked.append_array(Rules.occupied_cells(combat.units, String(foe.id)))
		var best_path: Array[Vector2i] = []
		var best_goal := Vector2i(-1, -1)
		for y in combat.height:
			for x in combat.width:
				var candidate := Vector2i(x, y)
				var candidate_distance := Rules.manhattan(candidate, _cell(player))
				if candidate == _cell(foe) or blocked.has(candidate) or candidate_distance < min_range or candidate_distance > max_range:
					continue
				var route := Rules.path(_cell(foe), candidate, blocked, combat.width, combat.height)
				if not route.is_empty() and route.size() <= int(foe.pm) and (best_goal.x < 0 or route.size() < best_path.size() or (route.size() == best_path.size() and (candidate.y < best_goal.y or (candidate.y == best_goal.y and candidate.x < best_goal.x)))):
					best_path.assign(route)
					best_goal = candidate
		if best_goal.x >= 0:
			foe.x = best_goal.x
			foe.y = best_goal.y
			foe.pm -= best_path.size()
		else:
			log_label.text = "%s não alcança uma posição de ataque." % foe.get("name", foe.id)
	if Rules.manhattan(_cell(foe), _cell(player)) >= min_range and Rules.manhattan(_cell(foe), _cell(player)) <= max_range:
		_try_attack(foe, player, false)

func _advance_turn() -> void:
	if combat.turn_order.is_empty():
		return
	combat.turn_index = (int(combat.turn_index) + 1) % combat.turn_order.size()
	if int(combat.turn_index) == 0:
		combat.round = int(combat.round) + 1
	active_unit_id = String(combat.turn_order[int(combat.turn_index)])
	var unit := _unit_by_id(active_unit_id)
	if unit.is_empty():
		return
	combat.phase = "PLAYER" if String(unit.side) == "player" else "ENEMY"
	unit.pa = 6
	unit.pm = int(unit.get("max_pm", 4))
	for key in unit.cooldowns.keys():
		unit.cooldowns[key] = maxi(0, int(unit.cooldowns[key]) - 1)
		if int(unit.cooldowns[key]) == 0:
			unit.cooldowns.erase(key)
	if int(unit.fortify_turns) > 0:
		unit.fortify_turns = int(unit.fortify_turns) - 1
		if int(unit.fortify_turns) == 0:
			unit.physical_resistance = 0.0
	if int(unit.fortify_cooldown) > 0:
		unit.fortify_cooldown = int(unit.fortify_cooldown) - 1

func _unit_by_id(unit_id: String) -> Dictionary:
	for unit: Dictionary in combat.get("units", []):
		if String(unit.get("id", "")) == unit_id:
			return unit
	return {}

func _resolve(result: String) -> void:
	finished = true
	resolved = result == "VICTORY"
	combat.result = result
	var killed_units: Array[Dictionary] = []
	for unit: Dictionary in combat.units:
		if String(unit.get("side", "")) == "mob" and int(unit.get("hp", 0)) <= 0:
			killed_units.append({"combatant_id": unit.id, "creature_id": unit.canonical_id})
	var events: Array[Dictionary] = []
	if resolved:
		for unit: Dictionary in killed_units:
			events.append({"type": "MOB_KILLED", "combatantId": unit.combatant_id, "creatureId": unit.creature_id})
		events.append({"type": "ENCOUNTER_RESOLVED", "encounterId": combat.encounter_id})
	result_record = {
		"encounter_id": combat.encounter_id, "map_id": combat.map_id, "outcome": result,
		"round": combat.round, "player_hp": combat.units[0].hp,
		"defeated_units": killed_units, "events": events,
		"reward_candidates": encounter_definition.get("encounter_rewards", []).duplicate(true),
		"rewards_applied": false
	}
	if encounter_state_store != null:
		encounter_state_store.finish(String(combat.encounter_id), result, result_record, result_record.reward_candidates)
	result_panel.visible = true
	retry_button.visible = result == "DEFEAT"
	result_label.text = "Vitória!" if result == "VICTORY" else "Derrota"
	log_label.text = "%s concluído nesta sessão." % combat.encounter_id if resolved else "O personagem caiu. Reinicie o encontro para tentar novamente."
	_update_ui()
	combat_finished.emit(result, int(combat.units[0].hp))

func _retry_encounter() -> void:
	if encounter_state_store != null:
		var attempt: Dictionary = encounter_state_store.start(String(encounter_definition.encounter_id), false)
		if not attempt.get("ok", false):
			log_label.text = "Este encontro não pode ser reiniciado agora."
			return
	combat.clear()
	_build_model()
	finished = false
	resolved = false
	mode = ""
	result_panel.hide()
	board.configure(combat, CharacterRoster.get_character_frames())
	board.set_mode("")
	_advance_turn()
	_run_enemy_queue()
	_update_ui()

func _update_ui() -> void:
	if status_label == null or combat.is_empty():
		return
	var player: Dictionary = combat.units[0]
	var turn_text := "Seu turno" if String(combat.phase) == "PLAYER" else "Turno inimigo"
	var active := _unit_by_id(active_unit_id)
	var enemy_status: Array[String] = []
	for foe: Dictionary in combat.units:
		if String(foe.get("side", "")) == "mob":
			enemy_status.append("%s %d/%d" % [foe.get("name", foe.get("canonical_id", "Inimigo")), foe.hp, foe.max_hp])
	status_label.text = "%s · rodada %d · ativo: %s\nVida %d/%d · %d PA · %d PM\n%s" % [turn_text, int(combat.round), active.get("name", "—"), int(player.hp), int(player.max_hp), int(player.pa), int(player.pm), "  |  ".join(enemy_status)]
	action_hint.text = "Toque numa célula verde para mover." if mode == "move" else "Toque em qualquer inimigo vivo para atacar." if mode == "attack" else "%s · toque/click para selecionar células." % combat.encounter_id
	var player_turn := String(combat.phase) == "PLAYER" and not finished
	for button in action_buttons.values():
		button.disabled = not player_turn
	end_button.disabled = not player_turn
	action_buttons["attack"].disabled = not player_turn or int(player.pa) < 4 or int(player.cooldowns.get("golpe", 0)) > 0 or Rules.alive_enemies(combat.units).is_empty()
	action_buttons["fortify"].disabled = not player_turn or int(player.pa) < 2 or int(player.fortify_cooldown) > 0
	board.queue_redraw()

func _cell(unit: Dictionary) -> Vector2i:
	return Vector2i(int(unit.x), int(unit.y))
