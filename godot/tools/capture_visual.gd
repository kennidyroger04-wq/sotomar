extends SceneTree
## Run in Godot Desktop with `--script res://tools/capture_visual.gd`.

const SCENE_PATH := "res://scenes/main.tscn"
const TILESET_PATH := "res://resources/tilesets/fimbria_ground.tres"
const TILE_PATHS := [
	"res://assets/tiles/terrain/terrain_grass_base.png",
	"res://assets/tiles/terrain/terrain_dirt.png",
	"res://assets/tiles/terrain/path_stone.png",
	"res://assets/tiles/terrain/terrain_stone.png",
	"res://assets/tiles/terrain/terrain_water.png",
	"res://assets/tiles/terrain/terrain_grass_flowers.png",
]
const TARGETS := [Vector2i(1280, 720), Vector2i(1920, 1080)]

var errors: Array[String] = []
var log_lines: Array[String] = []
var output_dir := "captures/g02b"
var validate_only := false

func _initialize() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg == "--validate-only":
			validate_only = true
		elif arg.begins_with("--output-dir="):
			output_dir = arg.trim_prefix("--output-dir=")
		elif arg == "--output-dir":
			pass # Next argument is handled below.
	var args := OS.get_cmdline_user_args()
	for index in args.size():
		if args[index] == "--output-dir" and index + 1 < args.size():
			output_dir = args[index + 1]
	var absolute_output := _absolute_output_dir()
	DirAccess.make_dir_recursive_absolute(absolute_output)
	_preflight()
	if validate_only:
		_finish(absolute_output)
		return
	if DisplayServer.get_name() == "headless":
		errors.append("Capture requires Godot Desktop; use --validate-only in a headless environment.")
		_finish(absolute_output)
		return
	_capture(absolute_output)

func _preflight() -> void:
	for resource_path in [SCENE_PATH, TILESET_PATH] + TILE_PATHS:
		if ResourceLoader.load(resource_path) == null:
			errors.append("Resource failed to load: " + resource_path)
	for texture_path in TILE_PATHS:
		var image := Image.load_from_file(ProjectSettings.globalize_path(texture_path))
		if image == null or image.is_empty() or image.get_width() != 128 or image.get_height() != 80 or not image.detect_alpha():
			errors.append("PNG dimensions/alpha check failed: " + texture_path)
		else:
			log_lines.append("PNG OK (128x80 RGBA): " + texture_path)
	log_lines.append("Preflight: scene, TileSet and six tile textures checked.")

func _capture(absolute_output: String) -> void:
	var packed := load(SCENE_PATH) as PackedScene
	if packed == null:
		errors.append("Main scene is not a PackedScene.")
		_finish(absolute_output)
		return
	var scene := packed.instantiate()
	root.add_child(scene)
	await process_frame
	scene.board.selected_cell = Vector2i(4, 2)
	scene.board.queue_redraw()
	var canvas := CanvasLayer.new()
	canvas.layer = 20
	scene.add_child(canvas)
	var panel := PanelContainer.new()
	panel.position = Vector2(16, 66)
	canvas.add_child(panel)
	var legend := Label.new()
	legend.add_theme_color_override("font_color", Color("f5f2dc"))
	legend.add_theme_font_size_override("font_size", 15)
	legend.add_theme_constant_override("line_spacing", 4)
	panel.add_child(legend)
	for target: Vector2i in TARGETS:
		DisplayServer.window_set_size(target)
		root.size = target
		await process_frame
		await process_frame
		scene._layout_viewport()
		var logical_size: Vector2 = scene.get_viewport_rect().size
		legend.text = "FÍMBRIA · diagnóstico visual\nJanela: %d × %d · viewport lógico: %d × %d\nCélula: 64 × 32 px\nSelecionada: (4, 2)" % [target.x, target.y, int(logical_size.x), int(logical_size.y)]
		await process_frame
		await RenderingServer.frame_post_draw
		var image := root.get_texture().get_image()
		if image == null or image.is_empty():
			errors.append("Could not read the rendered viewport at %dx%d." % [target.x, target.y])
			continue
		if image.get_width() != target.x or image.get_height() != target.y:
			image.resize(target.x, target.y, Image.INTERPOLATE_NEAREST)
		var filename := "fimbria_%dx%d.png" % [target.x, target.y]
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
	for error_message in errors:
		log_lines.append("ERROR: " + error_message)
	if errors.is_empty():
		log_lines.append("Result: OK")
	else:
		log_lines.append("Result: FAILED (%d error(s))" % errors.size())
	var log_path := absolute_output.path_join("capture_log.txt")
	var file := FileAccess.open(log_path, FileAccess.WRITE)
	if file != null:
		file.store_string("\n".join(log_lines) + "\n")
		file.close()
	for line in log_lines:
		print(line)
	quit(0 if errors.is_empty() else 1)
