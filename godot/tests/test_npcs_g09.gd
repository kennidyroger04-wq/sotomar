extends SceneTree

const Dialogues = preload("res://scripts/npc_dialogue_catalog.gd")
const Logic = preload("res://scripts/iso_board_logic.gd")

var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var canonical := Dialogues.all()
	var registry: Dictionary = canonical.get("npcs", {})
	_check(registry.size() == 4, "four canonical MAP_01 NPC dialogue records load")
	_check(String(registry.get("guarda_mira", {}).get("greeting", "")) == "A estrada precisa de olhos atentos. Posso confiar uma tarefa a você?", "Mira greeting matches original JavaScript data")
	_check(String(registry.get("exploradora_lia", {}).get("greeting", "")) == "As trilhas mudam depois da ponte. Posso compartilhar o que aprendi.", "Lia greeting matches original JavaScript data")
	_check(String(registry.get("curandeiro_nilo", {}).get("greeting", "")) == "Minhas ervas estão prontas. Deseja recuperar suas forças?", "Nilo greeting matches original JavaScript data")
	_check(String(registry.get("mercador_bram", {}).get("greeting", "")) == "Estou organizando minhas mercadorias. Volte em breve; ainda não negocio por aqui.", "Bram greeting matches original JavaScript data")
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	_check(scene.talk_button != null and scene.dialogue_panel != null, "responsive talk action and reusable dialogue panel exist")
	_check(scene.talk_button.visible and scene.talk_button.text.contains("Nilo"), "nearby Nilo is offered as a touch and keyboard accessible action")
	_check(scene.talk_button.custom_minimum_size.y >= 48.0 and scene.dialogue_advance.custom_minimum_size.y >= 48.0, "talk and dialogue controls meet a 48-pixel target")
	var body_sprite := scene.actor.get_node("CharacterSprite") as AnimatedSprite2D
	var frame_size := body_sprite.sprite_frames.get_frame_texture("idle_se", 0).get_size()
	var foot_pivot_offset := (152.0 - frame_size.y * 0.5 + body_sprite.offset.y) * body_sprite.scale.y
	_check(is_zero_approx(foot_pivot_offset), "selected protagonist foot pivot mathematically aligns with logical cell origin")
	var nilo: Node2D = scene.scenery.get_node("NPC_curandeiro_nilo")
	_check(scene._npc_distance(nilo) == 1, "interaction uses the canonical Manhattan radius of one cell")
	var screen_nilo: Vector2 = scene.get_viewport().get_canvas_transform() * (nilo.global_position + Vector2(0, -18))
	_check(scene._npc_at_screen(screen_nilo) == nilo, "touch and mouse hit testing resolves the visible NPC marker")
	var mouse_tap := InputEventMouseButton.new()
	mouse_tap.button_index = MOUSE_BUTTON_LEFT
	mouse_tap.pressed = true
	mouse_tap.position = screen_nilo
	scene._last_touch_msec = -10000
	scene._handle_mouse_button(mouse_tap)
	_check(scene._dialogue_is_open(), "mouse click on a reachable NPC opens conversation")
	scene._close_dialogue()
	scene._handle_touch_tap(screen_nilo)
	await process_frame
	_check(scene._dialogue_is_open() and scene.dialogue_name.text == "Nilo, Curandeiro", "touching a reachable NPC opens the canonical conversation")
	_check(scene.dialogue_text.text == registry.curandeiro_nilo.greeting, "dialogue displays the canonical greeting")
	var start_position: Vector2i = scene.logical_position
	scene._move_to(start_position + Vector2i.RIGHT)
	await process_frame
	_check(scene.logical_position == start_position, "movement is locked while dialogue is open")
	scene._advance_dialogue()
	_check(not scene._dialogue_is_open(), "advance closes a single-line dialogue")
	_check(scene.talk_button.visible, "closing dialogue restores nearby NPC action")
	var keyboard_interaction := InputEventKey.new()
	keyboard_interaction.pressed = true
	keyboard_interaction.keycode = KEY_E
	scene._unhandled_input(keyboard_interaction)
	_check(scene._dialogue_is_open(), "keyboard E opens the nearby dialogue")
	var keyboard_close := InputEventKey.new()
	keyboard_close.pressed = true
	keyboard_close.keycode = KEY_ESCAPE
	scene._unhandled_input(keyboard_close)
	_check(not scene._dialogue_is_open(), "Escape closes the conversation")
	var mira: Node2D = scene.scenery.get_node("NPC_guarda_mira")
	scene.logical_position = Vector2i(1, 2)
	scene._refresh_npc_interaction()
	_check(scene._npc_distance(mira) == 1 and scene.talk_button.text.contains("Mira"), "Mira becomes interactable when the actor reaches one cell")
	scene.logical_position = Vector2i(6, 5)
	scene._refresh_npc_interaction()
	scene._interact_with_npc(mira)
	_check(not scene._dialogue_is_open() and scene._last_notice.contains("Aproxime-se"), "distant NPC selection gives clear proximity feedback")
	for viewport_size in [Vector2i(390, 844), Vector2i(844, 390), Vector2i(1280, 720)]:
		scene._layout_interaction_ui(Vector2(viewport_size))
		await process_frame
		_check(scene.dialogue_panel.position.x >= 0 and scene.dialogue_panel.position.y + scene.dialogue_panel.size.y <= viewport_size.y, "dialogue panel fits viewport %s" % str(viewport_size))
		_check(scene.dialogue_advance.position.x >= 0 and scene.dialogue_advance.position.y + scene.dialogue_advance.size.y <= viewport_size.y, "dialogue action fits viewport %s" % str(viewport_size))
	scene.queue_free()
	if failures == 0:
		print("PASS: G09 NPC, canonical dialogue, accessibility, and responsive UI checks")
		quit(0)
	else:
		push_error("%d G09 checks failed" % failures)
		quit(1)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
