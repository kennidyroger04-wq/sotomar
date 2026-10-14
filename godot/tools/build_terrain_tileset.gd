extends SceneTree

# Source IDs 0-5 remain the stable terrain adapter contract. The first six
# textures are now G03/G04 illustration assets instead of G02 technical tiles.
const TILE_FILES := [
	"res://assets/tiles/terrain/g03/grass_meadow.png", # 0 grass
	"res://assets/tiles/terrain/g03/dirt_ochre.png", # 1 earth
	"res://assets/tiles/terrain/g03/path_center.png", # 2 path
	"res://assets/tiles/terrain/g03/stone_moss.png", # 3 stone
	"res://assets/tiles/terrain/g03/water_clear.png", # 4 water
	"res://assets/tiles/terrain/g03/grass_clover.png", # 5 grass variation
	"res://assets/tiles/terrain/g03/grass_fern.png",
	"res://assets/tiles/terrain/g03/dirt_dappled.png",
	"res://assets/tiles/terrain/g03/stone_lichen.png",
	"res://assets/tiles/terrain/g03/water_ripple.png",
	"res://assets/tiles/terrain/g03/water_lily.png",
	"res://assets/tiles/terrain/g03/path_straight_ne_sw.png",
	"res://assets/tiles/terrain/g03/path_straight_nw_se.png",
	"res://assets/tiles/terrain/g03/path_bend.png",
	"res://assets/tiles/terrain/g03/path_cross.png",
	"res://assets/tiles/terrain/g03/transition_grass_earth_edge_north.png",
	"res://assets/tiles/terrain/g03/transition_grass_earth_edge_east.png",
	"res://assets/tiles/terrain/g03/transition_grass_earth_edge_south.png",
	"res://assets/tiles/terrain/g03/transition_grass_earth_edge_west.png",
	"res://assets/tiles/terrain/g03/transition_grass_earth_diagonal.png",
	"res://assets/tiles/terrain/g03/transition_grass_water_stones_a.png",
	"res://assets/tiles/terrain/g03/transition_grass_water_stones_b.png",
	"res://assets/tiles/terrain/g03/transition_earth_cliff_edge.png",
]

func _initialize() -> void:
	var tile_set := TileSet.new()
	tile_set.tile_size = Vector2i(128, 64)
	tile_set.tile_shape = TileSet.TILE_SHAPE_ISOMETRIC
	tile_set.tile_layout = TileSet.TILE_LAYOUT_DIAMOND_DOWN
	tile_set.tile_offset_axis = TileSet.TILE_OFFSET_AXIS_VERTICAL
	for source_id in TILE_FILES.size():
		var texture := load(TILE_FILES[source_id]) as Texture2D
		if texture == null or texture.get_width() != 128 or texture.get_height() != 80:
			push_error("Missing or invalid tile texture: " + TILE_FILES[source_id])
			quit(1)
			return
		var source := TileSetAtlasSource.new()
		source.texture = texture
		source.texture_region_size = Vector2i(128, 80)
		source.create_tile(Vector2i.ZERO)
		source.get_tile_data(Vector2i.ZERO, 0).texture_origin = Vector2i(0, -8)
		tile_set.add_source(source, source_id)
	var result := ResourceSaver.save(tile_set, "res://resources/tilesets/fimbria_ground.tres")
	if result != OK:
		push_error("Could not save TileSet resource: %s" % error_string(result))
		quit(1)
		return
	print("Created isometric G03/G04 TileSet with %d source IDs (0-5 stable)" % TILE_FILES.size())
	quit(0)
