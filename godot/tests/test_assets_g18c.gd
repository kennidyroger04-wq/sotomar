extends SceneTree

const BoardScript = preload("res://scripts/combat_board_g10.gd")
const SceneryScript = preload("res://scripts/scenery_layer.gd")
const LogicScript = preload("res://scripts/iso_board_logic.gd")
const FRAMES_PATH := "res://resources/animations/cascudo_de_cal_g18c.tres"
const TEXTURE_PATH := "res://assets/characters/cascudo_g18c/cascudo_de_cal_idle.png"
const MIRA_FRAMES_PATH := "res://resources/animations/mira_g18c.tres"
const MIRA_TEXTURE_PATH := "res://assets/characters/npc_mira_g18c/mira_idle.png"
var checks := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var image := Image.load_from_file(ProjectSettings.globalize_path(TEXTURE_PATH))
	_check(image != null and image.get_size() == Vector2i(1122, 1402), "Cascudo atlas source dimensions are exact")
	_check(image != null and image.get_format() == Image.FORMAT_RGBA8, "Cascudo atlas is RGBA")
	if image != null:
		_check(image.get_pixel(0, 0).a == 0.0 and image.get_pixel(5, 5).a == 0.0, "Cascudo atlas retains transparent margins")
	var frames := load(FRAMES_PATH) as SpriteFrames
	_check(frames != null, "Cascudo SpriteFrames resource resolves")
	if frames == null:
		quit(1)
		return
	var animation_names := ["idle_front", "idle_left", "idle_back", "idle_right"]
	for animation in animation_names:
		_check(frames.has_animation(animation), "%s animation exists" % animation)
		_check(frames.get_frame_count(animation) == 4, "%s has four atlas frames" % animation)
		_check(frames.get_animation_loop(animation), "%s loops for idle" % animation)
		for frame_index in frames.get_frame_count(animation):
			var texture := frames.get_frame_texture(animation, frame_index) as AtlasTexture
			_check(texture != null and texture.region.size == Vector2(280, 350), "%s frame %d uses the common atlas region" % [animation, frame_index])
	_check(FileAccess.file_exists("res://art/source/generated_g18c/cascudo_de_cal_idle_master.png"), "editable/source master is retained")
	_check(FileAccess.file_exists("res://resources/animations/cascudo_de_cal_g18c.tres"), "runtime SpriteFrames are retained")
	_check(FileAccess.file_exists("res://resources/animations/cascudo_de_cal_g18c.json"), "animation and pivot metadata are retained")
	_check(FileAccess.get_file_as_bytes("res://art/source/generated_g18c/cascudo_de_cal_idle_master.png") == FileAccess.get_file_as_bytes(TEXTURE_PATH), "Cascudo runtime atlas is byte-identical to its source master")
	_check(FileAccess.get_file_as_bytes("res://art/source/generated_g18c/caieira_lime_cottage_master.png") == FileAccess.get_file_as_bytes("res://assets/props/g18c/caieira_lime_cottage.png"), "Caieira runtime prop is byte-identical to its source master")
	var mira_image := Image.load_from_file(ProjectSettings.globalize_path(MIRA_TEXTURE_PATH))
	_check(mira_image != null and mira_image.get_size() == Vector2i(1122, 1402), "Mira atlas dimensions are exact")
	_check(mira_image != null and mira_image.get_format() == Image.FORMAT_RGBA8 and mira_image.get_pixel(0, 0).a == 0.0, "Mira atlas has RGBA transparency")
	var mira_frames := load(MIRA_FRAMES_PATH) as SpriteFrames
	_check(mira_frames != null, "Mira SpriteFrames resource resolves")
	if mira_frames != null:
		for direction in ["front", "left", "back", "right"]:
			var animation: String = "idle_" + direction
			_check(mira_frames.has_animation(animation), "%s animation exists" % animation)
			_check(mira_frames.get_frame_count(animation) == 4 and mira_frames.get_animation_loop(animation), "%s has a looping four-frame idle" % animation)
			for frame_index in 4:
				var texture := mira_frames.get_frame_texture(animation, frame_index) as AtlasTexture
				_check(texture != null and texture.region.size == Vector2(280, 350), "%s frame %d uses the shared atlas region" % [animation, frame_index])
	_check(FileAccess.get_file_as_bytes("res://art/source/generated_g18c/mira_idle_master.png") == FileAccess.get_file_as_bytes(MIRA_TEXTURE_PATH), "Mira runtime atlas is byte-identical to its source master")
	var board := BoardScript.new()
	root.add_child(board)
	var player_frames := load("res://resources/combat/wayfarer_combat_g05.tres") as SpriteFrames
	var state := {"height": 6, "width": 8, "blocked": [], "units": [
		{"id": "player", "side": "player", "x": 1, "y": 2, "hp": 100, "max_hp": 100, "pm": 4},
		{"id": "CRE_CASCUDO_DE_CAL_01", "side": "mob", "canonical_id": "CRE_CASCUDO_DE_CAL", "x": 4, "y": 3, "hp": 40, "max_hp": 40, "pm": 3}
	]}
	board.configure(state, player_frames)
	var creature: AnimatedSprite2D = board.sprites.get("CRE_CASCUDO_DE_CAL_01")
	var combat_creature_frames := load("res://resources/animations/cre_cascudo_de_cal_g18d.tres") as SpriteFrames
	_check(creature != null, "Cascudo combat participant uses original art in the existing board")
	_check(creature != null and creature.sprite_frames == combat_creature_frames and creature.offset == Vector2(0, -214), "combat renderer uses complete G18D SpriteFrames and feet pivot; G18C source remains preserved")
	_check(creature != null and creature.animation.begins_with("idle_"), "combat starts the directional idle loop")
	var map_file := FileAccess.open("res://resources/maps/map_registry.json", FileAccess.READ)
	var map_registry: Dictionary = JSON.parse_string(map_file.get_as_text())	if map_file != null else {}
	var map_data: Dictionary = map_registry.get("maps", {}).get("MAP_01", {})
	var scenery := SceneryScript.new()
	root.add_child(scenery)
	scenery.configure(Vector2.ZERO, map_data)
	var house_count := 0
	for prop: Node in scenery.get_children():
		if not prop.has_meta("asset_id") or String(prop.get_meta("asset_id")) != "VIS_HOUSE_SMALL":
			continue
		house_count += 1
		var house_sprite := prop.get_node_or_null("IllustratedSprite") as Sprite2D
		_check(house_sprite != null and house_sprite.texture != null, "canonical Caieira house placeholder resolves to original cottage art")
		_check(house_sprite != null and house_sprite.scale.is_equal_approx(Vector2.ONE * 0.11), "cottage sprite uses the documented scale")
		var expected_cell := Vector2i(-1, -1)
		for source_prop: Dictionary in map_data.props:
			if String(source_prop.get("id", "")) == String(prop.name):
				expected_cell = Vector2i(int(source_prop.x), int(source_prop.y))
		_check(expected_cell.x >= 0 and Vector2i(prop.get_meta("logical_cell")) == expected_cell and prop.position == LogicScript.cell_to_screen(expected_cell, Vector2.ZERO), "cottage retains its authored cell and depth anchor")
	_check(house_count == 3, "all three Caieira house placeholders use the same original asset ID")
	var mira_marker: Node2D = scenery.get_node_or_null("NPC_guarda_mira")
	var mira_sprite := mira_marker.get_node_or_null("MiraSprite") as AnimatedSprite2D if mira_marker != null else null
	_check(mira_marker != null and String(mira_marker.get_meta("visual_status", "")) == "original_proposal_idle", "Mira canonical NPC marker identifies the proposed original art status")
	_check(mira_sprite != null and mira_sprite.sprite_frames == mira_frames, "Mira original idle is attached to the existing NPC marker")
	_check(mira_sprite != null and mira_sprite.scale.is_equal_approx(Vector2.ONE * 0.22) and mira_sprite.offset == Vector2(0, -175) and mira_sprite.animation == "idle_front", "Mira uses the shared feet pivot, world scale, and directional idle")
	_check(mira_marker != null and Vector2i(mira_marker.get_meta("logical_cell")) == Vector2i(1, 1) and mira_marker.z_index == 3, "Mira keeps the existing authored logical cell and depth")
	_check(FileAccess.file_exists("res://resources/art/mira_g18c.json"), "Mira provenance and pivot metadata are retained")
	if checks == 83:
		print("G18C asset technical checks: %d passed" % checks)
		quit(0)
	else:
		push_error("Unexpected G18C asset check count: %d" % checks)
		quit(1)

func _check(condition: bool, description: String) -> void:
	if not condition:
		push_error("FAIL: " + description)
		quit(1)
		return
	checks += 1
	print("PASS: " + description)
