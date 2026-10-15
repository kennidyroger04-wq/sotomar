extends Node2D

const Rules = preload("res://scripts/combat_rules_g10.gd")
const FxScript = preload("res://scripts/combat_fx_g05.gd")
const CASCUDO_FRAMES := preload("res://resources/animations/cascudo_de_cal_g18c.tres") as SpriteFrames
const CASCUDO_ID := "CRE_CASCUDO_DE_CAL"
const TILE_W := 60.0
const TILE_H := 30.0
var cell_scale := 1.0
var combat: Dictionary = {}
var selected_cell := Vector2i(-1, -1)
var mode := ""
var targetable_cells: Array[Vector2i] = []
var affected_cells: Array[Vector2i] = []
var sprites: Dictionary = {}
var origin := Vector2.ZERO
var fx_nodes: Dictionary = {}

func _ready() -> void:
	set_process(true)

func configure(state: Dictionary, player_frames: SpriteFrames) -> void:
	combat = state
	for child in get_children():
		remove_child(child)
		child.queue_free()
	sprites.clear()
	origin = Vector2(get_viewport_rect().size.x * 0.5, get_viewport_rect().size.y * 0.48)
	var player_sprite := _make_sprite(player_frames, "PlayerSprite")
	player_sprite.scale = Vector2.ONE * 0.43
	add_child(player_sprite)
	sprites["player"] = player_sprite
	for unit: Dictionary in combat.get("units", []):
		if String(unit.get("side", "")) != "mob" or String(unit.get("canonical_id", "")) != CASCUDO_ID:
			continue
		var creature_sprite := _make_sprite(CASCUDO_FRAMES, "Cascudo_" + String(unit.get("id", "")))
		creature_sprite.offset = Vector2(0, -175)
		creature_sprite.scale = Vector2.ONE * 0.36
		creature_sprite.play("idle_front")
		add_child(creature_sprite)
		sprites[String(unit.get("id", ""))] = creature_sprite
	for effect_id in ["physical_slash", "impact", "shield_block", "damage_flash", "defeat_marker"]:
		var effect := Node2D.new()
		effect.name = "FX_" + effect_id
		effect.set_script(FxScript)
		effect.z_index = 20
		add_child(effect)
		fx_nodes[effect_id] = effect
	queue_redraw()

func set_mode(value: String) -> void:
	mode = value
	targetable_cells.clear()
	affected_cells.clear()
	queue_redraw()

func _process(_delta: float) -> void:
	if combat.is_empty():
		return
	for unit: Dictionary in combat.units:
		var id := String(unit.id)
		var sprite: AnimatedSprite2D = sprites.get(id)
		if sprite:
			sprite.position = cell_to_local(Vector2i(int(unit.x), int(unit.y)))
			sprite.z_index = int(unit.x) + int(unit.y) + 1
			if String(unit.get("canonical_id", "")) == CASCUDO_ID:
				var player: Dictionary = combat.units[0]
				var dx := int(player.x) - int(unit.x)
				var dy := int(player.y) - int(unit.y)
				var facing := "right" if abs(dx) > abs(dy) and dx > 0 else "left" if abs(dx) > abs(dy) else "front" if dy > 0 else "back"
				var animation := "idle_" + facing
				if sprite.animation != animation:
					sprite.play(animation)

func cell_to_local(cell: Vector2i) -> Vector2:
	return origin + Vector2((cell.x - cell.y) * TILE_W * cell_scale * 0.5, (cell.x + cell.y) * TILE_H * cell_scale * 0.5)

func screen_to_cell(point: Vector2) -> Vector2i:
	var local := point - origin
	return Vector2i(roundi(local.x / (TILE_W * cell_scale) + local.y / (TILE_H * cell_scale)), roundi(local.y / (TILE_H * cell_scale) - local.x / (TILE_W * cell_scale)))

func _draw() -> void:
	if combat.is_empty():
		return
	for y in combat.height:
		for x in combat.width:
			var cell := Vector2i(x, y)
			var center := cell_to_local(cell)
			var half_w := TILE_W * cell_scale * 0.5
			var half_h := TILE_H * cell_scale * 0.5
			var points := PackedVector2Array([center + Vector2(0, -half_h), center + Vector2(half_w, 0), center + Vector2(0, half_h), center + Vector2(-half_w, 0)])
			var color := Color("78b96e") if (x + y) % 2 == 0 else Color("6eaa65")
			if combat.blocked.has(cell):
				color = Color("687078")
			elif mode == "move" and _reachable(cell):
				color = Color("a9d987")
			elif targetable_cells.has(cell):
				color = Color("8abbe3")
			if affected_cells.has(cell):
				color = Color("e97768")
			draw_colored_polygon(points, color)
			if affected_cells.has(cell):
				draw_colored_polygon(points, Color(0.92, 0.23, 0.18, 0.24))
			elif targetable_cells.has(cell):
				draw_colored_polygon(points, Color(0.25, 0.70, 0.95, 0.18))
			draw_polyline(PackedVector2Array([points[0], points[1], points[2], points[3], points[0]]), Color("365448"), 1.0, true)
			if combat.blocked.has(cell):
				draw_rect(Rect2(center - Vector2(9, 6), Vector2(18, 12)), Color("48505a"))
	if selected_cell.x >= 0:
		var selected_center := cell_to_local(selected_cell)
		draw_arc(selected_center, 14 * cell_scale, 0, TAU, 24, Color("ffe07a"), 3.0, true)
	var font := ThemeDB.fallback_font
	var player: Dictionary = combat.units[0]
	var player_pos := cell_to_local(Vector2i(int(player.x), int(player.y)))
	draw_string(font, player_pos + Vector2(-45, 28) * cell_scale, "%d/%d" % [player.hp, player.max_hp], HORIZONTAL_ALIGNMENT_CENTER, 90 * cell_scale, int(13 * cell_scale), Color.WHITE)
	for foe: Dictionary in combat.units:
		if String(foe.get("side", "")) != "mob" or int(foe.get("hp", 0)) <= 0:
			continue
		var foe_pos := cell_to_local(Vector2i(int(foe.x), int(foe.y)))
		if not sprites.has(String(foe.get("id", ""))):
			_draw_enemy(foe_pos, String(foe.get("canonical_id", "")))
		draw_string(font, foe_pos + Vector2(-48, 28) * cell_scale, "%d/%d" % [foe.hp, foe.max_hp], HORIZONTAL_ALIGNMENT_CENTER, 96 * cell_scale, int(13 * cell_scale), Color.WHITE)

func unit_at(cell: Vector2i) -> Dictionary:
	for unit: Dictionary in combat.get("units", []):
		if int(unit.get("hp", 0)) > 0 and Vector2i(int(unit.x), int(unit.y)) == cell:
			return unit
	return {}

func _draw_enemy(feet: Vector2, creature_id: String) -> void:
	var hue := float(absi(creature_id.hash()) % 100) / 100.0
	var shell_color := Color.from_hsv(hue, 0.42, 0.56)
	var outline_color := shell_color.darkened(0.48)
	_draw_ellipse(feet + Vector2(0, -5) * cell_scale, Vector2(25, 9) * cell_scale, outline_color)
	var shell := PackedVector2Array([
		feet + Vector2(-20, -8) * cell_scale, feet + Vector2(-16, -26) * cell_scale,
		feet + Vector2(-6, -39) * cell_scale, feet + Vector2(11, -38) * cell_scale,
		feet + Vector2(22, -24) * cell_scale, feet + Vector2(20, -9) * cell_scale
	])
	draw_colored_polygon(shell, shell_color)
	draw_polyline(PackedVector2Array([shell[0], shell[1], shell[2], shell[3], shell[4], shell[5]]), outline_color, 3.0 * cell_scale, true)
	draw_circle(feet + Vector2(-5, -24) * cell_scale, 3.0 * cell_scale, Color("f1d36b"))
	draw_circle(feet + Vector2(8, -25) * cell_scale, 3.0 * cell_scale, Color("f1d36b"))
	draw_line(feet + Vector2(-4, -12) * cell_scale, feet + Vector2(-10, -3) * cell_scale, outline_color, 4.0 * cell_scale)
	draw_line(feet + Vector2(10, -12) * cell_scale, feet + Vector2(16, -3) * cell_scale, outline_color, 4.0 * cell_scale)

func _draw_ellipse(at: Vector2, radius: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for i in 24:
		var angle := TAU * float(i) / 24.0
		points.append(at + Vector2(cos(angle) * radius.x, sin(angle) * radius.y))
	draw_colored_polygon(points, color)

func _make_sprite(frames: SpriteFrames, node_name: String) -> AnimatedSprite2D:
	var sprite := AnimatedSprite2D.new()
	sprite.name = node_name
	sprite.sprite_frames = frames
	sprite.centered = true
	sprite.offset = Vector2(0, -72)
	sprite.animation = "idle_se" if frames.has_animation("idle_se") else "idle_front"
	sprite.play()
	return sprite

func animate_player(action: String, direction := "se") -> void:
	var sprite: AnimatedSprite2D = sprites.get("player")
	if sprite == null:
		return
	var animation_name := "%s_%s" % [action, direction]
	if sprite.sprite_frames.has_animation(animation_name):
		sprite.animation = animation_name
		sprite.play()

func direction_from_step(step: Vector2i) -> String:
	if step.x > 0:
		return "se" if step.y >= 0 else "ne"
	return "sw" if step.y > 0 else "nw"

func trigger_fx(effect_id: String, cell: Vector2i) -> void:
	var effect: Node2D = fx_nodes.get(effect_id)
	if effect == null:
		return
	effect.position = cell_to_local(cell)
	effect.trigger(effect_id)

func _reachable(cell: Vector2i) -> bool:
	var player: Dictionary = combat.units[0]
	var occupied: Array[Vector2i] = combat.blocked.duplicate()
	for unit: Dictionary in combat.units:
		if int(unit.hp) > 0:
			occupied.append(Vector2i(int(unit.x), int(unit.y)))
	var route := Rules.path(Vector2i(int(player.x), int(player.y)), cell, occupied, combat.width, combat.height)
	return not route.is_empty() and route.size() <= int(player.pm)
