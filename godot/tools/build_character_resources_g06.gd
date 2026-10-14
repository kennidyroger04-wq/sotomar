extends SceneTree

const DIRECTIONS := ["ne", "se", "sw", "nw"]
const ACTIONS := ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]

func _initialize() -> void:
	_build_actor_frames()
	_build_equipment_frames()
	quit()

func _build_actor_frames() -> void:
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for action in ACTIONS:
		for direction in DIRECTIONS:
			var animation := "%s_%s" % [action, direction]
			frames.add_animation(animation)
			frames.set_animation_speed(animation, _fps(action))
			frames.set_animation_loop(animation, action in ["idle", "walk"])
			var atlas := load("res://assets/characters/warrior_male_g06/warrior_male_%s.png" % action) as Texture2D
			if atlas == null:
				push_error("Missing G06 source sheet for %s" % action)
				continue
			var direction_index := DIRECTIONS.find(direction)
			for frame_index in 4:
				var texture := AtlasTexture.new()
				texture.atlas = atlas
				texture.region = Rect2(direction_index * 128, frame_index * 160, 128, 160)
				frames.add_frame(animation, texture)
	var error := ResourceSaver.save(frames, "res://resources/characters/warrior_male_g06.tres")
	if error != OK:
		push_error("Unable to save G06 SpriteFrames: %s" % error_string(error))

func _build_equipment_frames() -> void:
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	var gear := {"sword": "res://assets/equipment/g06/warrior_male_sword.png", "shield": "res://assets/equipment/g06/warrior_male_shield.png"}
	for slot in gear:
		var atlas := load(gear[slot]) as Texture2D
		if atlas == null:
			push_error("Missing G06 equipment: %s" % slot)
			continue
		for direction_index in 4:
			var animation := "%s_%s" % [slot, DIRECTIONS[direction_index]]
			frames.add_animation(animation)
			frames.set_animation_loop(animation, true)
			var texture := AtlasTexture.new()
			texture.atlas = atlas
			texture.region = Rect2(direction_index * 128, 0, 128, 160)
			frames.add_frame(animation, texture)
	var error := ResourceSaver.save(frames, "res://resources/characters/warrior_male_equipment_g06.tres")
	if error != OK:
		push_error("Unable to save G06 equipment SpriteFrames: %s" % error_string(error))

func _fps(action: String) -> float:
	match action:
		"idle": return 4.0
		"walk": return 8.0
		"death": return 4.0
		"defend": return 5.0
		_: return 6.0
