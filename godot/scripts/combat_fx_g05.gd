extends Node2D

var effect_id := ""
var elapsed := 0.0
var duration := 0.42
var _font: Font

func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_process(false)

func trigger(id: String) -> void:
	effect_id = id
	elapsed = 0.0
	duration = 0.72 if id == "defeat_marker" else 0.42
	visible = true
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed >= duration:
		visible = false
		set_process(false)
	queue_redraw()

func _draw() -> void:
	if effect_id.is_empty() or elapsed >= duration:
		return
	var progress := clampf(elapsed / duration, 0.0, 1.0)
	var fade := 1.0 - progress
	match effect_id:
		"physical_slash":
			draw_arc(Vector2.ZERO, 34.0 + progress * 9.0, -2.4, 0.7, 22, Color(1.0, 0.84, 0.34, fade), 5.0 * fade + 1.0, true)
			draw_arc(Vector2.ZERO, 27.0 + progress * 8.0, -2.1, 0.45, 18, Color(1.0, 0.98, 0.72, fade), 2.0, true)
		"impact":
			for index in 8:
				var angle := TAU * float(index) / 8.0
				var direction := Vector2.RIGHT.rotated(angle)
				draw_line(direction * (8.0 + progress * 9.0), direction * (22.0 + progress * 14.0), Color(1.0, 0.78, 0.32, fade), 3.0 * fade + 0.5, true)
			draw_circle(Vector2.ZERO, 7.0 * fade + 1.0, Color(1.0, 0.97, 0.73, fade))
		"shield_block":
			draw_arc(Vector2.ZERO, 24.0 + progress * 10.0, -2.7, 2.7, 24, Color(0.44, 0.85, 1.0, fade), 4.0 * fade + 1.0, true)
			draw_colored_polygon(PackedVector2Array([Vector2(0,-20),Vector2(14,-13),Vector2(12,10),Vector2(0,19),Vector2(-12,10),Vector2(-14,-13)]), Color(0.32,0.72,0.91,0.24*fade))
		"spell_release":
			draw_arc(Vector2.ZERO, 13.0 + progress * 30.0, 0.0, TAU, 32, Color(0.42,0.91,1.0,fade), 4.0*fade+1.0, true)
			for index in 6:
				var angle := TAU * float(index) / 6.0
				var direction := Vector2.RIGHT.rotated(angle)
				draw_line(direction * 7.0, direction * (17.0 + progress * 24.0), Color(0.75,0.98,1.0,fade), 2.5*fade+0.5, true)
		"damage_flash":
			draw_circle(Vector2.ZERO, 22.0 + progress * 24.0, Color(1.0, 0.19, 0.16, 0.28 * fade))
			draw_arc(Vector2.ZERO, 20.0 + progress * 22.0, 0.0, TAU, 24, Color(1.0, 0.42, 0.31, fade), 3.0 * fade + 0.5, true)
		"defeat_marker":
			var star := PackedVector2Array()
			for index in 10:
				var angle := -PI * 0.5 + TAU * float(index) / 10.0
				var radius := 20.0 if index % 2 == 0 else 10.0
				star.append(Vector2(cos(angle), sin(angle)) * radius)
			draw_colored_polygon(star, Color(0.95,0.30,0.18,0.85*fade))
			draw_string(_font, Vector2(-14.0, 6.0), "KO", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.WHITE * fade)
