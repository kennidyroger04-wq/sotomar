extends Node2D
## Keeps the G01 actor contract while drawing the currently selected character.

enum Facing { SOUTH_EAST, SOUTH_WEST, NORTH_WEST, NORTH_EAST }
const DIRECTION_NAMES := ["se", "sw", "nw", "ne"]

var facing: Facing = Facing.SOUTH_EAST
var _walking := false
var walk_phase := 0.0
var _body: AnimatedSprite2D
var _equipment_rig

var walking: bool:
	get: return _walking
	set(value):
		if _walking == value:
			return
		_walking = value
		_sync_animation()

func _ready() -> void:
	_body = AnimatedSprite2D.new()
	_body.name = "CharacterSprite"
	_body.centered = true
	_body.offset = Vector2(0, -72)
	_body.scale = Vector2(0.5, 0.5)
	_body.z_index = 1
	add_child(_body)
	_equipment_rig = Node2D.new()
	_equipment_rig.name = "EquipmentRig"
	_equipment_rig.set_script(load("res://scripts/characters/equipment_rig_g06.gd"))
	add_child(_equipment_rig)
	_equipment_rig.configure(CharacterRoster.get_equipment_frames())
	set_character_frames(CharacterRoster.get_character_frames())

func _process(delta: float) -> void:
	if _walking:
		walk_phase += delta * 13.0

func set_character_frames(frames: SpriteFrames) -> void:
	if frames == null:
		push_error("Selected character has no SpriteFrames resource.")
		return
	if _body == null:
		_body = get_node_or_null("CharacterSprite") as AnimatedSprite2D
		if _body == null:
			return
	_body.sprite_frames = frames
	_equipment_rig.configure(CharacterRoster.get_equipment_frames())
	_sync_animation()

func set_facing_from_step(step: Vector2i) -> void:
	if step == Vector2i.RIGHT:
		facing = Facing.SOUTH_EAST
	elif step == Vector2i.DOWN:
		facing = Facing.SOUTH_WEST
	elif step == Vector2i.LEFT:
		facing = Facing.NORTH_WEST
	elif step == Vector2i.UP:
		facing = Facing.NORTH_EAST
	_sync_animation()

func _sync_animation() -> void:
	if _body == null or _body.sprite_frames == null:
		return
	var action := "walk" if _walking else "idle"
	var name := "%s_%s" % [action, DIRECTION_NAMES[facing]]
	if not _body.sprite_frames.has_animation(name):
		return
	_body.animation = name
	_body.play()
	if _equipment_rig != null:
		_equipment_rig.set_direction(DIRECTION_NAMES[facing])
		_equipment_rig.set_action(action)
