extends RefCounted
class_name InspectionCatalogG13

const PATH := "res://resources/quests/inspection_points.json"
var _points_by_map: Dictionary = {}

func _init() -> void:
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		push_error("Inspection point registry is missing: " + PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Inspection point registry is invalid")
		return
	for point: Dictionary in parsed.get("points", []):
		var map_id := String(point.get("mapId", ""))
		if not _points_by_map.has(map_id):
			_points_by_map[map_id] = []
		_points_by_map[map_id].append(point.duplicate(true))

func points_for_map(map_id: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for point: Dictionary in _points_by_map.get(map_id, []):
		result.append(point.duplicate(true))
	return result

func validate(map_registry: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	for map_id: String in _points_by_map:
		if not map_registry.has(map_id):
			continue
		var map: Dictionary = map_registry.get(map_id, {})
		for point: Dictionary in _points_by_map[map_id]:
			var cell := Vector2i(int(point.x), int(point.y))
			if map.is_empty() or cell.x < 0 or cell.y < 0 or cell.x >= int(map.width) or cell.y >= int(map.height):
				errors.append("%s:out_of_bounds" % String(point.id))
				continue
			for blocked: Dictionary in map.get("blocked_cells", []):
				if int(blocked.x) == cell.x and int(blocked.y) == cell.y:
					errors.append("%s:blocked" % String(point.id))
			for spawn: Dictionary in map.get("spawns", {}).values():
				if int(spawn.x) == cell.x and int(spawn.y) == cell.y:
					errors.append("%s:spawn_overlap" % String(point.id))
			for exit_data: Dictionary in map.get("exits", []):
				if int(exit_data.x) == cell.x and int(exit_data.y) == cell.y:
					errors.append("%s:exit_overlap" % String(point.id))
	return errors
