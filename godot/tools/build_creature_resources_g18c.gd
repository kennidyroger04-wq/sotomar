extends SceneTree

const SOURCE_PATH := "res://assets/characters/cascudo_g18c/cascudo_de_cal_idle.png"
const OUTPUT_PATH := "res://resources/animations/cascudo_de_cal_g18c.tres"
const FRAME_SIZE := Vector2i(280, 350)
const DIRECTIONS := ["front", "left", "back", "right"]

func _initialize() -> void:
	var atlas := load(SOURCE_PATH) as Texture2D
	if atlas == null:
		push_error("Missing Cascudo-de-cal art atlas: " + SOURCE_PATH)
		quit(1)
		return
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
	var result := ResourceSaver.save(frames, OUTPUT_PATH)
	if result != OK:
		push_error("Failed to save Cascudo-de-cal SpriteFrames: %s" % result)
		quit(1)
		return
	print("G18C: saved Cascudo-de-cal SpriteFrames (4 directions x 4 idle frames) to " + OUTPUT_PATH)
	quit()
