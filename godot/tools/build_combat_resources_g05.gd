extends SceneTree

const DIRS := ["se", "sw", "nw", "ne"]
const FPS := {"idle": 4.0, "walk": 8.0, "attack": 6.0, "hurt": 6.0, "defend": 5.0, "cast": 6.0, "death": 4.0}

func _initialize() -> void:
	var way := SpriteFrames.new()
	_remove_default(way)
	_add_sheet(way, "idle", "res://assets/characters/wayfarer_v1/wayfarer_v1.png", 4, true, 0)
	_add_sheet(way, "walk", "res://assets/characters/wayfarer_v1/wayfarer_v1.png", 8, true, 4)
	for action in ["attack", "hurt", "defend", "cast", "death"]:
		_add_sheet(way, action, "res://assets/characters/wayfarer_g05/wayfarer_%s.png" % action, FPS[action], action in ["idle", "walk"], -1)
	var err := ResourceSaver.save(way, "res://resources/combat/wayfarer_combat_g05.tres")
	if err != OK: push_error("Could not save Wayfarer SpriteFrames: %s" % err); quit(1); return
	var enemy := SpriteFrames.new()
	_remove_default(enemy)
	for action in ["idle", "walk", "attack", "hurt", "death"]:
		_add_sheet(enemy, action, "res://assets/characters/moss_raider_g05/moss_raider_%s.png" % action, FPS[action], action in ["idle", "walk"], -1)
	err = ResourceSaver.save(enemy, "res://resources/combat/moss_raider_combat_g05.tres")
	if err != OK: push_error("Could not save Moss Raider SpriteFrames: %s" % err); quit(1); return
	var gear := SpriteFrames.new()
	_remove_default(gear)
	for slot in ["sword", "shield"]:
		_add_equipment(gear, slot)
	err = ResourceSaver.save(gear, "res://resources/combat/wayfarer_equipment_g05.tres")
	if err != OK: push_error("Could not save equipment SpriteFrames: %s" % err); quit(1); return
	print("G05 SpriteFrames saved: Wayfarer 28 animations; Moss Raider 20 animations; equipment 8 directional overlays.")
	quit(0)

func _add_sheet(resource: SpriteFrames, action: String, path: String, speed: float, looping: bool, column_offset: int) -> void:
	var texture := load(path) as Texture2D
	if texture == null: push_error("Missing animation atlas: " + path); return
	for row in DIRS.size():
		var direction: String = DIRS[row]
		var animation_name := "%s_%s" % [action, direction]
		resource.add_animation(animation_name)
		resource.set_animation_speed(animation_name, speed)
		resource.set_animation_loop(animation_name, looping)
		for frame_index in 4:
			var col := frame_index + maxi(0, column_offset)
			var atlas := AtlasTexture.new()
			atlas.atlas = texture
			atlas.region = Rect2(Vector2(col * 128, row * 160), Vector2(128, 160))
			resource.add_frame(animation_name, atlas)

func _add_equipment(resource: SpriteFrames, slot: String) -> void:
	var path := "res://assets/equipment/g05/wayfarer_%s_idle.png" % slot
	var texture := load(path) as Texture2D
	if texture == null: push_error("Missing equipment atlas: " + path); return
	for row in DIRS.size():
		var name := "%s_%s" % [slot, DIRS[row]]
		if not resource.has_animation(name):
			resource.add_animation(name)
			resource.set_animation_speed(name, 1.0)
			resource.set_animation_loop(name, true)
		var atlas := AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(Vector2(row * 128, 0), Vector2(128, 160))
		resource.add_frame(name, atlas)

func _remove_default(resource: SpriteFrames) -> void:
	if resource.has_animation("default"):
		resource.remove_animation("default")
