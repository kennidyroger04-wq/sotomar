extends SceneTree

const SCENE_PATH := "res://scenes/art_demo.tscn"
const TILESET_PATH := "res://resources/tilesets/fimbria_art_demo.tres"
const FRAMES_PATH := "res://resources/animations/wayfarer_v1.tres"
const TARGETS := [Vector2i(1280, 720), Vector2i(1920, 1080)]

var output_dir := "captures/g03"
var validate_only := false
var errors: Array[String] = []
var log_lines: Array[String] = []

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	for index in args.size():
		if args[index] == "--validate-only":
			validate_only = true
		elif args[index].begins_with("--output-dir="):
			output_dir = args[index].trim_prefix("--output-dir=")
		elif args[index] == "--output-dir" and index + 1 < args.size():
			output_dir = args[index + 1]
	var absolute_output := _absolute_output_dir()
	DirAccess.make_dir_recursive_absolute(absolute_output)
	_preflight()
	if validate_only or DisplayServer.get_name() == "headless":
		if not validate_only and DisplayServer.get_name() == "headless":
			errors.append("Graphical capture requires Godot Desktop; run --validate-only in headless mode.")
		_finish(absolute_output)
		return
	_capture(absolute_output)

func _preflight() -> void:
	for resource_path in [SCENE_PATH, TILESET_PATH, FRAMES_PATH]:
		if ResourceLoader.load(resource_path) == null:
			errors.append("Resource failed to load: " + resource_path)
	var tile_set := ResourceLoader.load(TILESET_PATH) as TileSet
	if tile_set == null or tile_set.get_source_count() != 23:
		errors.append("The art TileSet must have 23 sources.")
	var metadata := JSON.parse_string(FileAccess.get_file_as_string("res://resources/art_pack_g03.json")) as Dictionary
	if metadata.is_empty() or metadata.get("tiles", []).size() != 23:
		errors.append("The art pack metadata is missing or incomplete.")
	log_lines.append("Preflight checked demo scene, 23-source TileSet, SpriteFrames and art metadata.")

func _capture(absolute_output: String) -> void:
	var packed := ResourceLoader.load(SCENE_PATH) as PackedScene
	if packed == null:
		errors.append("Art demo scene is not a PackedScene.")
		_finish(absolute_output)
		return
	var scene := packed.instantiate()
	root.add_child(scene)
	await process_frame
	for target: Vector2i in TARGETS:
		DisplayServer.window_set_size(target)
		root.size = target
		await process_frame
		await process_frame
		scene._on_viewport_size_changed()
		var logical_size: Vector2 = scene.get_viewport_rect().size
		scene.legend.text = "FÍMBRIA · pacote artístico G03\nJanela %d×%d · viewport lógica %d×%d\nCélula 64×32 · personagem: walk SE" % [target.x, target.y, int(logical_size.x), int(logical_size.y)]
		await process_frame
		await RenderingServer.frame_post_draw
		var image := root.get_texture().get_image()
		if image == null or image.is_empty():
			errors.append("Could not read rendered art demo at %dx%d." % [target.x, target.y])
			continue
		if image.get_width() != target.x or image.get_height() != target.y:
			image.resize(target.x, target.y, Image.INTERPOLATE_NEAREST)
		var filename := "fimbria_g03_%dx%d.png" % [target.x, target.y]
		var save_error := image.save_png(absolute_output.path_join(filename))
		if save_error != OK:
			errors.append("Could not save " + filename + " (error %d)." % save_error)
		else:
			log_lines.append("Saved %s (%dx%d)." % [filename, image.get_width(), image.get_height()])
	_finish(absolute_output)

func _absolute_output_dir() -> String:
	if output_dir.is_absolute_path():
		return output_dir.simplify_path()
	return ProjectSettings.globalize_path("res://").path_join(output_dir).simplify_path()

func _finish(absolute_output: String) -> void:
	for message in errors:
		log_lines.append("ERROR: " + message)
	log_lines.append("Result: %s" % ("OK" if errors.is_empty() else "FAILED (%d error(s))" % errors.size()))
	var file := FileAccess.open(absolute_output.path_join("capture_log.txt"), FileAccess.WRITE)
	if file != null:
		file.store_string("\n".join(log_lines) + "\n")
		file.close()
	for line in log_lines:
		print(line)
	quit(0 if errors.is_empty() else 1)
