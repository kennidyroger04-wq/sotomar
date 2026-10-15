extends SceneTree

const FRAME_SIZE := Vector2i(280, 350)
const DIRECTIONS := ["front", "left", "back", "right"]
const RESOURCE_DEFINITIONS := [
	{"source": "res://assets/characters/cascudo_g18c/cascudo_de_cal_idle.png", "output": "res://resources/animations/cascudo_de_cal_g18c.tres"},
	{"source": "res://assets/characters/npc_mira_g18c/mira_idle.png", "output": "res://resources/animations/mira_g18c.tres"}
]

func _initialize() -> void:
	for definition: Dictionary in RESOURCE_DEFINITIONS:
		if not _build_frames(String(definition.source), String(definition.output)):
			quit(1)
			return
	quit()

func _build_frames(source_path: String, output_path: String) -> bool:
	var atlas := load(source_path) as Texture2D
	if atlas == null:
		push_error("Missing character atlas: " + source_path)
		return false
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for direction_index in DIRECTIONS.size():
		var animation_name: String = "idle_" + DIRECTIONS[direction_index]
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 3.0)
		frames.set_animation_loop(animation_name, true)
		for pose_index in 4:
			var cell := AtlasTexture.new()
			cell.atlas = atlas
			cell.region = Rect2i(direction_index * FRAME_SIZE.x, pose_index * FRAME_SIZE.y, FRAME_SIZE.x, FRAME_SIZE.y)
			frames.add_frame(animation_name, cell)
	var result := ResourceSaver.save(frames, output_path)
	if result != OK:
		push_error("Failed to save SpriteFrames %s: %s" % [output_path, result])
		return false
	print("G18C: saved 4-direction x 4-frame idle SpriteFrames to " + output_path)
	return true
