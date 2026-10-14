extends Node2D

const Logic = preload("res://scripts/iso_board_logic.gd")
const MATERIAL_GRASS := [0, 1, 2]

@onready var terrain: TileMapLayer = $TerrainTiles
@onready var paths: TileMapLayer = $PathTiles
@onready var transitions: TileMapLayer = $TransitionTiles
@onready var decorations: Node2D = $Decorations
@onready var actor: AnimatedSprite2D = $Actors/Wayfarer
@onready var legend: Label = $HUD/Legend

var map_origin := Vector2.ZERO

func _ready() -> void:
	map_origin = _centered_origin()
	_configure_layers()
	_populate_demo()
	_configure_props()
	actor.position = Logic.cell_to_screen(Vector2i(4, 4), map_origin)
	actor.z_index = 8
	actor.scale = Vector2(0.5, 0.5)
	actor.offset = Vector2(0, -72) # frame pivot (64,152) relative to centered SpriteFrames.
	actor.animation = "walk_se"
	actor.play()
	_update_legend()
	get_viewport().size_changed.connect(_on_viewport_size_changed)

func _centered_origin() -> Vector2:
	var viewport_size := get_viewport_rect().size
	return viewport_size * 0.5 - Vector2(0, 144)

func _configure_layers() -> void:
	for layer: TileMapLayer in [terrain, paths, transitions]:
		layer.scale = Vector2(0.5, 0.5)
		layer.position = map_origin - layer.map_to_local(Vector2i.ZERO) * layer.scale
	terrain.z_index = -20
	paths.z_index = -18
	transitions.z_index = -17

func _populate_demo() -> void:
	for y in 10:
		for x in 10:
			var cell := Vector2i(x, y)
			var source_id: int = int(MATERIAL_GRASS[(x + y) % MATERIAL_GRASS.size()])
			if x >= 1 and x <= 3 and y >= 6 and y <= 8:
				source_id = 3 if (x + y) % 2 == 0 else 4
			elif x >= 6 and x <= 8 and y >= 1 and y <= 3:
				source_id = 5 if (x + y) % 2 == 0 else 6
			elif x >= 7 and y >= 6:
				source_id = 7 + ((x + y) % 3)
			terrain.set_cell(cell, source_id, Vector2i.ZERO)
	# Five connected path pieces, each mapped to its logical tile.
	paths.set_cell(Vector2i(2, 2), 10, Vector2i.ZERO)
	paths.set_cell(Vector2i(3, 2), 11, Vector2i.ZERO)
	paths.set_cell(Vector2i(4, 2), 11, Vector2i.ZERO)
	paths.set_cell(Vector2i(5, 2), 13, Vector2i.ZERO)
	paths.set_cell(Vector2i(5, 3), 14, Vector2i.ZERO)
	paths.set_cell(Vector2i(5, 4), 12, Vector2i.ZERO)
	# Full-tile transition overlays, deliberately kept in their own layer.
	transitions.set_cell(Vector2i(0, 7), 18, Vector2i.ZERO)
	transitions.set_cell(Vector2i(4, 7), 16, Vector2i.ZERO)
	transitions.set_cell(Vector2i(6, 7), 20, Vector2i.ZERO)
	transitions.set_cell(Vector2i(7, 5), 21, Vector2i.ZERO)
	transitions.set_cell(Vector2i(5, 7), 22, Vector2i.ZERO)

func _configure_props() -> void:
	_add_prop("Tree", "res://assets/props/g03/tree_mosswood.png", Vector2i(2, 4))
	_add_prop("Rock", "res://assets/props/g03/rock_moss_stone.png", Vector2i(7, 4))

func _add_prop(prop_name: String, texture_path: String, cell: Vector2i) -> void:
	var sprite := Sprite2D.new()
	sprite.name = prop_name
	sprite.texture = load(texture_path) as Texture2D
	sprite.centered = false
	sprite.offset = Vector2(-128, -280) # metadata pivot at asset base (128,280).
	sprite.scale = Vector2(0.5, 0.5)
	sprite.position = Logic.cell_to_screen(cell, map_origin)
	sprite.z_index = cell.x + cell.y
	sprite.set_meta("logical_cell", cell)
	decorations.add_child(sprite)

func _on_viewport_size_changed() -> void:
	map_origin = _centered_origin()
	for layer: TileMapLayer in [terrain, paths, transitions]:
		layer.position = map_origin - layer.map_to_local(Vector2i.ZERO) * layer.scale
	for sprite: Sprite2D in decorations.get_children():
		var cell: Vector2i = sprite.get_meta("logical_cell")
		sprite.position = Logic.cell_to_screen(cell, map_origin)
	actor.position = Logic.cell_to_screen(Vector2i(4, 4), map_origin)
	_update_legend()

func _update_legend() -> void:
	var viewport_size := get_viewport_rect().size
	legend.text = "FÍMBRIA · PACOTE ARTÍSTICO G03\nViewport %d×%d · célula 64×32 · wayfarer: walk SE (8 fps)" % [int(viewport_size.x), int(viewport_size.y)]
