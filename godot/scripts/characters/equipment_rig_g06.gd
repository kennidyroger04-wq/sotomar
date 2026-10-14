extends Node2D
## Optional modular overlays; the production body sheets already co-render their
## equipment, so overlays start hidden and are reserved for equipment variants.

var sword: AnimatedSprite2D
var shield: AnimatedSprite2D
var direction := "se"
var body_action := "idle"
var overlays_enabled := false

func configure(frames: SpriteFrames, display_scale := 0.5) -> void:
	for child in get_children():
		child.queue_free()
	if frames == null:
		return
	sword = _make_layer("SwordLayer", frames, "sword", Vector2(24, -50), display_scale, 3)
	shield = _make_layer("ShieldLayer", frames, "shield", Vector2(0, -72), display_scale, 4)
	_sync()

func set_direction(value: String) -> void:
	if value in ["ne", "se", "sw", "nw"]:
		direction = value
	_sync()

func set_action(value: String) -> void:
	body_action = value
	_sync()

func set_overlays_enabled(value: bool) -> void:
	overlays_enabled = value
	_sync()

func _make_layer(node_name: String, frames: SpriteFrames, slot: String, layer_offset: Vector2, display_scale: float, layer_z: int) -> AnimatedSprite2D:
	var sprite := AnimatedSprite2D.new()
	sprite.name = node_name
	sprite.sprite_frames = frames
	sprite.centered = true
	sprite.offset = layer_offset
	sprite.scale = Vector2.ONE * display_scale
	sprite.z_index = layer_z
	add_child(sprite)
	return sprite

func _sync() -> void:
	for pair in [[sword, "sword"], [shield, "shield"]]:
		var layer: AnimatedSprite2D = pair[0]
		if layer == null:
			continue
		var name := "%s_%s" % [pair[1], direction]
		if layer.sprite_frames.has_animation(name):
			layer.animation = name
			layer.frame = 0
		# Hybrid rule: pre-rendered action poses own their gear; idle and walk
		# can show a swappable overlay once a future customization selects one.
		layer.visible = overlays_enabled and body_action in ["idle", "walk"]
