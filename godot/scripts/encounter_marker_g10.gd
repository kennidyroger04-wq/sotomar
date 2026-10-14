extends Node2D

var encounter_id := "ENC_01"
var creature_name := "Cascudo-de-cal"

func _ready() -> void:
	set_meta("encounter_id", encounter_id)
	set_meta("logical_cell", Vector2i(6, 4))
	set_meta("visual_status", "provisional_marker")

func _draw() -> void:
	draw_arc(Vector2(0, -9), 20, 0, TAU, 32, Color("f3c76a"), 3.0, true)
	draw_colored_polygon(PackedVector2Array([Vector2(0,-23),Vector2(13,-9),Vector2(0,5),Vector2(-13,-9)]), Color("a74f38"))
	draw_polyline(PackedVector2Array([Vector2(0,-23),Vector2(13,-9),Vector2(0,5),Vector2(-13,-9),Vector2(0,-23)]), Color("ffe7a8"), 2.0, true)
	draw_string(ThemeDB.fallback_font, Vector2(-58, -33), "ENC_01", HORIZONTAL_ALIGNMENT_CENTER, 116, 13, Color("fff2bd"))
