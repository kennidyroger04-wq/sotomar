extends Node2D

const DIRECTIONS := ["se", "sw", "nw", "ne"]
const LOGICAL_ACTIONS := ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
const Logic = preload("res://scripts/iso_board_logic.gd")

var direction_index := 0
var action := "idle"
var actors: Array[Node2D] = []
var equipment_rigs: Array = []
var overlays_enabled := false
var labels: Array[String] = ["Guerreiro", "Guerreira", "Saqueador Musgoso"]
var status: Label

func _ready() -> void:
	var center := get_viewport_rect().size * 0.5
	var frames: Array[SpriteFrames] = [
		load("res://resources/characters/warrior_male_g06.tres"),
		load("res://resources/combat/wayfarer_combat_g05.tres"),
		load("res://resources/combat/moss_raider_combat_g05.tres")
	]
	for index in frames.size():
		var actor := Node2D.new()
		actor.name = ["MaleWarrior", "Wayfarer", "MossRaider"][index]
		actor.position = center + Vector2((index - 1) * 230, 130)
		actor.z_index = 5 + index
		add_child(actor)
		var shadow := Polygon2D.new()
		var polygon := PackedVector2Array()
		for i in 20:
			var angle := TAU * float(i) / 20.0
			polygon.append(Vector2(cos(angle) * 32.0, sin(angle) * 9.0))
		shadow.polygon = polygon
		shadow.color = Color(0.04, 0.05, 0.04, 0.35)
		shadow.z_index = -1
		actor.add_child(shadow)
		var sprite := AnimatedSprite2D.new()
		sprite.name = "Body"
		sprite.sprite_frames = frames[index]
		sprite.centered = true
		sprite.offset = Vector2(0, -76)
		sprite.scale = Vector2.ONE * (0.5 if index < 2 else 0.48)
		actor.add_child(sprite)
		if index < 2:
			var equipment := Node2D.new()
			equipment.name = "EquipmentRig"
			equipment.set_script(load("res://scripts/characters/equipment_rig_g06.gd"))
			actor.add_child(equipment)
			equipment.configure(load("res://resources/characters/warrior_male_equipment_g06.tres") if index == 0 else load("res://resources/combat/wayfarer_equipment_g05.tres"), 0.5 if index == 0 else 0.48)
			equipment_rigs.append(equipment)
		var name_label := Label.new()
		name_label.text = labels[index]
		name_label.position = Vector2(-78, -174)
		name_label.add_theme_color_override("font_color", Color("f5e4b9"))
		name_label.add_theme_font_size_override("font_size", 17)
		actor.add_child(name_label)
		actors.append(actor)
	var ui := CanvasLayer.new()
	add_child(ui)
	var instructions := Label.new()
	instructions.position = Vector2(18, 12)
	instructions.text = "G06 · COMPARAÇÃO DE PERSONAGENS\n←/→ direção · 1–7 ação simultânea · G camadas de equipamento"
	instructions.add_theme_font_size_override("font_size", 16)
	instructions.add_theme_color_override("font_color", Color("f3e6c7"))
	ui.add_child(instructions)
	status = Label.new()
	status.position = Vector2(18, 82)
	status.add_theme_color_override("font_color", Color("c9ddd5"))
	ui.add_child(status)
	_apply_action()

func _draw() -> void:
	var origin := get_viewport_rect().size * 0.5 + Vector2(0, 130)
	for y in 5:
		for x in 12:
			var point := Logic.cell_to_screen(Vector2i(x, y), origin, 48.0, 24.0)
			var diamond := PackedVector2Array([point + Vector2(24,0), point + Vector2(48,12), point + Vector2(24,24), point + Vector2(0,12)])
			draw_colored_polygon(diamond, Color("608747") if (x+y)%2 == 0 else Color("6c934e"))
			draw_polyline(diamond + PackedVector2Array([diamond[0]]), Color("3f633a"), 1.0, true)

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	match event.keycode:
		KEY_LEFT:
			direction_index = (direction_index + 3) % 4
			_apply_action()
		KEY_RIGHT:
			direction_index = (direction_index + 1) % 4
			_apply_action()
		KEY_1: action = "idle"; _apply_action()
		KEY_2: action = "walk"; _apply_action()
		KEY_3: action = "attack"; _apply_action()
		KEY_4: action = "hurt"; _apply_action()
		KEY_5: action = "defend"; _apply_action()
		KEY_6: action = "cast"; _apply_action()
		KEY_7: action = "death"; _apply_action()
		KEY_G:
			overlays_enabled = not overlays_enabled
			for equipment in equipment_rigs:
				equipment.set_overlays_enabled(overlays_enabled)
			_update_equipment()

func _apply_action() -> void:
	for index in actors.size():
		var sprite := actors[index].get_node("Body") as AnimatedSprite2D
		var resolved := action
		if not sprite.sprite_frames.has_animation("%s_%s" % [resolved, DIRECTIONS[direction_index]]):
			resolved = "attack" if action == "cast" else "hurt" if action == "defend" else "idle"
		sprite.animation = "%s_%s" % [resolved, DIRECTIONS[direction_index]]
		sprite.play()
	_update_equipment()
	status.text = "Ação: %s · Orientação: %s · camadas: %s" % [action, DIRECTIONS[direction_index].to_upper(), "visíveis" if overlays_enabled else "ocultas"]

func _update_equipment() -> void:
	for equipment in equipment_rigs:
		equipment.set_direction(DIRECTIONS[direction_index])
		equipment.set_action(action)
