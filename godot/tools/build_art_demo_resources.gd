extends SceneTree

const TILE_PATHS := [
	"res://assets/tiles/terrain/g03/grass_meadow.png",
	"res://assets/tiles/terrain/g03/grass_clover.png",
	"res://assets/tiles/terrain/g03/grass_fern.png",
	"res://assets/tiles/terrain/g03/dirt_ochre.png",
	"res://assets/tiles/terrain/g03/dirt_dappled.png",
	"res://assets/tiles/terrain/g03/stone_moss.png",
	"res://assets/tiles/terrain/g03/stone_lichen.png",
	"res://assets/tiles/terrain/g03/water_clear.png",
	"res://assets/tiles/terrain/g03/water_ripple.png",
	"res://assets/tiles/terrain/g03/water_lily.png",
	"res://assets/tiles/terrain/g03/path_center.png",
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
const DIRECTIONS := ["se", "sw", "nw", "ne"]

func _initialize() -> void:
	_build_tileset()
	_build_character_frames()
	quit(0)

func _build_tileset() -> void:
	var tile_set := TileSet.new()
	tile_set.tile_size = Vector2i(128, 64)
	tile_set.tile_shape = TileSet.TILE_SHAPE_ISOMETRIC
	tile_set.tile_layout = TileSet.TILE_LAYOUT_DIAMOND_DOWN
	tile_set.tile_offset_axis = TileSet.TILE_OFFSET_AXIS_VERTICAL
	for source_id in TILE_PATHS.size():
		var texture := load(TILE_PATHS[source_id]) as Texture2D
		if texture == null or texture.get_width() != 128 or texture.get_height() != 80:
			push_error("Missing/invalid G03 tile: " + TILE_PATHS[source_id])
			quit(1)
			return
		var atlas := TileSetAtlasSource.new()
		atlas.texture = texture
		atlas.texture_region_size = Vector2i(128, 80)
		atlas.create_tile(Vector2i.ZERO)
		atlas.get_tile_data(Vector2i.ZERO, 0).texture_origin = Vector2i(0, -8)
		tile_set.add_source(atlas, source_id)
	var error := ResourceSaver.save(tile_set, "res://resources/tilesets/fimbria_art_demo.tres")
	if error != OK:
		push_error("Could not save G03 TileSet: %s" % error)

func _build_character_frames() -> void:
	var texture := load("res://assets/characters/wayfarer_v1/wayfarer_v1.png") as Texture2D
	if texture == null or texture.get_width() != 1024 or texture.get_height() != 640:
		push_error("Invalid character spritesheet.")
		quit(1)
		return
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for row in DIRECTIONS.size():
		for group in ["idle", "walk"]:
			var animation_name := "%s_%s" % [group, DIRECTIONS[row]]
			frames.add_animation(animation_name)
			frames.set_animation_loop(animation_name, true)
			frames.set_animation_speed(animation_name, 4.0 if group == "idle" else 8.0)
			var first_column := 0 if group == "idle" else 4
			for frame_index in 4:
				var atlas := AtlasTexture.new()
				atlas.atlas = texture
				atlas.region = Rect2((first_column + frame_index) * 128, row * 160, 128, 160)
				frames.add_frame(animation_name, atlas)
	var error := ResourceSaver.save(frames, "res://resources/animations/wayfarer_v1.tres")
	if error != OK:
		push_error("Could not save character SpriteFrames: %s" % error)
