extends Node2D

var inspected := false
var can_interact := false

func _draw() -> void:
	var color := Color("78c5a1") if inspected else Color("f3c66d")
	if can_interact:
		color = Color("fff0b0")
	draw_circle(Vector2(0, -12), 11, Color("18231f", 0.92))
	draw_circle(Vector2(0, -12), 8, color)
	draw_arc(Vector2(0, -12), 4.5, 0.0, TAU, 16, Color("18231f"), 2.0, true)
	draw_line(Vector2(3, -9), Vector2(7, -5), Color("18231f"), 2.0, true)
