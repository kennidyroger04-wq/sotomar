extends Node2D

var kind := "tree"

func _draw() -> void:
	if kind.ends_with("_placeholder"):
		_draw_placeholder()
	elif kind == "house":
		return
	elif kind == "tree":
		_draw_shadow(Vector2(0, -5), Vector2(22, 7))
	elif kind == "rock":
		_draw_shadow(Vector2(0, -3), Vector2(16, 5))
	else:
		_draw_bush()

func _draw_placeholder() -> void:
	match kind:
		"house_placeholder":
			_draw_shadow(Vector2(0, -4), Vector2(32, 9))
			draw_colored_polygon(PackedVector2Array([Vector2(-22, -4), Vector2(-22, -27), Vector2(0, -41), Vector2(22, -27), Vector2(22, -4)]), Color("cfb27e"))
			draw_colored_polygon(PackedVector2Array([Vector2(-27, -27), Vector2(0, -47), Vector2(27, -27), Vector2(21, -24), Vector2(0, -39), Vector2(-21, -24)]), Color("9e5b42"))
			draw_polyline(PackedVector2Array([Vector2(-27, -27), Vector2(0, -47), Vector2(27, -27)]), Color("533d36"), 2.0, true)
			draw_rect(Rect2(Vector2(-4, -19), Vector2(8, 15)), Color("624b3d"))
		"wall_placeholder":
			_draw_shadow(Vector2(0, -2), Vector2(25, 6))
			draw_colored_polygon(PackedVector2Array([Vector2(-23, -3), Vector2(-23, -15), Vector2(0, -23), Vector2(23, -15), Vector2(23, -3), Vector2(0, 5)]), Color("aaa18a"))
			draw_line(Vector2(-14, -7), Vector2(0, -12), Color("d0c7ad"), 2.0, true)
		"masonry_placeholder":
			_draw_shadow(Vector2(0, -3), Vector2(24, 7))
			draw_colored_polygon(PackedVector2Array([Vector2(-20, -3), Vector2(-20, -24), Vector2(0, -34), Vector2(20, -24), Vector2(20, -3), Vector2(0, 5)]), Color("887c6e"))
			draw_line(Vector2(-13, -18), Vector2(3, -25), Color("b7a995"), 2.0, true)
			for brick_y in [-14.0, -7.0]:
				draw_line(Vector2(-14, brick_y), Vector2(13, brick_y - 6), Color("665d55"), 1.0, true)

func _draw_tree() -> void:
	_draw_shadow(Vector2(0, -5), Vector2(12, 4))
	draw_rect(Rect2(Vector2(-3, -36), Vector2(6, 27)), Color("76533c"))
	draw_circle(Vector2(0, -43), 14, Color("316c49"))
	draw_circle(Vector2(-9, -38), 9, Color("438257"))
	draw_circle(Vector2(8, -36), 9, Color("3c794f"))
	draw_circle(Vector2(-4, -48), 3, Color("79a566"))

func _draw_rock() -> void:
	_draw_shadow(Vector2(0, -3), Vector2(13, 4))
	draw_colored_polygon(PackedVector2Array([Vector2(-13, -5), Vector2(-8, -15), Vector2(1, -19), Vector2(12, -12), Vector2(14, -4), Vector2(7, 1), Vector2(-8, 1)]), Color("83877d"))
	draw_line(Vector2(-6, -12), Vector2(0, -16), Color("bdc0ae"), 2.0)

func _draw_bush() -> void:
	draw_circle(Vector2(-5, -5), 7, Color("3d764e"))
	draw_circle(Vector2(4, -7), 8, Color("4b8856"))
	draw_circle(Vector2(10, -3), 5, Color("386d49"))

func _draw_shadow(center: Vector2, radii: Vector2) -> void:
	var points := PackedVector2Array()
	for index in 20:
		var angle := TAU * float(index) / 20.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, Color(0.12, 0.17, 0.14, 0.35))
