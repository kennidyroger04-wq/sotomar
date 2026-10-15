extends SceneTree

const BoardScript = preload("res://scripts/combat_board_g10.gd")
const SceneryScript = preload("res://scripts/scenery_layer.gd")
const IDS := ["CRE_CASCUDO_DE_CAL", "CRE_PAPA_MEL", "CRE_TOPETAO", "CRE_FIANDEIRA", "CRE_SAPO_DE_POCA", "CRE_LERDO_DE_MUSGO", "CRE_FAREJADOR_DE_BREJO"]
const ACTIONS := ["idle", "walk", "attack", "hurt", "defeat"]
const DIRECTIONS := ["front", "left", "back", "right"]
const NPCS := ["npc_lia", "npc_nilo", "npc_bram"]
var checks := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	for id in IDS:
		var species: String = String(id).to_lower()
		var frames := load("res://resources/animations/%s_g18d.tres" % species) as SpriteFrames
		_check(frames != null, "%s SpriteFrames resource loads" % id)
		if frames == null:
			continue
		for action in ACTIONS:
			for direction in DIRECTIONS:
				var animation := "%s_%s" % [action, direction]
				_check(frames.has_animation(animation), "%s has %s" % [id, animation])
				_check(frames.get_frame_count(animation) == 4, "%s/%s has four frames" % [id, animation])
				_check(frames.get_animation_loop(animation) == (action in ["idle", "walk"]), "%s/%s loop flag matches action" % [id, animation])
				for index in 4:
					var atlas := frames.get_frame_texture(animation, index) as AtlasTexture
					_check(atlas != null and atlas.region.size == Vector2(192, 224), "%s/%s frame %d resolves 192x224 atlas region" % [id, animation, index])
	for npc in NPCS:
		var frames := load("res://resources/animations/%s_g18d.tres" % npc) as SpriteFrames
		_check_npc_frames(frames, npc)
	var board := BoardScript.new()
	root.add_child(board)
	var units: Array[Dictionary] = [{"id":"player", "side":"player", "x":1, "y":1, "hp":100, "max_hp":100, "pm":4}]
	for index in IDS.size():
		units.append({"id":"mob_%d" % index, "side":"mob", "canonical_id":IDS[index], "x":index+1, "y":3, "hp":50, "max_hp":50, "pm":3})
	units.append({"id":"mob_variant", "side":"mob", "canonical_id":"CRE_CASCUDO_DE_CAL_ENCHARCADO", "x":2, "y":4, "hp":50, "max_hp":50, "pm":3})
	board.configure({"height":8,"width":10,"blocked":[],"units":units}, load("res://resources/combat/wayfarer_combat_g05.tres"))
	board._process(0.0)
	for index in IDS.size():
		var sprite: AnimatedSprite2D = board.sprites.get("mob_%d" % index)
		_check(sprite != null and sprite.sprite_frames == load("res://resources/animations/%s_g18d.tres" % IDS[index].to_lower()), "%s is attached to the existing combat board" % IDS[index])
		_check(sprite != null and sprite.offset == Vector2(0, -214) and sprite.position == board.cell_to_local(Vector2i(index+1,3)), "%s keeps feet pivot and logical combat cell" % IDS[index])
		_check(sprite != null and sprite.z_index == index+5, "%s receives cell-based combat depth" % IDS[index])
	var variant: AnimatedSprite2D = board.sprites.get("mob_variant")
	_check(variant != null and variant.sprite_frames == load("res://resources/animations/cre_cascudo_de_cal_g18d.tres"), "temporary exposure variant resolves to the base species art")
	board.animate_unit_action("mob_3", "attack", "left")
	_check(board.sprites["mob_3"].animation == "attack_left", "combat controller can select a directional creature attack animation")
	var map_file := FileAccess.open("res://resources/maps/map_registry.json", FileAccess.READ)
	var registry: Dictionary = JSON.parse_string(map_file.get_as_text()) if map_file != null else {}
	var scenery := SceneryScript.new()
	root.add_child(scenery)
	scenery.configure(Vector2.ZERO, registry.get("maps", {}).get("MAP_01", {}))
	var npc_cells := {"exploradora_lia": Vector2i(6, 1), "curandeiro_nilo": Vector2i(6, 4), "mercador_bram": Vector2i(1, 6)}
	for npc_id in npc_cells:
		var marker: Node2D = scenery.get_node("NPC_" + npc_id)
		var sprite := marker.get_node_or_null("OriginalNPCSprite") as AnimatedSprite2D
		_check(sprite != null and sprite.animation == "idle_front", "%s has original idle sprite on the existing MAP_01 marker" % npc_id)
		_check(String(marker.get_meta("visual_status")) == "original_proposal_idle_walk", "%s visual is labelled as proposal rather than canon" % npc_id)
		_check(Vector2i(marker.get_meta("logical_cell")) == npc_cells[npc_id], "%s retains its authored MAP_01 logical cell" % npc_id)
	print("G18D SpriteFrames, combat and NPC integration checks: %d passed" % checks)
	quit()

func _check_npc_frames(frames: SpriteFrames, npc: String) -> void:
	_check(frames != null, "%s SpriteFrames resource loads" % npc)
	if frames == null:
		return
	for action in ["idle", "walk"]:
		for direction in DIRECTIONS:
			var animation: String = "%s_%s" % [action, direction]
			_check(frames.has_animation(animation) and frames.get_frame_count(animation) == 4, "%s/%s has four directional frames" % [npc, animation])

func _check(condition: bool, description: String) -> void:
	if not condition:
		push_error("FAIL: " + description)
		quit(1)
		return
	checks += 1
	print("PASS: " + description)
