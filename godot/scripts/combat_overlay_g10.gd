extends CanvasLayer
## UI and turn orchestration kept separate from the exploration controller.

signal combat_finished(result: String, remaining_hp: int)

const Rules = preload("res://scripts/combat_rules_g10.gd")
const BoardScript = preload("res://scripts/combat_board_g10.gd")
const RegistryScript = preload("res://scripts/encounter_registry_g11.gd")
const EffectsScript = preload("res://scripts/combat_effects_g18b.gd")
const AIScript = preload("res://scripts/combat_ai_g18b.gd")

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
var effects_engine: CombatEffectsG18B
var combat_ai: CombatAIG18B
var preview_target := Vector2i(-1, -1)

func configure(definition: Dictionary, state_store: EncounterStateStoreG11) -> void:
	encounter_definition = definition.duplicate(true)
	encounter_state_store = state_store

func _ready() -> void:
	name = "CombatOverlayG10"
	layer = 20
	action_rng.seed = 0xF1B12A
	effects_engine = EffectsScript.new(0xF1B12A)
	combat_ai = AIScript.new(effects_engine)
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
	var player := {"id": "player", "side": "player", "name": String(character.get("name", "Protagonista")), "x": player_cell.x, "y": player_cell.y, "hp": player_hp, "max_hp": player_hp, "strength": int(stats.get("strength", stats.get("forca", 0))), "intelligence": int(stats.get("intelligence", stats.get("inteligencia", 0))), "agility": int(stats.get("agility", stats.get("agilidade", 0))), "combat_stats": {"forca": int(stats.get("strength", stats.get("forca", 0))), "inteligencia": int(stats.get("intelligence", stats.get("inteligencia", 0))), "agilidade": int(stats.get("agility", stats.get("agilidade", 0)))}, "pa": 6, "max_pa": 6, "pm": 4, "max_pm": 4, "physical_resistance": 0.0, "magical_resistance": 0.0, "damage_bonus": 0.0, "attack_ability_id": "golpe", "ability_ids": ["golpe", "avanco", "cruz", "lanca", "fortificar"], "attack_ap": 4, "attack_damage_min": 35, "attack_damage_max": 45, "attack_range_min": 1, "attack_range_max": 1, "attack_cooldown": 2, "cooldowns": {}, "effects": [], "fortify_turns": 0, "fortify_cooldown": 0}
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
		"units": units, "turn_order": order, "turn_index": -1, "round": 0, "phase": "ENEMY", "event_sequence": 0,
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
	var actions := HFlowContainer.new()
	actions.name = "CombatActions"
	actions.add_theme_constant_override("h_separation", 6)
	actions.add_theme_constant_override("v_separation", 6)
	root.add_child(actions)
	for item in [["move", "Mover · PM"], ["golpe", "Golpe · 4 PA"], ["avanco", "Avanço · 3 PA"], ["cruz", "Cruz · 4 PA"], ["lanca", "Lança · 3 PA"], ["fortificar", "Fortificar · 2 PA"]]:
		var button := Button.new()
		button.name = String(item[0]).capitalize()
		button.text = String(item[1])
		button.custom_minimum_size = Vector2(96, 52)
		button.add_theme_font_size_override("font_size", 14)
		button.pressed.connect(_choose_action.bind(String(item[0])))
		actions.add_child(button)
		action_buttons[String(item[0])] = button
	# Keep these aliases for existing G10 automation and input hooks.
	action_buttons["attack"] = action_buttons["golpe"]
	action_buttons["fortify"] = action_buttons["fortificar"]
	end_button = Button.new()
	end_button.text = "Encerrar turno"
	end_button.custom_minimum_size = Vector2(110, 52)
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
	_layout_ui_at(get_viewport().get_visible_rect().size)

func _layout_ui_at(size: Vector2) -> void:
	var root := get_node_or_null("CombatHUD") as Control
	if root == null:
		return
	var scale := clampf(minf(size.x / 390.0, size.y / 390.0), 0.82, 1.1)
	var header := root.get_node("CombatHeader") as Control
	header.position = Vector2(12, 12)
	header.size = Vector2(minf(size.x - 24, 435 * scale), 104 * scale)
	var actions := root.get_node("CombatActions") as FlowContainer
	var buttons_width := minf(size.x - 20, 840.0)
	var columns := maxi(1, int(floor(buttons_width / 132.0)))
	var rows := ceili(float(actions.get_child_count()) / float(columns))
	var button_width := (buttons_width - float(columns - 1) * 6.0) / float(columns)
	var button_height := 60.0 * scale
	for child in actions.get_children():
		child.custom_minimum_size = Vector2(button_width, button_height)
		child.add_theme_font_size_override("font_size", int(14 * scale))
	var actions_height := float(rows) * button_height + float(rows - 1) * 6.0
	actions.position = Vector2((size.x - buttons_width) * 0.5, size.y - actions_height - 12.0)
	actions.size = Vector2(buttons_width, actions_height)
	status_label.add_theme_font_size_override("font_size", int(18 * scale))
	log_label.add_theme_font_size_override("font_size", int(13 * scale))
	action_hint.add_theme_font_size_override("font_size", int(13 * scale))
	action_hint.position = Vector2(14, actions.position.y - 28 * scale)
	action_hint.size = Vector2(size.x - 28, 26 * scale)
	var board_extent := Vector2((float(combat.width + combat.height - 2) * 30.0) + 30.0, (float(combat.width + combat.height - 2) * 15.0) + 30.0)
	var available_height := maxf(120.0, actions.position.y - header.position.y - header.size.y - 20.0)
	var board_scale := clampf(minf((size.x - 24.0) / board_extent.x, available_height / board_extent.y), 0.58, 1.5)
	board.cell_scale = board_scale
	var logical_center := Vector2(float(combat.width - combat.height) * 15.0, float(combat.width + combat.height - 2) * 15.0)
	var available_center_y := header.position.y + header.size.y + available_height * 0.5
	board.origin = Vector2(size.x * 0.5, available_center_y) - logical_center * board_scale
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
	elif effects_engine.ability_catalog().has(mode):
		var ability_data := effects_engine.ability(mode)
		if mode == "cruz" and preview_target != cell:
			var preview_check := effects_engine.validate(combat, combat.units[0], ability_data, cell)
			if preview_check.ok:
				preview_target = cell
				board.affected_cells = effects_engine.area_cells(String(ability_data.targeting.shape), cell)
				log_label.text = "Área da Cruz destacada. Toque no centro outra vez para lançar."
				board.queue_redraw()
			else:
				_try_cast(combat.units[0], mode, cell, true)
		else:
			_try_cast(combat.units[0], mode, cell, true)
	board.queue_redraw()
	_update_ui()
	get_viewport().set_input_as_handled()

func _choose_action(action: String) -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	var player: Dictionary = combat.units[0]
	if action == "move":
		mode = "move"
	else:
		var ability_id := "golpe" if action == "attack" else "fortificar" if action == "fortify" else action
		var ability_data := effects_engine.ability(ability_id)
		if ability_data.is_empty():
			return
		var cost := int(ability_data.get("apCost", 0))
		if int(player.pa) < cost or int(player.cooldowns.get(ability_id, 0)) > 0:
			log_label.text = "%s requer %d PA e recarga concluída." % [String(ability_data.get("name", ability_id)), cost]
			_update_ui()
			return
		if String(ability_data.get("targeting", {}).get("targetType", "")) == "SELF":
			_try_cast(player, ability_id, _cell(player), true)
			return
		mode = ability_id
		preview_target = Vector2i(-1, -1)
	board.set_mode(mode)
	if effects_engine.ability_catalog().has(mode):
		var active_ability := effects_engine.ability(mode)
		board.targetable_cells = effects_engine.targetable_cells(combat, player, active_ability)
	_update_ui()

func _try_cast(actor: Dictionary, ability_id: String, target_cell: Vector2i, player_action: bool) -> Dictionary:
	var result := effects_engine.cast(combat, String(actor.id), ability_id, target_cell)
	if not result.get("ok", false):
		var reason := String(result.get("reason", "ACTION"))
		var messages := {"PA": "PA insuficiente.", "RANGE": "Alvo fora do alcance.", "LOS": "Linha de visão bloqueada.", "PATH": "O avanço está bloqueado.", "COOLDOWN": "Habilidade em recarga.", "TARGET": "Alvo inválido.", "DEAD": "Combatente derrotado."}
		log_label.text = String(messages.get(reason, "Ação indisponível."))
		_update_ui()
		return result
	var target_id := String(result.get("target_unit_id", ""))
	var target := _unit_by_id(target_id) if not target_id.is_empty() else {}
	var ability_data := effects_engine.ability(ability_id)
	var damage_type := "MAGICAL"
	for effect: Dictionary in ability_data.get("effects", []):
		if String(effect.get("type", "")) == "DAMAGE":
			damage_type = String(effect.get("damageType", "PHYSICAL"))
			break
	if player_action:
		if ability_id == "fortificar":
			board.animate_player("defend", current_direction)
			board.trigger_fx("shield_block", _cell(actor))
		elif ability_id in ["cruz", "lanca"]:
			board.animate_player("cast", current_direction)
			board.trigger_fx("spell_release", _cell(actor))
		else:
			if not target.is_empty():
				current_direction = board.direction_from_step(_cell(target) - _cell(actor))
			board.animate_player("attack", current_direction)
			board.trigger_fx("physical_slash", _cell(actor))
		if ability_id == "avanco":
			board.animate_player("walk", current_direction)
	else:
		if String(actor.get("side", "")) == "mob" and String(target.get("side", "")) == "player":
			current_direction = board.direction_from_step(_cell(actor) - _cell(target))
			board.animate_player("death" if int(target.get("hp", 0)) <= 0 else "hurt", current_direction)
		for event: Dictionary in result.events:
			if String(event.get("target_id", "")) == "player" and event.type == "DAMAGE_APPLIED":
				board.trigger_fx("damage_flash", _cell(combat.units[0]))
	for event: Dictionary in result.events:
		if String(event.get("type", "")) == "STATUS_APPLIED":
			var status_target := _unit_by_id(String(event.get("target_id", "")))
			if not status_target.is_empty():
				board.trigger_fx("spell_release", _cell(status_target))
	if ability_id == "cruz":
		board.affected_cells = effects_engine.area_cells(String(ability_data.targeting.shape), target_cell)
	else:
		board.affected_cells.clear()
	board.targetable_cells.clear()
	preview_target = Vector2i(-1, -1)
	log_label.text = "%s usado; custo %d PA." % [String(ability_data.get("name", ability_id)), int(ability_data.get("apCost", 0))]
	mode = ""
	board.set_mode(mode)
	if int(combat.units[0].hp) <= 0:
		_resolve("DEFEAT")
	elif Rules.alive_enemies(combat.units).is_empty():
		_resolve("VICTORY")
	else:
		_update_ui()
	return result

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
	_try_cast(attacker, ability_id, _cell(target), player_action)

func _end_turn() -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	effects_engine.end_turn(combat, active_unit_id)
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
		effects_engine.end_turn(combat, active_unit_id)
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
	var ability_ids: Array[String] = []
	for ability_id: Variant in foe.get("ability_ids", [foe.get("attack_ability_id", "golpe")]):
		ability_ids.append(String(ability_id))
	var plan := combat_ai.choose_ability(combat, foe, ability_ids)
	if not plan.get("ok", false):
		log_label.text = "%s não encontrou ação válida (%s)." % [String(foe.get("name", foe.id)), String(plan.get("reason", "NO_PATH"))]
		return
	var route: Array = plan.get("path", [])
	if not route.is_empty():
		var old_cell := _cell(foe)
		var destination: Vector2i = route.back()
		foe.x = destination.x
		foe.y = destination.y
		foe.pm = int(foe.pm) - route.size()
		current_direction = board.direction_from_step(destination - old_cell)
		board.animate_player("walk", current_direction)
	var ability_id := String(plan.ability.get("id", ""))
	var target_cell: Vector2i = plan.target
	var result := effects_engine.cast(combat, String(foe.id), ability_id, target_cell)
	if result.get("ok", false):
		log_label.text = "%s usa %s." % [String(foe.get("name", foe.id)), String(plan.ability.get("name", ability_id))]
		if ability_id == "fortificar":
			board.trigger_fx("shield_block", _cell(foe))
		else:
			board.trigger_fx("impact" if String(plan.ability.get("targeting", {}).get("shape", "")) == "SINGLE" else "spell_release", target_cell)
		for event: Dictionary in result.events:
			if String(event.get("target_id", "")) == "player" and String(event.get("type", "")) == "DAMAGE_APPLIED":
				board.animate_player("death" if int(combat.units[0].hp) <= 0 else "hurt", current_direction)
				board.trigger_fx("defeat_marker" if int(combat.units[0].hp) <= 0 else "damage_flash", _cell(combat.units[0]))
		if int(combat.units[0].hp) <= 0:
			_resolve("DEFEAT")
		elif Rules.alive_enemies(combat.units).is_empty():
			_resolve("VICTORY")

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
	var turn_result := effects_engine.start_turn(combat, active_unit_id)
	if not turn_result.get("ok", false):
		if String(unit.side) == "player":
			_resolve("DEFEAT")
		elif Rules.alive_enemies(combat.units).is_empty():
			_resolve("VICTORY")

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
			var effects_text := _effect_summary(foe)
			enemy_status.append("%s %d/%d%s" % [foe.get("name", foe.get("canonical_id", "Inimigo")), foe.hp, foe.max_hp, " · " + effects_text if not effects_text.is_empty() else ""])
	var player_effects := _effect_summary(player)
	status_label.text = "%s · rodada %d · ativo: %s\nVida %d/%d · %d PA · %d PM%s\n%s" % [turn_text, int(combat.round), active.get("name", "—"), int(player.hp), int(player.max_hp), int(player.pa), int(player.pm), " · Efeitos: " + player_effects if not player_effects.is_empty() else "", "  |  ".join(enemy_status)]
	if mode == "move":
		action_hint.text = "Toque numa célula verde alcançável; mover custa PM conforme a distância."
	elif mode == "attack":
		action_hint.text = "Toque em um inimigo vivo para usar Golpe Pesado · 4 PA."
	elif effects_engine.ability_catalog().has(mode):
		var active_ability := effects_engine.ability(mode)
		var range_data: Dictionary = active_ability.get("range", {})
		action_hint.text = "%s · %d PA · alcance %d–%d%s" % [String(active_ability.get("name", mode)), int(active_ability.get("apCost", 0)), int(range_data.get("min", 0)), int(range_data.get("max", 0)), " · área vermelha; toque no centro duas vezes" if mode == "cruz" else ""]
	else:
		action_hint.text = "%s · toque/click numa habilidade para ver alvos, custos e alcance." % combat.encounter_id
	var player_turn := String(combat.phase) == "PLAYER" and not finished
	for action_id: String in ["move", "golpe", "avanco", "cruz", "lanca", "fortificar"]:
		var button: Button = action_buttons[action_id]
		var ability_data := effects_engine.ability(action_id) if action_id != "move" else {}
		var disabled := not player_turn
		if action_id == "move":
			disabled = disabled or int(player.pm) <= 0
		else:
			var cost := int(ability_data.get("apCost", 0))
			disabled = disabled or int(player.pa) < cost or int(player.cooldowns.get(action_id, 0)) > 0
			if String(ability_data.get("targeting", {}).get("targetType", "")) != "SELF":
				disabled = disabled or Rules.alive_enemies(combat.units).is_empty()
		button.disabled = disabled
		if action_id != "move":
			var cooldown := int(player.cooldowns.get(action_id, 0))
			button.text = "%s · CD %d" % [String(ability_data.get("name", action_id)), cooldown] if cooldown > 0 else "%s · %d PA" % [String(ability_data.get("name", action_id)), int(ability_data.get("apCost", 0))]
	end_button.disabled = not player_turn
	board.queue_redraw()

func _effect_summary(unit: Dictionary) -> String:
	var labels: Array[String] = []
	for effect: Dictionary in unit.get("effects", []):
		labels.append("%s (%d)" % [String(effect.get("status_id", effect.get("id", "estado"))), int(effect.get("duration", 0))])
	return ", ".join(labels)

func _cell(unit: Dictionary) -> Vector2i:
	return Vector2i(int(unit.x), int(unit.y))
