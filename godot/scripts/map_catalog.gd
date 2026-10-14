extends RefCounted
class_name MapCatalog

const REGISTRY_PATH := "res://resources/maps/map_registry.json"
static var _registry: Dictionary = {}

static func get_map(map_id: String) -> Dictionary:
	if _registry.is_empty():
		var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
		if file == null:
			push_error("Could not open map registry: " + REGISTRY_PATH)
			return {}
		var parsed: Variant = JSON.parse_string(file.get_as_text())
		if not parsed is Dictionary or not parsed.get("maps", {}) is Dictionary:
			push_error("Invalid map registry JSON")
			return {}
		_registry = parsed.maps
	return (_registry.get(map_id, {}) as Dictionary).duplicate(true)

static func tile_source_for_asset(asset_id: String) -> int:
	match asset_id:
		"VIS_GRASS_BASE": return 0
		"VIS_DIRT_BASE": return 1
		"VIS_DIRT_PATH": return 2
		"VIS_WATER": return 4
		"VIS_WATER_EDGE": return 20
		"VIS_TREE_SMALL", "VIS_ROCKS_GRASS", "VIS_HOUSE_SMALL", "VIS_MASONRY_STRUCTURE", "VIS_LOW_WALL": return -1
		_: return 6
