extends Node2D

const Logic = preload("res://scripts/iso_board_logic.gd")
const PropPlaceholder = preload("res://scripts/prop_placeholder.gd")
const NpcMarker = preload("res://scripts/npc_marker.gd")
const MIRA_FRAMES := preload("res://resources/animations/mira_g18c.tres") as SpriteFrames
const NPC_FRAMES := {
	"exploradora_lia": preload("res://resources/animations/npc_lia_g18d.tres"),
	"curandeiro_nilo": preload("res://resources/animations/npc_nilo_g18d.tres"),
	"mercador_bram": preload("res://resources/animations/npc_bram_g18d.tres")
}
const TREE_TEXTURE := "res://assets/props/g03/tree_mosswood.png"
const ROCK_TEXTURE := "res://assets/props/g03/rock_moss_stone.png"
const COTTAGE_TEXTURE := "res://assets/props/g18c/caieira_lime_cottage.png"

var origin := Vector2.ZERO
var map_width := 10
var map_height := 10

func configure(map_origin: Vector2, map_data: Dictionary) -> void:
	origin = map_origin
	map_width = int(map_data.width)
	map_height = int(map_data.height)
	for child in get_children():
		remove_child(child)
		child.queue_free()
	for prop_data: Dictionary in map_data.props:
		_add_map_prop(prop_data)
	for npc_data: Dictionary in map_data.get("npcs", []):
		_add_npc(npc_data)


func _add_npc(data: Dictionary) -> void:
	var marker := NpcMarker.new()
	marker.name = "NPC_" + String(data.id)
	marker.npc_id = String(data.id)
	marker.display_name = String(data.name)
	marker.role = String(data.role)
	if marker.npc_id == "guarda_mira":
		marker.has_illustrated_sprite = true
		var sprite := AnimatedSprite2D.new()
		sprite.name = "MiraSprite"
		sprite.sprite_frames = MIRA_FRAMES
		sprite.animation = "idle_front"
		sprite.offset = Vector2(0, -175)
		sprite.scale = Vector2.ONE * 0.22
		sprite.play()
		marker.add_child(sprite)
	elif NPC_FRAMES.has(marker.npc_id):
		marker.has_illustrated_sprite = true
		var sprite := AnimatedSprite2D.new()
		sprite.name = "OriginalNPCSprite"
		sprite.sprite_frames = NPC_FRAMES[marker.npc_id]
		sprite.animation = "idle_front"
		sprite.offset = Vector2(0, -214)
		sprite.scale = Vector2.ONE * 0.36
		sprite.play()
		marker.add_child(sprite)
	var cell := Vector2i(int(data.x), int(data.y))
	marker.position = Logic.cell_to_screen(cell, origin)
	marker.z_index = cell.x + cell.y + 1
	marker.set_meta("logical_cell", cell)
	marker.set_meta("npc_id", marker.npc_id)
	marker.set_meta("visual_status", "original_proposal_idle_walk" if NPC_FRAMES.has(marker.npc_id) else "original_proposal_idle") if marker.has_illustrated_sprite else marker.set_meta("visual_status", "placeholder")
	add_child(marker)

func _add_map_prop(data: Dictionary) -> void:
	var prop := PropPlaceholder.new()
	prop.name = String(data.get("id", "WorldProp"))
	prop.kind = _kind_for_asset(String(data.get("assetId", "")))
	var cell := Vector2i(int(data.x), int(data.y))
	prop.position = Logic.cell_to_screen(cell, origin)
	prop.z_index = cell.x + cell.y + 1
	prop.set_meta("logical_cell", cell)
	prop.set_meta("asset_id", String(data.get("assetId", "")))
	prop.set_meta("blocking", bool(data.get("blocking", false)))
	if data.has("label"):
		prop.set_meta("source_label", String(data.label))
	_add_prop_sprite(prop, String(data.get("assetId", "")))
	add_child(prop)

func _add_prop_sprite(prop: Node2D, asset_id: String) -> void:
	var texture_path := ""
	if asset_id == "VIS_TREE_SMALL":
		texture_path = TREE_TEXTURE
	elif asset_id == "VIS_ROCKS_GRASS":
		texture_path = ROCK_TEXTURE
	elif asset_id == "VIS_HOUSE_SMALL":
		texture_path = COTTAGE_TEXTURE
	if texture_path.is_empty():
		return
	var texture := load(texture_path) as Texture2D
	if texture == null:
		push_error("Missing map prop texture: " + texture_path)
		return
	var sprite := Sprite2D.new()
	sprite.name = "IllustratedSprite"
	sprite.texture = texture
	sprite.centered = false
	var scale_value := 0.11 if asset_id == "VIS_HOUSE_SMALL" else 0.5
	sprite.position = Vector2(-texture.get_width() * scale_value * 0.5, -texture.get_height() * scale_value)
	sprite.scale = Vector2.ONE * scale_value
	prop.add_child(sprite)

func _kind_for_asset(asset_id: String) -> String:
	match asset_id:
		"VIS_TREE_SMALL": return "tree"
		"VIS_ROCKS_GRASS": return "rock"
		"VIS_HOUSE_SMALL": return "house"
		"VIS_MASONRY_STRUCTURE": return "masonry_placeholder"
		"VIS_LOW_WALL": return "wall_placeholder"
		_: return "bush_placeholder"

func update_origin(map_origin: Vector2) -> void:
	origin = map_origin
	for prop: Node2D in get_children():
		var cell: Vector2i = prop.get_meta("logical_cell")
		prop.position = Logic.cell_to_screen(cell, origin)
		prop.z_index = cell.x + cell.y + 1
