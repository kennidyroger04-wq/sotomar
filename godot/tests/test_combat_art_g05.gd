extends SceneTree

const ACTIONS_WAY := ["idle", "walk", "attack", "hurt", "defend", "cast", "death"]
const ACTIONS_ENEMY := ["idle", "walk", "attack", "hurt", "death"]
const DIRS := ["se", "sw", "nw", "ne"]
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_spriteframes()
	_test_sources_and_metadata()
	await _test_scene_rig_and_layers()
	if failures == 0:
		print("PASS: G05 combat art checks")
		quit(0)
	else:
		push_error("%d G05 combat art check(s) failed" % failures)
		quit(1)

func _test_spriteframes() -> void:
	var way := load("res://resources/combat/wayfarer_combat_g05.tres") as SpriteFrames
	var enemy := load("res://resources/combat/moss_raider_combat_g05.tres") as SpriteFrames
	var gear := load("res://resources/combat/wayfarer_equipment_g05.tres") as SpriteFrames
	var valid := way != null and enemy != null and gear != null
	if valid:
		valid = way.get_animation_names().size() == 28 and enemy.get_animation_names().size() == 20 and gear.get_animation_names().size() == 8
		valid = valid and way.get_animation_speed("idle_se") == 4.0 and way.get_animation_speed("walk_se") == 8.0
		valid = valid and way.get_animation_speed("attack_se") == 6.0 and not way.get_animation_loop("attack_se") and not way.get_animation_loop("death_se")
		valid = valid and enemy.get_animation_speed("idle_se") == 4.0 and enemy.get_animation_speed("walk_se") == 8.0
		valid = valid and enemy.get_animation_speed("death_ne") == 4.0 and not enemy.get_animation_loop("death_ne")
		valid = valid and way.get_animation_speed("hurt_sw") == 6.0 and way.get_animation_speed("defend_nw") == 5.0 and way.get_animation_speed("cast_ne") == 6.0
		valid = valid and enemy.get_animation_speed("attack_sw") == 6.0 and enemy.get_animation_speed("hurt_nw") == 6.0
		for action in ACTIONS_WAY:
			for direction in DIRS:
				var name := "%s_%s" % [action, direction]
				valid = valid and way.has_animation(name) and way.get_frame_count(name) == 4
		for action in ACTIONS_ENEMY:
			for direction in DIRS:
				var name := "%s_%s" % [action, direction]
				valid = valid and enemy.has_animation(name) and enemy.get_frame_count(name) == 4
		for slot in ["sword", "shield"]:
			for direction in DIRS:
				var name := "%s_%s" % [slot, direction]
				valid = valid and gear.has_animation(name) and gear.get_frame_count(name) == 1
	_check(valid, "28 Wayfarer, 20 Raider, and eight directional equipment SpriteFrames animations load with expected frame counts")

func _test_sources_and_metadata() -> void:
	var metadata := JSON.parse_string(FileAccess.get_file_as_string("res://resources/combat/combat_art_g05.json")) as Dictionary
	var valid := not metadata.is_empty()
	if valid:
		valid = metadata.get("impact_events", {}).size() == 8
		valid = valid and metadata.get("impact_events", {}).get("wayfarer_attack", {}).get("frame") == 2
		valid = valid and metadata.get("impact_events", {}).get("moss_raider_attack", {}).get("event") == "impact"
		valid = valid and metadata.get("effect_ids", []).size() == 6
		for path in ["res://assets/characters/wayfarer_g05/wayfarer_attack.png", "res://assets/characters/wayfarer_g05/wayfarer_hurt.png", "res://assets/characters/wayfarer_g05/wayfarer_defend.png", "res://assets/characters/wayfarer_g05/wayfarer_cast.png", "res://assets/characters/wayfarer_g05/wayfarer_death.png", "res://assets/characters/moss_raider_g05/moss_raider_idle.png", "res://assets/characters/moss_raider_g05/moss_raider_walk.png", "res://assets/characters/moss_raider_g05/moss_raider_attack.png", "res://assets/characters/moss_raider_g05/moss_raider_hurt.png", "res://assets/characters/moss_raider_g05/moss_raider_death.png", "res://assets/equipment/g05/wayfarer_sword_idle.png", "res://assets/equipment/g05/wayfarer_shield_idle.png"]:
			valid = valid and FileAccess.file_exists(path)
			var image := Image.load_from_file(ProjectSettings.globalize_path(path))
			valid = valid and image != null and image.detect_alpha()
	_check(valid, "action atlases, equipment PNGs, impact events and all six effect IDs resolve")
	var fx_script := load("res://scripts/combat_fx_g05.gd")
	_check(fx_script != null, "native combat effect renderer script loads")

func _test_scene_rig_and_layers() -> void:
	var packed := load("res://scenes/combat_art_demo.tscn") as PackedScene
	if packed == null:
		_check(false, "combat art demo scene loads")
		return
	var demo := packed.instantiate()
	root.add_child(demo)
	await process_frame
	var valid: bool = demo.demo_ready and demo.rigs.size() == 2 and demo.fx != null
	var way: Node2D = demo.rigs[0]
	var enemy: Node2D = demo.rigs[1]
	var way_cell: Vector2i = way.get_meta("logical_cell")
	var way_position: Vector2 = way.position
	valid = valid and way.has_node("Body") and way.has_node("SwordLayer") and way.has_node("ShieldLayer")
	valid = valid and enemy.has_node("Body") and not enemy.has_node("SwordLayer")
	valid = valid and way.z_index == 9 and enemy.z_index == 11 and demo.fx.z_index == 20
	valid = valid and (way.get_node("SwordLayer") as AnimatedSprite2D).offset != (way.get_node("ShieldLayer") as AnimatedSprite2D).offset
	demo._toggle_equipment()
	valid = valid and way.position == way_position and way.get_meta("logical_cell") == way_cell
	demo.direction_index = 2
	demo._apply_action("attack")
	valid = valid and way.position == way_position and way.get_meta("logical_cell") == way_cell
	valid = valid and way.get_node("Body").animation == "attack_nw"
	valid = valid and not way.get_node("SwordLayer").visible and not way.get_node("ShieldLayer").visible
	(way.get_node("Body") as AnimatedSprite2D).frame = 2
	demo._on_frame_changed(way)
	valid = valid and demo.fx.effect_id == "impact"
	demo._apply_action("idle")
	valid = valid and way.get_node("Body").animation == "idle_nw"
	valid = valid and way.get_node("SwordLayer").visible and way.get_node("ShieldLayer").visible
	for effect in ["physical_slash", "impact", "shield_block", "damage_flash", "defeat_marker", "spell_release"]:
		demo.fx.trigger(effect)
		valid = valid and demo.fx.effect_id == effect
	_check(valid, "isolated scene builds two rigs, equipment stays attached without moving logical position, action sync and six effects work")
	demo.queue_free()

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		failures += 1
		push_error("FAIL: " + message)
