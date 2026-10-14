extends Node2D

const Logic = preload("res://scripts/iso_board_logic.gd")
const TILE_WIDTH := 64.0
const TILE_HEIGHT := 32.0

var columns := 10
var rows := 10
var origin := Vector2.ZERO
var selected_cell := Vector2i(-1, -1)
var blocked_cells: Array[Vector2i] = []
var path_cells: Array[Vector2i] = []
var portal_cells: Array[Vector2i] = []

func configure_map(width: int, height: int, blocked: Array[Vector2i], paths: Array[Vector2i], portals: Array[Vector2i]) -> void:
	columns = width
	rows = height
	blocked_cells = blocked.duplicate()
	path_cells = paths.duplicate()
	portal_cells = portals.duplicate()
	selected_cell = Vector2i(-1, -1)
	queue_redraw()

func _draw() -> void:
	for y in rows:
		for x in columns:
			var cell := Vector2i(x, y)
			var center := Logic.cell_to_screen(cell, origin, TILE_WIDTH, TILE_HEIGHT)
			var polygon := _diamond(center)
			draw_polyline(_closed(polygon), Color("243f38", 0.58), 1.0, true)
			if blocked_cells.has(cell):
				draw_line(center + Vector2(-7, -4), center + Vector2(7, 4), Color("f1b57b"), 2.0, true)
				draw_line(center + Vector2(7, -4), center + Vector2(-7, 4), Color("f1b57b"), 2.0, true)
			if portal_cells.has(cell):
				draw_arc(center + Vector2(0, -2), 9.0, 0.0, TAU, 24, Color("70e6d2"), 2.0, true)
	if Logic.is_inside(selected_cell, columns, rows):
		var selected_center := Logic.cell_to_screen(selected_cell, origin, TILE_WIDTH, TILE_HEIGHT)
		draw_colored_polygon(_diamond(selected_center), Color("f6db70", 0.23))
		draw_polyline(_closed(_diamond(selected_center)), Color("fff0a3"), 3.0, true)

func _diamond(center: Vector2) -> PackedVector2Array:
	return PackedVector2Array([
		center + Vector2(0, -TILE_HEIGHT * 0.5),
		center + Vector2(TILE_WIDTH * 0.5, 0),
		center + Vector2(0, TILE_HEIGHT * 0.5),
		center + Vector2(-TILE_WIDTH * 0.5, 0),
	])

func _closed(points: PackedVector2Array) -> PackedVector2Array:
	var result := points.duplicate()
	result.append(points[0])
	return result
