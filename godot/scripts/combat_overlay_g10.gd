extends CanvasLayer
## UI and turn orchestration kept separate from the exploration controller.

signal combat_finished(result: String, remaining_hp: int)

const Rules = preload("res://scripts/combat_rules_g10.gd")
const BoardScript = preload("res://scripts/combat_board_g10.gd")
const ENEMY_STATS := {"hp": 70, "pa": 6, "pm": 3, "agility": 5, "strength": 0}

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

func _ready() -> void:
	name = "CombatOverlayG10"
	layer = 20
	action_rng.seed = 0xF1B12A
	_build_model()
	board = Node2D.new()
	board.name = "TacticalBoard"
	board.set_script(BoardScript)
	add_child(board)
	var selected_frames := CharacterRoster.get_character_frames()
	board.configure(combat, selected_frames)
	_build_ui()
	_update_ui()
	get_viewport().size_changed.connect(_layout_ui)

func _build_model() -> void:
	var character := CharacterRoster.character_data(CharacterRoster.selected_id)
	var stats: Dictionary = character.get("stats", {})
	var player := {"id": "player", "side": "player", "x": 1, "y": 2, "hp": int(stats.get("health", 100)), "max_hp": int(stats.get("health", 100)), "strength": int(stats.get("strength", 0)), "agility": int(stats.get("agility", 0)), "pa": 6, "pm": 4, "physical_resistance": 0.0, "damage_bonus": 0.0, "cooldowns": {}, "fortify_turns": 0, "fortify_cooldown": 0}
	var enemy := {"id": "cascudo", "side": "mob", "canonical_id": "CRE_CASCUDO_DE_CAL", "x": 4, "y": 3, "hp": ENEMY_STATS.hp, "max_hp": ENEMY_STATS.hp, "strength": ENEMY_STATS.strength, "agility": ENEMY_STATS.agility, "pa": ENEMY_STATS.pa, "pm": ENEMY_STATS.pm, "physical_resistance": 0.0, "damage_bonus": 0.0, "cooldowns": {}, "fortify_turns": 0, "fortify_cooldown": 0}
	var units: Array[Dictionary] = [player, enemy]
	var rolls := {"player": 0.0, "cascudo": 0.0}
	var order := Rules.initiative_order([{"id": "player", "agility": player.agility}, {"id": "cascudo", "agility": enemy.agility}], rolls)
	combat = {"encounter_id": "ENC_01", "map_id": "MAP_02", "width": 8, "height": 6, "blocked": [Vector2i(3, 2), Vector2i(4, 2), Vector2i(4, 4)], "units": units, "turn_order": order, "turn_index": -1, "round": 0, "phase": "PLAYER", "result": "", "provisional_stats": true}
	_advance_turn()

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
	log_label.text = "ENC_01 · encontro comum · Cascudo-de-cal (balanceamento provisório)"
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
	elif mode == "attack" and cell == _cell(combat.units[1]):
		_try_attack(combat.units[0], combat.units[1], true)
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
	var blocked: Array[Vector2i] = combat.blocked.duplicate()
	for unit: Dictionary in combat.units:
		if int(unit.hp) > 0 and unit.id != "player":
			blocked.append(_cell(unit))
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
	var ability_id := "golpe"
	var cd: int = int(attacker.cooldowns.get(ability_id, 0))
	if cd > 0 or int(attacker.pa) < 4:
		log_label.text = "Ação indisponível: confira PA e recarga."
		return
	var result := Rules.attack(attacker, target, 35, 45, action_rng.randf(), action_rng.randf())
	if not result.ok:
		log_label.text = "Alvo fora de alcance corpo a corpo." if result.reason == "RANGE" else "PA insuficiente."
		return
	attacker.cooldowns[ability_id] = 2
	log_label.text = "%s causa %d de dano%s." % ["Você" if player_action else "Cascudo-de-cal", int(result.amount), " crítico" if result.critical else ""]
	if player_action:
		current_direction = board.direction_from_step(_cell(target) - _cell(attacker))
		board.animate_player("attack", current_direction)
		board.trigger_fx("physical_slash", _cell(attacker))
		board.trigger_fx("impact", _cell(target))
	else:
		current_direction = board.direction_from_step(_cell(attacker) - _cell(target))
		board.animate_player("death" if int(target.hp) <= 0 else "hurt", current_direction)
		board.trigger_fx("defeat_marker" if int(target.hp) <= 0 else "damage_flash", _cell(target))
	mode = ""
	board.set_mode(mode)
	if int(target.hp) <= 0:
		_resolve("VICTORY" if player_action else "DEFEAT")
		return
	_update_ui()

func _end_turn() -> void:
	if finished or String(combat.phase) != "PLAYER":
		return
	mode = ""
	combat.phase = "ENEMY"
	_advance_turn()
	_enemy_turn()

func _enemy_turn() -> void:
	if finished:
		return
	var foe: Dictionary = combat.units[1]
	var player: Dictionary = combat.units[0]
	if Rules.manhattan(_cell(foe), _cell(player)) > 1:
		var blocked: Array[Vector2i] = []
		for blocked_cell: Vector2i in combat.blocked:
			blocked.append(blocked_cell)
		blocked.append(_cell(player))
		var best_path: Array[Vector2i] = []
		var best_goal := Vector2i(-1, -1)
		for y in combat.height:
			for x in combat.width:
				var candidate := Vector2i(x, y)
				if candidate == _cell(foe) or blocked.has(candidate) or Rules.manhattan(candidate, _cell(player)) != 1:
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
			log_label.text = "Cascudo-de-cal não alcança um espaço de ataque neste turno."
	if Rules.manhattan(_cell(foe), _cell(player)) == 1:
		_try_attack(foe, player, false)
	if finished:
		return
	combat.phase = "PLAYER"
	_advance_turn()
	board.animate_player("idle", current_direction)
	mode = ""
	board.set_mode("")
	_update_ui()

func _advance_turn() -> void:
	combat.turn_index = (int(combat.turn_index) + 1) % combat.turn_order.size()
	if int(combat.turn_index) == 0:
		combat.round = int(combat.round) + 1
	var id := String(combat.turn_order[int(combat.turn_index)])
	var unit: Dictionary = combat.units[0] if id == "player" else combat.units[1]
	unit.pa = 6
	unit.pm = 4 if id == "player" else ENEMY_STATS.pm
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

func _resolve(result: String) -> void:
	finished = true
	resolved = result == "VICTORY"
	combat.result = result
	result_panel.visible = true
	retry_button.visible = result == "DEFEAT"
	result_label.text = "Vitória!" if result == "VICTORY" else "Derrota"
	log_label.text = "ENC_01 concluído nesta sessão." if resolved else "O personagem caiu. Reinicie o encontro para tentar novamente."
	_update_ui()
	combat_finished.emit(result, int(combat.units[0].hp))

func _retry_encounter() -> void:
	combat.clear()
	_build_model()
	finished = false
	resolved = false
	mode = ""
	result_panel.hide()
	board.configure(combat, CharacterRoster.get_character_frames())
	board.set_mode("")
	_update_ui()

func _update_ui() -> void:
	if status_label == null or combat.is_empty():
		return
	var player: Dictionary = combat.units[0]
	var foe: Dictionary = combat.units[1]
	var turn_text := "Seu turno" if String(combat.phase) == "PLAYER" else "Turno inimigo"
	status_label.text = "%s · rodada %d\nVida %d/%d · %d PA · %d PM   |   Cascudo %d/%d" % [turn_text, int(combat.round), int(player.hp), int(player.max_hp), int(player.pa), int(player.pm), int(foe.hp), int(foe.max_hp)]
	action_hint.text = "Toque numa célula verde para mover." if mode == "move" else "Toque no Cascudo adjacente para atacar." if mode == "attack" else "ENC_01 · clique/toque para selecionar células."
	var player_turn := String(combat.phase) == "PLAYER" and not finished
	for button in action_buttons.values():
		button.disabled = not player_turn
	end_button.disabled = not player_turn
	action_buttons["attack"].disabled = not player_turn or int(player.pa) < 4 or int(player.cooldowns.get("golpe", 0)) > 0
	action_buttons["fortify"].disabled = not player_turn or int(player.pa) < 2 or int(player.fortify_cooldown) > 0
	board.queue_redraw()

func _cell(unit: Dictionary) -> Vector2i:
	return Vector2i(int(unit.x), int(unit.y))
