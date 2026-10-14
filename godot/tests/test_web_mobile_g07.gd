extends SceneTree

const Logic = preload("res://scripts/iso_board_logic.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	await _test_responsive_character_select()
	var scene: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	_check(scene.confirm_button != null and scene.camera.enabled, "touch confirmation control and active camera exist")
	_check(scene.terrain_tiles.get_used_cells().size() == scene.map_columns * scene.map_rows and scene.map_columns == 12 and scene.map_rows == 10, "web scene keeps terrain and obstacle layers available")
	var walkable := Vector2i(2, 1)
	var screen_point: Vector2 = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(walkable, scene.map_origin)
	_check(scene._screen_to_cell(screen_point) == walkable, "screen-to-cell conversion accounts for camera and canvas transforms")
	scene._handle_touch_tap(screen_point)
	_check(scene.board.selected_cell == walkable and scene.confirm_button.visible, "first touch selects a walkable cell and requests confirmation")
	_check(scene.logical_position == Vector2i(6, 5), "first touch does not move the character from the canonical spawn")
	var blocked := Vector2i(4, 2)
	var blocked_point: Vector2 = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(blocked, scene.map_origin)
	scene._handle_touch_tap(blocked_point)
	_check(not scene.confirm_button.visible, "blocked cell cannot be confirmed as a destination")
	scene._set_zoom(1.3)
	_check(is_equal_approx(scene.camera.zoom.x, 1.3), "camera supports programmatic zoom")
	scene._set_zoom(99.0)
	_check(is_equal_approx(scene.camera.zoom.x, 1.6), "camera zoom remains within its upper bound")
	scene._set_zoom(0.01)
	_check(is_equal_approx(scene.camera.zoom.x, 0.55), "camera zoom remains within its lower bound")
	var first_finger := InputEventScreenTouch.new()
	first_finger.index = 0
	first_finger.pressed = true
	first_finger.position = Vector2(100, 100)
	scene._handle_screen_touch(first_finger)
	var second_finger := InputEventScreenTouch.new()
	second_finger.index = 1
	second_finger.pressed = true
	second_finger.position = Vector2(200, 100)
	scene._handle_screen_touch(second_finger)
	var pinch_drag := InputEventScreenDrag.new()
	pinch_drag.index = 1
	pinch_drag.position = Vector2(230, 100)
	scene._handle_screen_drag(pinch_drag)
	_check(is_equal_approx(scene.camera.zoom.x, 0.715), "two-finger pinch changes camera zoom")
	var release_second := InputEventScreenTouch.new()
	release_second.index = 1
	release_second.pressed = false
	release_second.position = Vector2(230, 100)
	scene._handle_screen_touch(release_second)
	var release_first := InputEventScreenTouch.new()
	release_first.index = 0
	release_first.pressed = false
	release_first.position = Vector2(100, 100)
	scene._handle_screen_touch(release_first)
	_check(not scene._dialogue_is_open(), "pinch release does not synthesize an NPC tap")
	scene.camera.zoom = Vector2(2.0, 2.0)
	var camera_before_drag: Vector2 = scene.camera.position
	var pan_start := InputEventScreenTouch.new()
	pan_start.index = 0
	pan_start.pressed = true
	pan_start.position = Vector2(200, 200)
	scene._handle_screen_touch(pan_start)
	var pan_drag := InputEventScreenDrag.new()
	pan_drag.index = 0
	pan_drag.position = Vector2(260, 230)
	scene._handle_screen_drag(pan_drag)
	_check(not scene.camera.position.is_equal_approx(camera_before_drag), "single-finger drag pans the camera")
	var pan_release := InputEventScreenTouch.new()
	pan_release.index = 0
	pan_release.pressed = false
	pan_release.position = Vector2(260, 230)
	scene._handle_screen_touch(pan_release)
	# Nilo occupies (6,4) in the canonical G08 map; use an adjacent clear cell
	# so this movement regression does not activate the new NPC tap interaction.
	var start := Vector2i(6, 6)
	var tap_point: Vector2 = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(start, scene.map_origin)
	scene._handle_touch_tap(tap_point)
	scene._handle_touch_tap(tap_point)
	await create_timer(0.22).timeout
	_check(scene.logical_position == start, "deliberate second touch moves deterministically by the selected cell")
	var emulated_mouse := InputEventMouseButton.new()
	emulated_mouse.device = InputEvent.DEVICE_ID_EMULATION
	emulated_mouse.button_index = MOUSE_BUTTON_RIGHT
	emulated_mouse.pressed = true
	emulated_mouse.position = scene.get_viewport().get_canvas_transform() * Logic.cell_to_screen(start, scene.map_origin)
	scene._handle_mouse_button(emulated_mouse)
	await process_frame
	_check(scene.logical_position == start, "emulated mouse event is ignored after touch movement")
	scene._move_to(blocked)
	await process_frame
	_check(scene.logical_position == start, "blocked-cell movement remains rejected")
	scene.queue_free()
	if failures == 0:
		print("PASS: G07 web touch, camera, and mobile scene checks")
		quit(0)
	else:
		push_error("%d G07 web/mobile check(s) failed" % failures)
		quit(1)

func _test_responsive_character_select() -> void:
	var viewport := SubViewport.new()
	viewport.size = Vector2i(400, 800)
	root.add_child(viewport)
	var portrait_menu := (load("res://scenes/character_select.tscn") as PackedScene).instantiate()
	viewport.add_child(portrait_menu)
	await process_frame
	portrait_menu._layout_screen()
	_check(portrait_menu.character_row.columns == 1 and portrait_menu.orientation_label.visible, "character selection switches to stacked cards and shows a portrait rotation tip")
	_check(portrait_menu.enter_button.custom_minimum_size.y >= 48.0 and portrait_menu.choose_buttons[0].custom_minimum_size.y >= 48.0, "mobile selection and confirmation controls meet the 48-pixel touch target")
	portrait_menu.queue_free()
	viewport.queue_free()
	await process_frame
	var landscape_viewport := SubViewport.new()
	landscape_viewport.size = Vector2i(844, 390)
	root.add_child(landscape_viewport)
	var landscape_menu := (load("res://scenes/character_select.tscn") as PackedScene).instantiate()
	landscape_viewport.add_child(landscape_menu)
	await process_frame
	landscape_menu._layout_screen()
	_check(landscape_menu.character_row.columns == 2 and not landscape_menu.orientation_label.visible, "landscape selection keeps both cards side by side without a rotation warning")
	landscape_menu.queue_free()
	landscape_viewport.queue_free()
	await process_frame

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
