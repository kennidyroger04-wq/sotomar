extends Node2D

const Logic = preload("res://scripts/iso_board_logic.gd")
const MapCatalog = preload("res://scripts/map_catalog.gd")
const CELL_WIDTH := 64.0
const CELL_HEIGHT := 32.0
const TOUCH_MOUSE_GUARD_MS := 650
const DOUBLE_TAP_MS := 700
const START_MAP_ID := "MAP_01"
const GRASS_VARIANT_SOURCES := [5, 6]
const ENCOUNTER_MARKER := Vector2i(6, 4)
const CombatOverlayScript = preload("res://scripts/combat_overlay_g10.gd")
const EncounterMarkerScript = preload("res://scripts/encounter_marker_g10.gd")
const EncounterRegistryScript = preload("res://scripts/encounter_registry_g11.gd")
const EncounterStateStoreScript = preload("res://scripts/encounter_state_store_g11.gd")
const QuestProgressStateScript = preload("res://scripts/quest_progress_state_g13.gd")
const InspectionCatalogScript = preload("res://scripts/inspection_catalog_g13.gd")
const InspectionMarkerScript = preload("res://scripts/inspection_marker_g13.gd")

@onready var board: Node2D = $GroundAndGrid
@onready var scenery: Node2D = $Scenery
@onready var actor: Node2D = $Actors/Player
@onready var instructions: Label = $HUD/Instructions
@onready var confirm_button: Button = $HUD/ConfirmMove
@onready var rotation_hint: Label = $HUD/RotationHint
@onready var camera: Camera2D = $Camera2D
@onready var terrain_tiles: TileMapLayer = $TerrainTiles
@onready var path_tiles: TileMapLayer = $PathTiles
@onready var border_tiles: TileMapLayer = $BorderTiles
@onready var decoration_tiles: TileMapLayer = $DecorationTiles
@onready var obstacle_tiles: TileMapLayer = $ObstacleTiles

var logical_position := Vector2i(1, 1)
var world_flags: Dictionary = {}
var _quest_state = QuestProgressStateScript.new()
var _inspection_catalog = InspectionCatalogScript.new()
var _quest_event_sequence := 0
var movement_in_progress := false
var map_origin := Vector2.ZERO
var map_id := ""
var map_data: Dictionary = {}
var map_columns := 10
var map_rows := 10
var _layout_pending := false
var _touch_positions: Dictionary = {}
var _touch_start := Vector2.ZERO
var _touch_camera_start := Vector2.ZERO
var _touch_dragged := false
var _last_touch_msec := -TOUCH_MOUSE_GUARD_MS
var _last_touch_cell := Vector2i(-1, -1)
var _last_tap_msec := -DOUBLE_TAP_MS
var _pending_cell := Vector2i(-1, -1)
var _pinch_distance := 0.0
var _camera_drag_started := false
var _user_zoomed := false
var _user_panned := false
var _last_notice := ""
var dialogue_panel: PanelContainer
var dialogue_name: Label
var dialogue_text: Label
var dialogue_advance: Button
var quest_tracker: Label
var quest_accept_button: Button
var inspect_button: Button
var talk_button: Button
var _dialogue_lines: PackedStringArray = []
var _dialogue_index := 0
var _active_npc_id := ""
var encounter_button: Button
var _combat_overlay: CanvasLayer
var _encounter_resolved := false
var _encounter_registry = EncounterRegistryScript.new()
var _encounter_state_store = EncounterStateStoreScript.new()
var selected_encounter_id := ""
var _selected_encounter_cell := ENCOUNTER_MARKER
var _encounter_markers := Node2D.new()
var _inspection_markers := Node2D.new()

func _ready() -> void:
	_encounter_markers.name = "EncounterMarkers"
	add_child(_encounter_markers)
	_inspection_markers.name = "InspectionMarkersG13"
	add_child(_inspection_markers)
	confirm_button.pressed.connect(_confirm_pending_move)
	confirm_button.hide()
	_build_interaction_ui()
	_build_encounter_ui()
	map_data = MapCatalog.get_map(START_MAP_ID)
	if map_data.is_empty():
		push_error("Start map MAP_01 is not available in the Godot map registry.")
		return
	map_id = START_MAP_ID
	var spawn: Dictionary = map_data.spawns.get("SPAWN_DEFAULT", {"x": 6, "y": 5})
	logical_position = Vector2i(int(spawn.x), int(spawn.y))
	_load_map_visuals()
	_layout_viewport()
	_update_depth()
	get_viewport().size_changed.connect(_on_viewport_size_changed)

func _load_map_visuals() -> void:
	map_columns = int(map_data.width)
	map_rows = int(map_data.height)
	_quest_event_sequence += 1
	_apply_quest_result(_quest_state.record_map_entry(map_id, "explore:%s:%d" % [map_id, _quest_event_sequence]))
	var blocked: Array[Vector2i] = []
	for entry: Dictionary in map_data.blocked_cells:
		blocked.append(Vector2i(int(entry.x), int(entry.y)))
	var path_cells: Array[Vector2i] = []
	var portals: Array[Vector2i] = []
	for entry: Dictionary in map_data.floor_overrides:
		if String(entry.assetId) == "VIS_DIRT_PATH":
			path_cells.append(Vector2i(int(entry.x), int(entry.y)))
	for exit: Dictionary in map_data.exits:
		portals.append(Vector2i(int(exit.x), int(exit.y)))
	board.configure_map(map_columns, map_rows, blocked, path_cells, portals)
	for layer: TileMapLayer in _tile_layers():
		layer.clear()
	_configure_tile_layers()
	scenery.configure(map_origin, map_data)
	for old_marker: Node in _encounter_markers.get_children():
		_encounter_markers.remove_child(old_marker)
		old_marker.queue_free()
	for old_marker: Node in _inspection_markers.get_children():
		_inspection_markers.remove_child(old_marker)
		old_marker.queue_free()
	for point: Dictionary in _inspection_catalog.points_for_map(map_id):
		var marker := Node2D.new()
		marker.name = "Inspect_" + String(point.id)
		marker.set_script(InspectionMarkerScript)
		marker.position = Logic.cell_to_screen(Vector2i(int(point.x), int(point.y)), map_origin)
		marker.z_index = int(point.x) + int(point.y) + 3
		marker.set_meta("logical_cell", Vector2i(int(point.x), int(point.y)))
		marker.set_meta("point_id", String(point.id))
		marker.set_meta("point_data", point)
		marker.set("inspected", _quest_state.is_point_inspected(String(point.id)))
		_inspection_markers.add_child(marker)
	selected_encounter_id = ""
	var pending_ids: Array[String] = []
	for encounter: Dictionary in _encounter_registry.encounters_for_map(map_id):
		var encounter_id := String(encounter.id)
		if _encounter_registry.world_trigger_available(encounter_id) and not _encounter_state_store.is_resolved(encounter_id):
			var placement: Dictionary = encounter.get("spawn_placement", {})
			if not placement.is_empty():
				selected_encounter_id = encounter_id
				_selected_encounter_cell = Vector2i(int(placement.x), int(placement.y))
				var marker := Node2D.new()
				marker.name = "Encounter_" + encounter_id
				marker.set_script(EncounterMarkerScript)
				marker.set("encounter_id", encounter_id)
				marker.set("creature_name", String(encounter.composition[0].name))
				marker.position = Logic.cell_to_screen(_selected_encounter_cell, map_origin)
				marker.z_index = _selected_encounter_cell.x + _selected_encounter_cell.y + 2
				marker.set_meta("logical_cell", _selected_encounter_cell)
				marker.set_meta("encounter_id", encounter_id)
				_encounter_markers.add_child(marker)
		elif String(encounter.get("godot_status", "")) == "PENDING":
			pending_ids.append(encounter_id)
	_last_notice = "Encontros pendentes de gatilho/posição canônicos: %s" % ", ".join(pending_ids) if not pending_ids.is_empty() else ""
	board.origin = map_origin
	board.queue_redraw()
	_set_instructions()
	_refresh_npc_interaction()

func _tile_layers() -> Array[TileMapLayer]:
	return [terrain_tiles, path_tiles, border_tiles, decoration_tiles, obstacle_tiles]

func _configure_tile_layers() -> void:
	for layer: TileMapLayer in _tile_layers():
		layer.scale = Vector2(0.5, 0.5)
		layer.position = map_origin - layer.map_to_local(Vector2i.ZERO) * layer.scale
	var overrides: Dictionary = {}
	for entry: Dictionary in map_data.floor_overrides:
		overrides[Vector2i(int(entry.x), int(entry.y))] = String(entry.assetId)
	for y in map_rows:
		for x in map_columns:
			var cell := Vector2i(x, y)
			var asset_id := String(overrides.get(cell, map_data.base_floor_asset_id))
			match asset_id:
				"VIS_DIRT_PATH":
					terrain_tiles.set_cell(cell, MapCatalog.tile_source_for_asset("VIS_GRASS_BASE"), Vector2i.ZERO)
					path_tiles.set_cell(cell, _path_source(cell), Vector2i.ZERO)
				"VIS_WATER_EDGE":
					terrain_tiles.set_cell(cell, MapCatalog.tile_source_for_asset("VIS_GRASS_BASE"), Vector2i.ZERO)
					border_tiles.set_cell(cell, MapCatalog.tile_source_for_asset(asset_id), Vector2i.ZERO)
				_:
					terrain_tiles.set_cell(cell, MapCatalog.tile_source_for_asset(asset_id), Vector2i.ZERO)
					if asset_id == "VIS_WATER":
						var edge_source := 20 if (x + y) % 2 == 0 else 21
						for neighbor: Vector2i in [Vector2i.RIGHT, Vector2i.DOWN, Vector2i.LEFT, Vector2i.UP]:
							var neighbor_cell := cell + neighbor
							if Logic.is_inside(neighbor_cell, map_columns, map_rows) and not overrides.has(neighbor_cell):
								border_tiles.set_cell(neighbor_cell, edge_source, Vector2i.ZERO)
			if asset_id == "VIS_GRASS_BASE" and (x * 3 + y * 5) % 17 == 0:
				decoration_tiles.set_cell(cell, GRASS_VARIANT_SOURCES[(x + y) % GRASS_VARIANT_SOURCES.size()], Vector2i.ZERO)

func _path_source(cell: Vector2i) -> int:
	var connections: Array[Vector2i] = []
	for direction: Vector2i in Logic.NEIGHBORS:
		if board.path_cells.has(cell + direction):
			connections.append(direction)
	if connections.size() >= 3:
		return 14
	if connections.size() == 2:
		if connections[0] + connections[1] == Vector2i.ZERO:
			return 11 if connections[0].x != 0 else 12
		return 13
	if connections.size() == 1:
		return 11 if connections[0].x != 0 else 12
	return 2

func _unhandled_input(event: InputEvent) -> void:
	if _combat_overlay != null:
		return
	if _dialogue_is_open():
		if event is InputEventKey and event.pressed and not event.echo:
			if event.keycode == KEY_ESCAPE:
				_close_dialogue()
			elif event.keycode in [KEY_ENTER, KEY_KP_ENTER, KEY_SPACE]:
				_advance_dialogue()
			_mark_input_handled()
		return
	if event is InputEventScreenTouch:
		_handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		_handle_screen_drag(event)
	elif event is InputEventMagnifyGesture:
		_set_zoom(camera.zoom.x * event.factor)
		_mark_input_handled()
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E:
		_interact_with_nearest_npc()
		_mark_input_handled()
	elif event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventKey and event.pressed and not event.echo:
		var step := Vector2i.ZERO
		match event.keycode:
			KEY_RIGHT, KEY_D:
				step = Vector2i.RIGHT
			KEY_DOWN, KEY_S:
				step = Vector2i.DOWN
			KEY_LEFT, KEY_A:
				step = Vector2i.LEFT
			KEY_UP, KEY_W:
				step = Vector2i.UP
		if step != Vector2i.ZERO:
			_move_to(logical_position + step)
			_mark_input_handled()

func _handle_mouse_button(event: InputEventMouseButton) -> void:
	if not event.pressed:
		return
	if _dialogue_is_open():
		return
	if event.device == InputEvent.DEVICE_ID_EMULATION or Time.get_ticks_msec() - _last_touch_msec < TOUCH_MOUSE_GUARD_MS:
		_mark_input_handled()
		return
	if event.button_index == MOUSE_BUTTON_WHEEL_UP:
		_set_zoom(camera.zoom.x * 1.12)
		_mark_input_handled()
		return
	if event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
		_set_zoom(camera.zoom.x / 1.12)
		_mark_input_handled()
		return
	if event.button_index == MOUSE_BUTTON_LEFT or event.button_index == MOUSE_BUTTON_RIGHT:
		var encounter_marker := _encounter_at_screen(event.position)
		if encounter_marker != null:
			_interact_with_encounter(encounter_marker)
			_mark_input_handled()
			return
		var npc := _npc_at_screen(event.position)
		if npc != null:
			_interact_with_npc(npc)
			_mark_input_handled()
			return
	var cell := _screen_to_cell(event.position)
	if not Logic.is_inside(cell, map_columns, map_rows):
		return
	if event.button_index == MOUSE_BUTTON_LEFT:
		if cell == _selected_encounter_cell and not selected_encounter_id.is_empty():
			_start_encounter()
			_mark_input_handled()
			return
		_select_cell(cell)
		_mark_input_handled()
	elif event.button_index == MOUSE_BUTTON_RIGHT:
		_select_cell(cell)
		_move_to(cell)
		_mark_input_handled()

func _handle_screen_touch(event: InputEventScreenTouch) -> void:
	_last_touch_msec = Time.get_ticks_msec()
	if event.pressed:
		_touch_positions[event.index] = event.position
		if _touch_positions.size() == 1:
			_touch_start = event.position
			_touch_camera_start = camera.position
			_touch_dragged = false
			_camera_drag_started = true
		elif _touch_positions.size() == 2:
			_pinch_distance = _two_touch_distance()
			_touch_dragged = true # Releasing a pinch must not synthesize a tap.
			_camera_drag_started = false
		_mark_input_handled()
		return
	_touch_positions.erase(event.index)
	if _touch_positions.is_empty():
		if not _touch_dragged:
			_handle_touch_tap(event.position)
		_camera_drag_started = false
	elif _touch_positions.size() < 2:
		_pinch_distance = 0.0
	_mark_input_handled()

func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	_last_touch_msec = Time.get_ticks_msec()
	_touch_positions[event.index] = event.position
	if _touch_positions.size() >= 2:
		var distance := _two_touch_distance()
		if _pinch_distance > 1.0 and distance > 1.0:
			_set_zoom(camera.zoom.x * distance / _pinch_distance)
		_pinch_distance = distance
		_mark_input_handled()
		return
	if not _camera_drag_started:
		return
	if event.position.distance_to(_touch_start) >= 8.0:
		_touch_dragged = true
		_user_panned = true
		camera.position = _touch_camera_start - (event.position - _touch_start) / camera.zoom.x
		_clamp_camera()
		_mark_input_handled()

func _handle_touch_tap(screen_position: Vector2) -> void:
	if _dialogue_is_open():
		return
	var encounter_marker := _encounter_at_screen(screen_position)
	if encounter_marker != null:
		_interact_with_encounter(encounter_marker)
		return
	var npc := _npc_at_screen(screen_position)
	if npc != null:
		_interact_with_npc(npc)
		return
	var cell := _screen_to_cell(screen_position)
	if not Logic.is_inside(cell, map_columns, map_rows):
		return
	if cell == _selected_encounter_cell and not selected_encounter_id.is_empty():
		_start_encounter()
		return
	var now := Time.get_ticks_msec()
	var second_tap := cell == _last_touch_cell and now - _last_tap_msec <= DOUBLE_TAP_MS
	_select_cell(cell)
	if second_tap and _is_walkable_destination(cell):
		_move_to(cell)
		_clear_pending_move()
	else:
		_set_pending_move(cell)
	_last_touch_cell = cell
	_last_tap_msec = now

func _screen_to_cell(screen_position: Vector2) -> Vector2i:
	var world_position: Vector2 = get_viewport().get_canvas_transform().affine_inverse() * screen_position
	return Logic.screen_to_cell(world_position, map_origin, map_columns, map_rows, CELL_WIDTH, CELL_HEIGHT)

func _select_cell(cell: Vector2i) -> void:
	board.selected_cell = cell
	board.queue_redraw()

func _is_walkable_destination(cell: Vector2i) -> bool:
	return Logic.is_inside(cell, map_columns, map_rows) and not board.blocked_cells.has(cell) and not Logic.find_path(logical_position, cell, board.blocked_cells, map_columns, map_rows).is_empty()

func _set_pending_move(cell: Vector2i) -> void:
	_pending_cell = cell if _is_walkable_destination(cell) else Vector2i(-1, -1)
	confirm_button.visible = _pending_cell.x >= 0
	if confirm_button.visible:
		confirm_button.text = "Caminhar para %d, %d" % [_pending_cell.x, _pending_cell.y]

func _confirm_pending_move() -> void:
	if _pending_cell.x < 0:
		return
	var destination := _pending_cell
	_clear_pending_move()
	_move_to(destination)

func _clear_pending_move() -> void:
	_pending_cell = Vector2i(-1, -1)
	confirm_button.hide()

func _set_zoom(value: float) -> void:
	var clamped := clampf(value, 0.55, 1.6)
	_user_zoomed = true
	_user_panned = true
	camera.zoom = Vector2(clamped, clamped)
	_clamp_camera()

func _move_to(destination: Vector2i) -> void:
	if movement_in_progress or _dialogue_is_open():
		return
	var route := Logic.find_path(logical_position, destination, board.blocked_cells, map_columns, map_rows)
	if route.is_empty():
		return
	_walk_route(route)

func _walk_route(route: Array[Vector2i]) -> void:
	movement_in_progress = true
	actor.walking = true
	for next_cell: Vector2i in route:
		var direction := next_cell - logical_position
		actor.set_facing_from_step(direction)
		var tween := create_tween()
		tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
		tween.tween_property(actor, "position", Logic.cell_to_screen(next_cell, map_origin), 0.16)
		await tween.finished
		logical_position = next_cell
		_update_depth()
		_refresh_npc_interaction()
		if not _user_panned:
			_follow_actor_if_needed()
		var exit_data := _exit_at(logical_position)
		if not exit_data.is_empty():
			movement_in_progress = false
			actor.walking = false
			_enter_exit(exit_data)
			return
	actor.walking = false
	movement_in_progress = false
	_refresh_npc_interaction()
	if _layout_pending:
		_layout_viewport()

func _exit_at(cell: Vector2i) -> Dictionary:
	for exit: Dictionary in map_data.exits:
		if int(exit.x) == cell.x and int(exit.y) == cell.y:
			return exit
	return {}

func set_world_flag(flag_id: String, enabled := true) -> void:
	if flag_id.is_empty():
		return
	world_flags[flag_id] = enabled
	_quest_state.set_flag(flag_id, enabled)

func _enter_exit(exit_data: Dictionary) -> void:
	var required_flag := String(exit_data.get("requires_flag", ""))
	if not required_flag.is_empty() and not bool(world_flags.get(required_flag, false)):
		_last_notice = "A passagem exige: %s." % required_flag
		_set_instructions()
		return
	var target_id := String(exit_data.to)
	var target_data := MapCatalog.get_map(target_id)
	if target_data.is_empty():
		_last_notice = "%s → %s não está disponível no catálogo." % [String(exit_data.id), target_id]
		_set_instructions()
		return
	var target_position: Dictionary = exit_data.target_position
	var next_cell := Vector2i(int(target_position.x), int(target_position.y))
	if not Logic.is_inside(next_cell, int(target_data.width), int(target_data.height)):
		push_error("Portal %s points outside %s." % [String(exit_data.id), target_id])
		return
	var target_blocked: Array[Vector2i] = []
	for entry: Dictionary in target_data.blocked_cells:
		target_blocked.append(Vector2i(int(entry.x), int(entry.y)))
	if target_blocked.has(next_cell):
		push_error("Portal %s points to blocked spawn %s." % [String(exit_data.id), str(next_cell)])
		return
	map_id = target_id
	map_data = target_data
	logical_position = next_cell
	_last_notice = ""
	_user_panned = false
	_user_zoomed = false
	_load_map_visuals()
	_layout_viewport()
	_update_depth()

func _update_depth() -> void:
	actor.z_index = logical_position.x + logical_position.y + 1

func _on_viewport_size_changed() -> void:
	if movement_in_progress:
		_layout_pending = true
		return
	_layout_viewport()

func _layout_viewport() -> void:
	_layout_pending = false
	var view_size := get_viewport_rect().size
	var screen_scale := _screen_scale()
	var ui_scale := clampf(1.0 / screen_scale, 1.0, 3.0)
	var mobile_layout := view_size.x * screen_scale < 760.0 or view_size.y > view_size.x
	var mobile_portrait := view_size.y > view_size.x
	if OS.has_feature("web"):
		mobile_layout = mobile_layout or bool(JavaScriptBridge.eval("navigator.maxTouchPoints > 0", true))
	map_origin = Vector2.ZERO
	board.origin = map_origin
	board.queue_redraw()
	for layer: TileMapLayer in _tile_layers():
		layer.position = map_origin - layer.map_to_local(Vector2i.ZERO) * layer.scale
	scenery.update_origin(map_origin)
	for marker: Node2D in _inspection_markers.get_children():
		var cell: Vector2i = marker.get_meta("logical_cell")
		marker.position = Logic.cell_to_screen(cell, map_origin)
	actor.position = Logic.cell_to_screen(logical_position, map_origin)
	var view := _map_view_data()
	if not _user_zoomed:
		var usable_height := view_size.y - (142.0 / screen_scale if view_size.x < view_size.y else 94.0 / screen_scale)
		var fitted := minf((view_size.x - 30.0 / screen_scale) / view.size.x, (usable_height - 28.0 / screen_scale) / view.size.y)
		var mobile_zoom_floor := 1.3 if mobile_layout and not mobile_portrait else (1.0 if mobile_layout else 0.72)
		var zoom_ceiling := 1.3 if mobile_layout else 1.15
		var default_zoom := clampf(fitted, mobile_zoom_floor, zoom_ceiling)
		camera.zoom = Vector2(default_zoom, default_zoom)
	camera.position = view.get_center()
	var title_height := 66.0 if mobile_layout else 60.0
	instructions.position = Vector2(16, 10) * ui_scale
	instructions.size = Vector2(maxf(0.0, view_size.x - 32.0 / screen_scale), title_height * ui_scale)
	instructions.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	instructions.add_theme_font_size_override("font_size", int(round((14 if mobile_layout else 16) * ui_scale)))
	rotation_hint.visible = view_size.x < view_size.y
	rotation_hint.position = Vector2(16, 10.0 + title_height + 2.0) * ui_scale
	rotation_hint.size = Vector2(maxf(0.0, view_size.x - 32.0 / screen_scale), 24 * ui_scale)
	rotation_hint.add_theme_font_size_override("font_size", int(round(13.0 * ui_scale)))
	_set_instructions(mobile_layout)
	confirm_button.position = Vector2(16.0 / screen_scale, view_size.y - 74.0 / screen_scale)
	confirm_button.size = Vector2(minf(320.0 / screen_scale, view_size.x - 32.0 / screen_scale), 58.0 / screen_scale)
	confirm_button.add_theme_font_size_override("font_size", int(round(16.0 / screen_scale)))
	if not confirm_button.visible:
		confirm_button.hide()
	_clamp_camera()
	_layout_interaction_ui()
	if encounter_button != null:
		encounter_button.position = Vector2(16.0 / screen_scale, view_size.y - 74.0 / screen_scale)
		encounter_button.size = Vector2(minf(320.0 / screen_scale, view_size.x - 32.0 / screen_scale), 58.0 / screen_scale)
		encounter_button.add_theme_font_size_override("font_size", int(round(16.0 / screen_scale)))

func _map_view_data() -> Rect2:
	var left := -(map_rows - 1) * CELL_WIDTH * 0.5 - CELL_WIDTH * 0.5
	var right := (map_columns - 1) * CELL_WIDTH * 0.5 + CELL_WIDTH * 0.5
	var top := -156.0
	var bottom := (map_columns + map_rows - 2) * CELL_HEIGHT * 0.5 + CELL_HEIGHT * 0.5
	return Rect2(Vector2(left, top), Vector2(right - left, bottom - top))

func _follow_actor_if_needed() -> void:
	var view_size := get_viewport_rect().size / camera.zoom
	var map_bounds := _map_view_data()
	if map_bounds.size.x > view_size.x or map_bounds.size.y > view_size.y:
		camera.position = actor.position
		_clamp_camera()

func _two_touch_distance() -> float:
	var points: Array = _touch_positions.values()
	if points.size() < 2:
		return 0.0
	return (points[0] as Vector2).distance_to(points[1] as Vector2)

func _screen_scale() -> float:
	if not OS.has_feature("web"):
		return 1.0
	return maxf(get_viewport().get_screen_transform().get_scale().x, 0.25)

func _mark_input_handled() -> void:
	var viewport := get_viewport()
	if viewport != null and viewport.is_inside_tree():
		viewport.set_input_as_handled()

func _clamp_camera() -> void:
	var visible_size := get_viewport_rect().size / camera.zoom
	var bounds := _map_view_data()
	var min_x := bounds.position.x + visible_size.x * 0.5
	var max_x := bounds.end.x - visible_size.x * 0.5
	var min_y := bounds.position.y + visible_size.y * 0.5
	var max_y := bounds.end.y - visible_size.y * 0.5
	var center := bounds.get_center()
	camera.position.x = center.x if min_x > max_x else clampf(camera.position.x, min_x, max_x)
	camera.position.y = center.y if min_y > max_y else clampf(camera.position.y, min_y, max_y)

func _set_instructions(mobile_layout := false) -> void:
	if instructions == null:
		return
	var name := String(map_data.get("name", map_id))
	var notice := "  ·  " + _last_notice if not _last_notice.is_empty() else ""
	if mobile_layout:
		instructions.text = "%s · %s   |   Toque: mover · NPC: conversar · arraste/pinça: câmera%s" % [map_id, name, notice]
	else:
		var character := CharacterRoster.character_data(CharacterRoster.selected_id)
		instructions.text = "%s · %s · %s   |   Clique: selecionar · NPC: conversar · direito/setas/WASD: mover%s" % [map_id, name, String(character.get("display_name", "Aventureiro")), notice]

func _build_interaction_ui() -> void:
	quest_tracker = Label.new()
	quest_tracker.name = "QuestTrackerG13"
	quest_tracker.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quest_tracker.add_theme_color_override("font_color", Color("fff0b0"))
	quest_tracker.add_theme_font_size_override("font_size", 14)
	$HUD.add_child(quest_tracker)
	talk_button = Button.new()
	talk_button.name = "TalkToNpc"
	talk_button.text = "Conversar"
	talk_button.focus_mode = Control.FOCUS_ALL
	talk_button.custom_minimum_size = Vector2(0, 52)
	talk_button.hide()
	talk_button.pressed.connect(_interact_with_nearest_npc)
	$HUD.add_child(talk_button)
	inspect_button = Button.new()
	inspect_button.name = "InspectPointG13"
	inspect_button.text = "Investigar"
	inspect_button.custom_minimum_size = Vector2(0, 52)
	inspect_button.hide()
	inspect_button.pressed.connect(_inspect_nearest_point)
	$HUD.add_child(inspect_button)

	dialogue_panel = PanelContainer.new()
	dialogue_panel.name = "NpcDialoguePanel"
	dialogue_panel.visible = false
	dialogue_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color("18231f")
	panel_style.border_color = Color("9dc884")
	panel_style.set_border_width_all(2)
	panel_style.set_corner_radius_all(12)
	panel_style.content_margin_left = 18
	panel_style.content_margin_right = 18
	panel_style.content_margin_top = 12
	panel_style.content_margin_bottom = 12
	dialogue_panel.add_theme_stylebox_override("panel", panel_style)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 8)
	dialogue_panel.add_child(stack)
	dialogue_name = Label.new()
	dialogue_name.add_theme_color_override("font_color", Color("fff0b0"))
	dialogue_name.add_theme_font_size_override("font_size", 20)
	stack.add_child(dialogue_name)
	dialogue_text = Label.new()
	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	dialogue_text.add_theme_color_override("font_color", Color("f5f1e7"))
	dialogue_text.add_theme_font_size_override("font_size", 17)
	stack.add_child(dialogue_text)
	dialogue_advance = Button.new()
	dialogue_advance.text = "Fechar diálogo"
	dialogue_advance.custom_minimum_size = Vector2(0, 52)
	dialogue_advance.focus_mode = Control.FOCUS_ALL
	dialogue_advance.pressed.connect(_advance_dialogue)
	dialogue_advance.hide()
	$HUD.add_child(dialogue_panel)
	$HUD.add_child(dialogue_advance)
	quest_accept_button = Button.new()
	quest_accept_button.name = "AcceptQuestG13"
	quest_accept_button.custom_minimum_size = Vector2(0, 52)
	quest_accept_button.pressed.connect(_accept_quest_from_dialogue)
	quest_accept_button.hide()
	$HUD.add_child(quest_accept_button)

func _build_encounter_ui() -> void:
	encounter_button = Button.new()
	encounter_button.name = "StartEncounter"
	encounter_button.text = "Investigar encontro"
	encounter_button.custom_minimum_size = Vector2(0, 58)
	encounter_button.add_theme_font_size_override("font_size", 16)
	encounter_button.hide()
	encounter_button.pressed.connect(_start_encounter)
	$HUD.add_child(encounter_button)

func _layout_interaction_ui(size_override: Vector2 = Vector2.ZERO) -> void:
	if talk_button == null or dialogue_panel == null:
		return
	var view_size := size_override if size_override != Vector2.ZERO else get_viewport_rect().size
	var screen_scale := maxf(_screen_scale(), 0.25)
	var ui_scale := clampf(1.0 / screen_scale, 1.0, 3.0)
	var is_portrait := view_size.y > view_size.x
	var margin := 16.0 * ui_scale
	var gap := 12.0 * ui_scale
	var available_width := maxf(0.0, view_size.x - margin * 2.0 - gap)
	var width := maxf(0.0, available_width * 0.5) if confirm_button.visible else minf(240.0 * ui_scale, view_size.x - margin * 2.0)
	talk_button.add_theme_font_size_override("font_size", int(round(16.0 * ui_scale)))
	confirm_button.add_theme_font_size_override("font_size", int(round(16.0 * ui_scale)))
	if encounter_button != null and encounter_button.visible:
		encounter_button.position = Vector2(margin, view_size.y - 74.0 * ui_scale)
		encounter_button.size = Vector2(minf(320.0 * ui_scale, view_size.x - margin * 2.0), 58.0 * ui_scale)
		encounter_button.add_theme_font_size_override("font_size", int(round(16.0 * ui_scale)))
	elif confirm_button.visible:
		confirm_button.position = Vector2(margin, view_size.y - 74.0 * ui_scale)
		confirm_button.size = Vector2(width, 58.0 * ui_scale)
		talk_button.position = Vector2(margin + width + gap, view_size.y - 74.0 * ui_scale)
		talk_button.size = Vector2(width, 58.0 * ui_scale)
		if width < 200.0 * ui_scale:
			talk_button.text = "Conversar"
	else:
		talk_button.position = Vector2(view_size.x - width - margin, view_size.y - 74.0 * ui_scale)
		talk_button.size = Vector2(width, 58.0 * ui_scale)
	if inspect_button != null and inspect_button.visible:
		inspect_button.position = Vector2(view_size.x - width - margin, view_size.y - 74.0 * ui_scale)
		inspect_button.size = Vector2(width, 58.0 * ui_scale)
		inspect_button.add_theme_font_size_override("font_size", int(round(16.0 * ui_scale)))
	var panel_height := (200.0 if is_portrait else 184.0) * ui_scale
	var panel_top := view_size.y - panel_height - 12.0 * ui_scale
	dialogue_panel.position = Vector2(12.0 * ui_scale, panel_top)
	dialogue_panel.size = Vector2(maxf(0.0, view_size.x - 24.0 * ui_scale), panel_height)
	var action_width := minf(180.0 * ui_scale, view_size.x - margin * 2.0)
	dialogue_advance.position = Vector2(view_size.x - margin - action_width, view_size.y - 64.0 * ui_scale)
	dialogue_advance.size = Vector2(action_width, 52.0 * ui_scale)
	if quest_accept_button != null:
		quest_accept_button.position = Vector2(margin, view_size.y - 64.0 * ui_scale)
		quest_accept_button.size = Vector2(minf(260.0 * ui_scale, maxf(0.0, view_size.x - action_width - margin * 3.0)), 52.0 * ui_scale)
	dialogue_name.add_theme_font_size_override("font_size", int(round(20.0 * ui_scale)))
	dialogue_text.add_theme_font_size_override("font_size", int(round(17.0 * ui_scale)))
	dialogue_advance.add_theme_font_size_override("font_size", int(round(16.0 * ui_scale)))
	dialogue_advance.custom_minimum_size.y = 52.0 * ui_scale
	if quest_tracker != null:
		quest_tracker.position = Vector2(margin, 62.0 * ui_scale)
		quest_tracker.size = Vector2(maxf(0.0, view_size.x - margin * 2.0), 48.0 * ui_scale)
		quest_tracker.add_theme_font_size_override("font_size", int(round(14.0 * ui_scale)))

func _dialogue_is_open() -> bool:
	return dialogue_panel != null and dialogue_panel.visible

func _npc_at_screen(screen_position: Vector2) -> Node2D:
	var world_position: Vector2 = get_viewport().get_canvas_transform().affine_inverse() * screen_position
	var nearest: Node2D
	var nearest_distance := INF
	for marker in scenery.get_children():
		if not marker.has_meta("npc_id"):
			continue
		var local: Vector2 = marker.to_local(world_position)
		if local.x >= -24.0 and local.x <= 24.0 and local.y >= -52.0 and local.y <= 10.0:
			var distance: float = local.length()
			if distance < nearest_distance:
				nearest = marker
				nearest_distance = distance
	return nearest

func _npc_distance(marker: Node2D) -> int:
	var cell: Vector2i = marker.get_meta("logical_cell")
	return absi(cell.x - logical_position.x) + absi(cell.y - logical_position.y)

func _refresh_npc_interaction() -> void:
	if not is_node_ready() or scenery == null or talk_button == null:
		return
	var closest: Node2D
	var closest_distance := 999
	for marker in scenery.get_children():
		if not marker.has_meta("npc_id"):
			continue
		var distance := _npc_distance(marker)
		marker.can_interact = distance <= 1
		marker.queue_redraw()
		if distance < closest_distance:
			closest = marker
			closest_distance = distance
	var inspection_marker := _nearest_inspection_marker()
	var inspection_distance := _inspection_distance(inspection_marker) if inspection_marker != null else 999
	inspect_button.visible = inspection_marker != null and inspection_distance <= 1 and not _dialogue_is_open()
	if inspect_button.visible:
		var point: Dictionary = inspection_marker.get_meta("point_data")
		var provisional := String(point.get("position_status", "")) == "PROVISIONAL_LOGICAL"
		inspect_button.text = "Investigar · posição provisória" if provisional else "Investigar"
		inspect_button.tooltip_text = String(point.get("item_name", point.get("id", "ponto")))
	talk_button.visible = closest != null and closest_distance <= 1 and not _dialogue_is_open() and not inspect_button.visible
	if talk_button.visible:
		talk_button.text = "Conversar com %s" % String(closest.display_name).get_slice(",", 0)
	_layout_interaction_ui()
	_refresh_encounter_interaction()

func _interact_with_nearest_npc() -> void:
	if inspect_button != null and inspect_button.visible:
		_inspect_nearest_point()
		return
	var closest: Node2D
	var closest_distance := 999
	for marker in scenery.get_children():
		if marker.has_meta("npc_id") and _npc_distance(marker) < closest_distance:
			closest = marker
			closest_distance = _npc_distance(marker)
	if closest != null and closest_distance <= 1:
		_open_npc_dialogue(String(closest.get_meta("npc_id")))

func _nearest_inspection_marker() -> Node2D:
	var nearest: Node2D
	var nearest_distance := 999
	for marker: Node2D in _inspection_markers.get_children():
		if bool(marker.get("inspected")):
			continue
		var distance := _inspection_distance(marker)
		marker.set("can_interact", distance <= 1)
		marker.queue_redraw()
		if distance < nearest_distance:
			nearest = marker
			nearest_distance = distance
	return nearest

func _inspection_distance(marker: Node2D) -> int:
	var cell: Vector2i = marker.get_meta("logical_cell")
	return absi(cell.x - logical_position.x) + absi(cell.y - logical_position.y)

func _inspect_nearest_point() -> void:
	var marker := _nearest_inspection_marker()
	if marker == null:
		return
	if _inspection_distance(marker) > 1:
		_last_notice = "Aproxime-se do ponto para investigar."
		_set_instructions()
		return
	var point: Dictionary = marker.get_meta("point_data")
	var validation := _inspection_catalog.validate({map_id: map_data})
	if not validation.is_empty():
		push_error("Inspection point registry is invalid: " + ", ".join(validation))
		return
	var result := _quest_state.record_inspection(point)
	if not result.accepted:
		return
	marker.set("inspected", true)
	marker.queue_redraw()
	_last_notice = "%s registrado; o item aguarda integração do inventário." % String(point.get("item_name", "Ponto de interesse"))
	_set_instructions()
	_refresh_quest_tracker()
	_refresh_npc_interaction()

func _interact_with_npc(marker: Node2D) -> void:
	if movement_in_progress or _dialogue_is_open():
		return
	if _npc_distance(marker) > 1:
		_last_notice = "Aproxime-se de %s para conversar." % String(marker.display_name).get_slice(",", 0)
		_set_instructions()
		return
	_open_npc_dialogue(String(marker.get_meta("npc_id")))

func _open_npc_dialogue(npc_id: String) -> void:
	var definition := NpcDialogueCatalog.get_npc(npc_id)
	if definition.is_empty():
		push_error("No canonical dialogue defined for NPC: " + npc_id)
		return
	_active_npc_id = npc_id
	var dialogue_state := _quest_state.dialogue_state_for_npc(npc_id)
	_quest_event_sequence += 1
	_apply_quest_result(_quest_state.record_npc_talk(npc_id, "talk:%s:%d" % [npc_id, _quest_event_sequence]))
	_dialogue_lines = PackedStringArray()
	var states: Dictionary = definition.get("states", {})
	var greeting := String(states.get(dialogue_state, definition.get("greeting", "")))
	for line: String in greeting.split("\n", false):
		if not line.strip_edges().is_empty():
			_dialogue_lines.append(line)
	if _dialogue_lines.is_empty():
		push_error("NPC greeting is empty: " + npc_id)
		return
	_dialogue_index = 0
	_clear_pending_move()
	dialogue_name.text = String(definition.get("name", npc_id))
	dialogue_text.text = _dialogue_lines[_dialogue_index]
	dialogue_advance.text = "Fechar diálogo" if _dialogue_lines.size() == 1 else "Continuar"
	dialogue_panel.show()
	dialogue_advance.show()
	_refresh_quest_accept_button()
	talk_button.hide()
	_layout_interaction_ui()
	dialogue_advance.grab_focus()
	_last_notice = ""

func _advance_dialogue() -> void:
	if not _dialogue_is_open():
		return
	_dialogue_index += 1
	if _dialogue_index >= _dialogue_lines.size():
		_close_dialogue()
		return
	dialogue_text.text = _dialogue_lines[_dialogue_index]
	dialogue_advance.text = "Fechar diálogo" if _dialogue_index == _dialogue_lines.size() - 1 else "Continuar"

func _close_dialogue() -> void:
	if dialogue_panel == null:
		return
	dialogue_panel.hide()
	dialogue_advance.hide()
	quest_accept_button.hide()
	_active_npc_id = ""
	_dialogue_lines = []
	_refresh_npc_interaction()
	_set_instructions()

func _refresh_quest_accept_button() -> void:
	if quest_accept_button == null:
		return
	var available: Array[String] = _quest_state.available_quests_for_npc(_active_npc_id)
	quest_accept_button.visible = _dialogue_is_open() and not available.is_empty()
	if quest_accept_button.visible:
		var definition: Dictionary = _quest_state._quests[available[0]]
		quest_accept_button.text = "Aceitar: %s" % String(definition.get("title", available[0]))
	_layout_interaction_ui()

func _accept_quest_from_dialogue() -> void:
	var available: Array[String] = _quest_state.available_quests_for_npc(_active_npc_id)
	if available.is_empty() or not _quest_state.accept_quest(available[0]):
		return
	_refresh_quest_tracker()
	_refresh_quest_accept_button()

func _encounter_at_screen(screen_position: Vector2) -> Node2D:
	if selected_encounter_id.is_empty():
		return null
	var world_position: Vector2 = get_viewport().get_canvas_transform().affine_inverse() * screen_position
	for marker in _encounter_markers.get_children():
		if marker.has_meta("encounter_id"):
			var local: Vector2 = marker.to_local(world_position)
			if local.x >= -48 and local.x <= 48 and local.y >= -68 and local.y <= 12:
				return marker
	return null

func _interact_with_encounter(marker: Node2D) -> void:
	if movement_in_progress:
		return
	_start_encounter()

func _refresh_encounter_interaction() -> void:
	if encounter_button == null or not is_node_ready():
		return
	var can_start := not selected_encounter_id.is_empty() and _encounter_registry.world_trigger_available(selected_encounter_id) and not _encounter_state_store.is_resolved(selected_encounter_id) and not movement_in_progress and not _dialogue_is_open()
	encounter_button.visible = can_start
	if can_start:
		var entry := _encounter_registry.encounter(selected_encounter_id)
		var names: Array[String] = []
		for member: Dictionary in entry.get("composition", []):
			names.append(String(member.name))
		encounter_button.text = "Investigar %s · %s" % [selected_encounter_id, " + ".join(names)]
		talk_button.hide()
	_layout_interaction_ui()

func _start_encounter() -> void:
	if _combat_overlay != null or selected_encounter_id.is_empty() or not _encounter_registry.world_trigger_available(selected_encounter_id) or _encounter_state_store.is_resolved(selected_encounter_id):
		return
	var definition: Dictionary = _encounter_registry.combat_definition(selected_encounter_id)
	if not definition.get("ok", false):
		_last_notice = "%s pendente: %s" % [selected_encounter_id, definition.get("reason", "mecânica ausente")]
		_set_instructions()
		return
	var started: Dictionary = _encounter_state_store.start(selected_encounter_id, false)
	if not started.get("ok", false):
		return
	_clear_pending_move()
	encounter_button.hide()
	talk_button.hide()
	instructions.hide()
	confirm_button.hide()
	rotation_hint.hide()
	board.hide()
	scenery.hide()
	actor.hide()
	for layer: TileMapLayer in _tile_layers():
		layer.hide()
	_combat_overlay = CombatOverlayScript.new()
	_combat_overlay.configure(definition, _encounter_state_store)
	_combat_overlay.combat_finished.connect(_on_combat_finished)
	add_child(_combat_overlay)

func _on_combat_finished(result: String, _remaining_hp: int) -> void:
	if result == "DEFEAT":
		return
	if result != "VICTORY":
		return
	var completed_encounter_id := selected_encounter_id
	if _combat_overlay != null:
		var combat_record: Dictionary = _combat_overlay.get("result_record")
		for event: Dictionary in combat_record.get("events", []):
			var event_type := String(event.get("type", ""))
			var target := String(event.get("creatureId", event.get("encounterId", "")))
			var source_id := String(event.get("combatantId", event.get("encounterId", completed_encounter_id)))
			_quest_event_sequence += 1
			_apply_quest_result(_quest_state.process_event({"eventId": "combat:%s:%s" % [completed_encounter_id, source_id], "type": event_type, "target": target}))
	_encounter_resolved = true
	if _combat_overlay != null:
		_combat_overlay.queue_free()
		_combat_overlay = null
	for layer: TileMapLayer in _tile_layers():
		layer.show()
	board.show()
	scenery.show()
	actor.show()
	_load_map_visuals()
	_layout_viewport()
	_update_depth()
	_refresh_npc_interaction()
	_refresh_encounter_interaction()
	_last_notice = "%s vencido. O encontro está resolvido nesta sessão." % completed_encounter_id
	_set_instructions()
	_refresh_quest_tracker()

func _apply_quest_result(result: Dictionary) -> void:
	for flag_id: String in result.get("unlocked_flags", []):
		set_world_flag(flag_id, true)
	_refresh_quest_tracker()

func _refresh_quest_tracker() -> void:
	if quest_tracker == null:
		return
	quest_tracker.text = _quest_state.tracker_text()
	quest_tracker.visible = not quest_tracker.text.is_empty()
