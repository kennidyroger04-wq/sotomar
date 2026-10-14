extends Node2D

const DIRS := ["se", "sw", "nw", "ne"]
const WAY_ACTIONS := ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
const ENEMY_ACTIONS := ["idle", "walk", "attack", "hurt", "death"]
const EFFECTS := ["physical_slash", "impact", "shield_block", "damage_flash", "defeat_marker", "spell_release"]
const Logic = preload("res://scripts/iso_board_logic.gd")

var rigs: Array[Node2D] = []
var active_index := 0
var direction_index := 0
var current_effect := 0
var fx: Node2D
var status_label: Label
var active_action := "idle"
var demo_ready := false

func _ready() -> void:
	var way_frames := load("res://resources/combat/wayfarer_combat_g05.tres") as SpriteFrames
	var enemy_frames := load("res://resources/combat/moss_raider_combat_g05.tres") as SpriteFrames
	var equipment_frames := load("res://resources/combat/wayfarer_equipment_g05.tres") as SpriteFrames
	if way_frames == null or enemy_frames == null or equipment_frames == null:
		push_error("G05 combat animation resources failed to load.")
		return
	rigs_setup(way_frames, enemy_frames, equipment_frames)
	fx = Node2D.new()
	fx.name = "CombatFX"
	fx.set_script(load("res://scripts/combat_fx_g05.gd"))
	fx.z_index = 20
	add_child(fx)
	_build_hud()
	demo_ready = true
	_update_hud()

func rigs_setup(way_frames: SpriteFrames, enemy_frames: SpriteFrames, equipment_frames: SpriteFrames) -> void:
	var way := _make_rig("Wayfarer", "Wayfarer", way_frames, Vector2(340, 426), 0.5, true, equipment_frames)
	var enemy := _make_rig("MossRaider", "Moss Raider", enemy_frames, Vector2(650, 426), 0.48, false, equipment_frames)
	rigs_add(way)
	rigs_add(enemy)

func rigs_add(rig: Node2D) -> void:
	rigs.append(rig)
	add_child(rig)

func _make_rig(node_name: String, title: String, frames: SpriteFrames, feet_position: Vector2, display_scale: float, can_equip: bool, equipment: SpriteFrames) -> Node2D:
	var rig := Node2D.new()
	rig.name = node_name
	rig.position = feet_position
	rig.set_meta("title", title)
	rig.set_meta("logical_cell", Vector2i(4 if can_equip else 6, 5))
	rig.z_index = int(rig.get_meta("logical_cell").x + rig.get_meta("logical_cell").y)
	rig.set_meta("current_action", "idle")
	var shadow := Polygon2D.new()
	shadow.name = "GroundShadow"
	var points := PackedVector2Array()
	for i in 20:
		var a := TAU * float(i) / 20.0
		points.append(Vector2(cos(a) * 30.0, sin(a) * 8.0 - 1.0))
	shadow.polygon = points
	shadow.color = Color(0.02, 0.025, 0.03, 0.4)
	shadow.z_index = -1
	rig.add_child(shadow)
	var body := AnimatedSprite2D.new()
	body.name = "Body"
	body.sprite_frames = frames
	body.centered = true
	body.offset = Vector2(0, -72)
	body.scale = Vector2.ONE * display_scale
	body.z_index = 2
	rig.add_child(body)
	body.animation_finished.connect(_on_animation_finished.bind(rig))
	body.frame_changed.connect(_on_frame_changed.bind(rig))
	if can_equip:
		var sword := AnimatedSprite2D.new()
		sword.name = "SwordLayer"
		sword.sprite_frames = equipment
		sword.animation = "sword_se"
		sword.centered = true
		sword.offset = Vector2(24, -50)
		sword.scale = Vector2.ONE * display_scale
		sword.z_index = 3
		rig.add_child(sword)
		var shield := AnimatedSprite2D.new()
		shield.name = "ShieldLayer"
		shield.sprite_frames = equipment
		shield.animation = "shield_se"
		shield.centered = true
		shield.offset = Vector2(0, -72)
		shield.scale = Vector2.ONE * display_scale
		shield.z_index = 4
		rig.add_child(shield)
		rig.set_meta("can_equip", true)
	else:
		rig.set_meta("can_equip", false)
	_set_equipment_direction(rig, DIRS[direction_index])
	body.animation = "idle_se"
	body.play()
	return rig

func _set_equipment_direction(rig: Node2D, direction: String) -> void:
	if not rig.has_meta("can_equip") or not bool(rig.get_meta("can_equip")):
		return
	for node_name in ["SwordLayer", "ShieldLayer"]:
		var layer := rig.get_node(node_name) as AnimatedSprite2D
		var slot := "sword" if node_name == "SwordLayer" else "shield"
		layer.animation = "%s_%s" % [slot, direction]
		layer.frame = 0

func _build_hud() -> void:
	var ui := CanvasLayer.new()
	ui.name = "HUD"
	add_child(ui)
	status_label = Label.new()
	status_label.name = "Status"
	status_label.position = Vector2(18, 14)
	status_label.add_theme_font_size_override("font_size", 17)
	status_label.add_theme_color_override("font_color", Color(0.95,0.95,0.88))
	ui.add_child(status_label)
	var instructions := Label.new()
	instructions.position = Vector2(18, 540)
	instructions.add_theme_font_size_override("font_size", 14)
	instructions.add_theme_color_override("font_color", Color(0.85,0.88,0.9))
	instructions.text = "TAB personagem · ←/→ direção · 1 idle · 2 walk · 3 attack · 4 hurt · 5 defend · 6 cast · 7 defeat\nG equipamento · F efeito · espaço repetir · ações em azul têm suporte específico por personagem"
	ui.add_child(instructions)

func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo or not demo_ready:
		return
	match event.keycode:
		KEY_TAB:
			active_index = (active_index + 1) % rigs.size(); _update_hud()
		KEY_LEFT:
			direction_index = (direction_index + 3) % 4; _apply_action(active_action)
		KEY_RIGHT:
			direction_index = (direction_index + 1) % 4; _apply_action(active_action)
		KEY_1: _apply_action("idle")
		KEY_2: _apply_action("walk")
		KEY_3: _apply_action("attack")
		KEY_4: _apply_action("hurt")
		KEY_5: _apply_action("defend")
		KEY_6: _apply_action("cast")
		KEY_7: _apply_action("death")
		KEY_G: _toggle_equipment()
		KEY_F: _trigger_next_effect()
		KEY_SPACE: _replay_action()

func _apply_action(action: String) -> void:
	var rig := rigs[active_index]
	var actions: Array = WAY_ACTIONS if active_index == 0 else ENEMY_ACTIONS
	var resolved := action
	if not actions.has(action):
		resolved = "attack" if action == "cast" else "hurt" if action == "defend" else "idle"
	active_action = resolved
	rig.set_meta("current_action", resolved)
	var body := rig.get_node("Body") as AnimatedSprite2D
	body.animation = "%s_%s" % [resolved, DIRS[direction_index]]
	body.play()
	var idle_layers := resolved == "idle" and bool(rig.get_meta("can_equip"))
	for node_name in ["SwordLayer", "ShieldLayer"]:
		if rig.has_node(node_name):
			rig.get_node(node_name).visible = idle_layers
	_set_equipment_direction(rig, DIRS[direction_index])
	_update_hud()

func _on_animation_finished(rig: Node2D) -> void:
	var action := String(rig.get_meta("current_action", "idle"))
	if action == "death" or action in ["idle", "walk"]:
		return
	rig.set_meta("current_action", "idle")
	var body := rig.get_node("Body") as AnimatedSprite2D
	body.animation = "idle_%s" % DIRS[direction_index]
	body.play()
	if rig.has_meta("can_equip") and bool(rig.get_meta("can_equip")):
		for name in ["SwordLayer", "ShieldLayer"]: rig.get_node(name).visible = true

func _on_frame_changed(rig: Node2D) -> void:
	if fx == null: return
	var body := rig.get_node("Body") as AnimatedSprite2D
	var action := String(rig.get_meta("current_action", "idle"))
	var event_frame := 2
	if action == "hurt": event_frame = 1
	if action == "death": event_frame = 3
	if body.frame != event_frame: return
	if action == "attack":
		fx.position = rigs[1-active_index].position + Vector2(0, -64)
		fx.trigger("impact")
	elif action == "cast":
		fx.position = rigs[1-active_index].position + Vector2(0, -64)
		fx.trigger("spell_release")
	elif action == "defend":
		fx.position = rig.position + Vector2(0, -66)
		fx.trigger("shield_block")
	elif action == "hurt":
		fx.position = rig.position + Vector2(0, -68)
		fx.trigger("damage_flash")
	elif action == "death":
		fx.position = rig.position + Vector2(0, -112)
		fx.trigger("defeat_marker")

func _toggle_equipment() -> void:
	var rig := rigs[0]
	var visible_now: bool = not (rig.get_node("SwordLayer") as AnimatedSprite2D).visible
	rig.get_node("SwordLayer").visible = visible_now
	rig.get_node("ShieldLayer").visible = visible_now
	_update_hud()

func _trigger_next_effect() -> void:
	var rig := rigs[active_index]
	current_effect = (current_effect + 1) % EFFECTS.size()
	fx.position = rig.position + Vector2(0,-72)
	fx.trigger(EFFECTS[current_effect])
	_update_hud()

func _replay_action() -> void:
	var body := rigs[active_index].get_node("Body") as AnimatedSprite2D
	body.stop()
	body.frame = 0
	body.play()

func _update_hud() -> void:
	if status_label == null: return
	var rig := rigs[active_index]
	status_label.text = "FÍMBRIA · G05 COMBAT ART\n%s · %s · %s · grid %s · escala visual %.2f" % [rig.get_meta("title"), active_action.to_upper(), DIRS[direction_index].to_upper(), str(rig.get_meta("logical_cell")), rig.get_node("Body").scale.x]

func get_active_logical_cell() -> Vector2i:
	return rigs[active_index].get_meta("logical_cell")
