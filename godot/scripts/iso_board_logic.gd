class_name IsoBoardLogic
extends RefCounted
## Regras de grade independentes da escala e dos recursos gráficos.

const DEFAULT_COLUMNS := 10
const DEFAULT_ROWS := 10
const DEFAULT_TILE_WIDTH := 64.0
const DEFAULT_TILE_HEIGHT := 32.0
const NEIGHBORS := [Vector2i.RIGHT, Vector2i.DOWN, Vector2i.LEFT, Vector2i.UP]

static func cell_to_screen(cell: Vector2i, origin: Vector2, tile_width: float = DEFAULT_TILE_WIDTH, tile_height: float = DEFAULT_TILE_HEIGHT) -> Vector2:
	return origin + Vector2((cell.x - cell.y) * tile_width * 0.5, (cell.x + cell.y) * tile_height * 0.5)

static func screen_to_cell(point: Vector2, origin: Vector2, columns: int = DEFAULT_COLUMNS, rows: int = DEFAULT_ROWS, tile_width: float = DEFAULT_TILE_WIDTH, tile_height: float = DEFAULT_TILE_HEIGHT) -> Vector2i:
	var local := point - origin
	var grid_x := local.x / tile_width + local.y / tile_height
	var grid_y := local.y / tile_height - local.x / tile_width
	return Vector2i(roundi(grid_x), roundi(grid_y))

static func contains_screen_point(point: Vector2, cell: Vector2i, origin: Vector2, tile_width: float = DEFAULT_TILE_WIDTH, tile_height: float = DEFAULT_TILE_HEIGHT) -> bool:
	var center := cell_to_screen(cell, origin, tile_width, tile_height)
	var local := point - center
	var u := local.x / tile_width + local.y / tile_height
	var v := local.y / tile_height - local.x / tile_width
	return absf(u) + absf(v) <= 1.0 + 0.0001

static func is_inside(cell: Vector2i, columns: int = DEFAULT_COLUMNS, rows: int = DEFAULT_ROWS) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < columns and cell.y < rows

static func find_path(start: Vector2i, goal: Vector2i, blocked: Array[Vector2i], columns: int = DEFAULT_COLUMNS, rows: int = DEFAULT_ROWS) -> Array[Vector2i]:
	if not is_inside(start, columns, rows) or not is_inside(goal, columns, rows) or blocked.has(goal):
		return []
	if start == goal:
		return []
	var frontier: Array[Vector2i] = [start]
	var came_from: Dictionary = {start: Vector2i(-1, -1)}
	var cursor := 0
	while cursor < frontier.size():
		var current: Vector2i = frontier[cursor]
		cursor += 1
		if current == goal:
			break
		for direction: Vector2i in NEIGHBORS:
			var next := current + direction
			if not is_inside(next, columns, rows) or blocked.has(next) or came_from.has(next):
				continue
			came_from[next] = current
			frontier.append(next)
	if not came_from.has(goal):
		return []
	var path: Array[Vector2i] = []
	var step := goal
	while step != start:
		path.push_front(step)
		step = came_from[step]
	return path
