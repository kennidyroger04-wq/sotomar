extends SceneTree

const SPECIES := [
	"cre_cascudo_de_cal", "cre_papa_mel", "cre_topetao", "cre_fiandeira",
	"cre_sapo_de_poca", "cre_lerdo_de_musgo", "cre_farejador_de_brejo"
]
const NPCS := ["npc_lia", "npc_nilo", "npc_bram"]
const DIRECTIONS := ["front", "left", "back", "right"]
const ACTIONS := ["idle", "walk", "attack", "hurt", "defeat"]
const FRAME_SIZE := Vector2i(192, 224)

func _initialize() -> void:
	for species in SPECIES + NPCS:
		var actions := ACTIONS
		if NPCS.has(species):
			var spec_file := FileAccess.open("res://art/source/sprite_factory/specs/%s.json" % species, FileAccess.READ)
			var spec_data: Dictionary = JSON.parse_string(spec_file.get_as_text()) if spec_file != null else {}
			actions = spec_data.get("actions", ["idle", "walk"])
		var frames := SpriteFrames.new()
		frames.remove_animation("default")
		for action in actions:
			var animation_root := "%s_" % action
			for direction_index in DIRECTIONS.size():
				var animation: String = animation_root + DIRECTIONS[direction_index]
				frames.add_animation(animation)
				frames.set_animation_speed(animation, _fps(action))
				frames.set_animation_loop(animation, action in ["idle", "walk"])
				var atlas_path := "res://assets/characters/%s_g18d/%s_%s.png" % [species, species, action]
				var atlas := load(atlas_path) as Texture2D
				if atlas == null:
					push_error("Missing sprite factory atlas: " + atlas_path)
					continue
				for frame_index in 4:
					var texture := AtlasTexture.new()
					texture.atlas = atlas
					texture.region = Rect2(direction_index * FRAME_SIZE.x, frame_index * FRAME_SIZE.y, FRAME_SIZE.x, FRAME_SIZE.y)
					frames.add_frame(animation, texture)
		var out_path := "res://resources/animations/%s_g18d.tres" % species
		var error := ResourceSaver.save(frames, out_path)
		if error != OK:
			push_error("Unable to save SpriteFrames %s: %s" % [species, error_string(error)])
	print("G18D SpriteFrames built for %d creatures and %d NPCs." % [SPECIES.size(), NPCS.size()])
	quit()

func _fps(action: String) -> float:
	match action:
		"idle": return 4.0
		"walk": return 8.0
		"defeat": return 5.0
		_: return 8.0
