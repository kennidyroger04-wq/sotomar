extends SceneTree

const DIRECTIONS := ["ne", "se", "sw", "nw"]
const ACTIONS := ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
const Logic = preload("res://scripts/iso_board_logic.gd")
var failures := 0
var roster: Variant

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	roster = root.get_node("CharacterRoster")
	_test_male_animation_pack()
	_test_equipment_pack()
	_test_female_preservation_and_shared_rules()
	await _test_selection_and_persistence()
	await _test_main_scene_actor_swap()
	await _test_comparison_scene()
	if failures == 0:
		print("PASS: G06 character pack, selection, persistence, and integration")
		quit(0)
	else:
		push_error("%d G06 character check(s) failed" % failures)
		quit(1)

func _test_male_animation_pack() -> void:
	var frames := load("res://resources/characters/warrior_male_g06.tres") as SpriteFrames
	var valid := frames != null
	if valid:
		valid = frames.get_animation_names().size() == 28
		var expected_fps := {"idle": 4.0, "walk": 8.0, "attack": 6.0, "hurt": 6.0, "defend": 5.0, "cast": 6.0, "death": 4.0}
		for action in ACTIONS:
			for direction in DIRECTIONS:
				var name := "%s_%s" % [action, direction]
				valid = valid and frames.has_animation(name) and frames.get_frame_count(name) == 4
				valid = valid and frames.get_animation_speed(name) == expected_fps[action]
				valid = valid and frames.get_animation_loop(name) == (action in ["idle", "walk"])
				if frames.has_animation(name) and frames.get_frame_count(name) == 4:
					for index in 4:
						var texture := frames.get_frame_texture(name, index)
						valid = valid and texture != null and texture.get_size() == Vector2(128, 160)
		_check(valid, "112 male frames load through 28 directional animations at 128x160")

func _test_equipment_pack() -> void:
	var male := load("res://resources/characters/warrior_male_equipment_g06.tres") as SpriteFrames
	var female := load("res://resources/combat/wayfarer_equipment_g05.tres") as SpriteFrames
	var male_names: Array = male.get_animation_names() if male != null else []
	var female_names: Array = female.get_animation_names() if female != null else []
	male_names.erase("default")
	female_names.erase("default")
	var valid: bool = male != null and female != null and male_names.size() == 8 and female_names.size() == 8
	if valid:
		for direction in DIRECTIONS:
			for slot in ["sword", "shield"]:
				var name := "%s_%s" % [slot, direction]
				valid = valid and male.has_animation(name) and male.get_frame_count(name) == 1
				valid = valid and male.get_frame_texture(name, 0).get_size() == Vector2(128, 160)
	_check(valid, "male and female weapon/shield layers retain all four directions")

func _test_female_preservation_and_shared_rules() -> void:
	var source := load("res://assets/characters/wayfarer_v1/wayfarer_v1.png") as Texture2D
	var female := load("res://resources/combat/wayfarer_combat_g05.tres") as SpriteFrames
	var male_data: Dictionary = roster.character_data("character.warrior_male.g06")
	var female_data: Dictionary = roster.character_data("character.wayfarer.g05")
	var valid := source != null and female != null and female.get_animation_names().size() == 28
	valid = valid and female.has_animation("idle_se") and female.has_animation("walk_nw")
	valid = valid and male_data.get("stats") == female_data.get("stats")
	valid = valid and male_data.get("equipment") != female_data.get("equipment")
	valid = valid and roster.character_ids() == ["character.warrior_male.g06", "character.wayfarer.g05"]
	_check(valid, "Wayfarer source, IDs, animations, and equipment resources remain available with identical gameplay stats")

func _test_selection_and_persistence() -> void:
	var original_id: String = roster.selected_id
	var menu := (load("res://scenes/character_select.tscn") as PackedScene).instantiate()
	root.add_child(menu)
	await process_frame
	var menu_valid: bool = menu.cards.size() == 2 and menu.previews.size() == 2 and menu.enter_button != null
	menu.select_index(0)
	menu_valid = menu_valid and menu.selected_index == 0
	menu.select_index(1)
	menu_valid = menu_valid and menu.selected_index == 1
	menu._unhandled_key_input(_key(KEY_LEFT))
	menu_valid = menu_valid and menu.selected_index == 0
	_check(menu_valid, "selection screen builds two previews and mouse/keyboard selection controls")
	menu.queue_free()

	var save_valid: bool = roster.set_selected("character.wayfarer.g05")
	var fresh_script := load("res://scripts/characters/character_roster.gd") as GDScript
	var fresh := fresh_script.new() as Node
	root.add_child(fresh)
	await process_frame
	save_valid = save_valid and fresh.selected_id == "character.wayfarer.g05"
	save_valid = save_valid and roster.set_selected(original_id)
	_check(save_valid, "selected character persists in the local Godot user config and can be restored")
	fresh.queue_free()

func _test_main_scene_actor_swap() -> void:
	var saved: String = roster.selected_id
	var main_scene := load("res://scenes/main.tscn") as PackedScene
	var valid := main_scene != null
	if not valid:
		_check(false, "main prototype scene loads")
		return
	var game := main_scene.instantiate()
	root.add_child(game)
	await process_frame
	var actor: Node2D = game.get_node("Actors/Player")
	var sprite := actor.get_node("CharacterSprite") as AnimatedSprite2D
	var equipment: Node = actor.get_node("EquipmentRig")
	valid = actor.position == Logic.cell_to_screen(game.logical_position, game.map_origin)
	valid = valid and sprite != null and sprite.sprite_frames == roster.get_character_frames(saved)
	roster.set_selected("character.warrior_male.g06", false)
	actor.set_character_frames(roster.get_character_frames())
	valid = valid and sprite.sprite_frames == load("res://resources/characters/warrior_male_g06.tres")
	actor.set_facing_from_step(Vector2i.UP)
	actor.walking = true
	valid = valid and sprite.animation == "walk_ne" and equipment.direction == "ne" and equipment.body_action == "walk"
	equipment.set_overlays_enabled(true)
	valid = valid and equipment.sword.visible and equipment.shield.visible
	equipment.set_action("idle")
	valid = valid and equipment.sword.visible and equipment.shield.visible
	equipment.set_action("attack")
	valid = valid and not equipment.sword.visible and not equipment.shield.visible
	equipment.set_action("idle")
	actor.walking = false
	roster.set_selected("character.wayfarer.g05", false)
	actor.set_character_frames(roster.get_character_frames())
	valid = valid and sprite.sprite_frames == load("res://resources/combat/wayfarer_combat_g05.tres")
	valid = valid and actor.position == Logic.cell_to_screen(game.logical_position, game.map_origin)
	_check(valid, "both protagonist choices swap on the existing player at the same logical cell")
	roster.set_selected(saved, false)
	game.queue_free()

func _test_comparison_scene() -> void:
	var scene := load("res://scenes/character_compare_g06.tscn") as PackedScene
	var valid := scene != null
	if valid:
		var demo := scene.instantiate()
		root.add_child(demo)
		await process_frame
		valid = demo.actors.size() == 3
		for actor in demo.actors:
			valid = valid and actor.has_node("Body")
		valid = valid and demo.equipment_rigs.size() == 2
		demo.direction_index = 2
		demo.action = "idle"
		demo._apply_action()
		valid = valid and demo.equipment_rigs[0].sword.animation == "sword_nw"
		valid = valid and demo.equipment_rigs[0].shield.animation == "shield_nw"
		demo.action = "attack"
		demo._apply_action()
		valid = valid and not demo.equipment_rigs[0].sword.visible and not demo.equipment_rigs[0].shield.visible
		demo.queue_free()
	_check(valid, "comparison scene loads all three rigs and equipment follows direction while baked actions hide overlays")

func _key(code: Key) -> InputEventKey:
	var event := InputEventKey.new()
	event.pressed = true
	event.keycode = code
	return event

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		failures += 1
		push_error("FAIL: " + message)
