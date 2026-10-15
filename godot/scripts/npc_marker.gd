extends Node2D

var npc_id := ""
var display_name := ""
var role := "GENERIC"
var can_interact := false
var has_illustrated_sprite := false

func _draw() -> void:
	var role_color := Color("e8bd62")
	match role:
		"QUEST": role_color = Color("74c8ad")
		"HEALER": role_color = Color("8ec3e0")
		"MERCHANT": role_color = Color("d4a0d9")
	if not has_illustrated_sprite:
		draw_circle(Vector2(0, -20), 11, Color("26353a"))
		draw_circle(Vector2(0, -20), 8, role_color)
		draw_colored_polygon(PackedVector2Array([Vector2(-8, -10), Vector2(-12, 2), Vector2(12, 2), Vector2(8, -10)]), role_color.darkened(0.25))
		draw_line(Vector2(-12, 2), Vector2(12, 2), Color("26353a"), 2.0, true)
	if can_interact:
		var indicator_y := -96.0 if has_illustrated_sprite else -64.0
		draw_circle(Vector2(0, indicator_y), 10, Color("fff0b0"))
		draw_circle(Vector2(0, indicator_y), 7, Color("38584a"))
		draw_string(ThemeDB.fallback_font, Vector2(-3, indicator_y + 4), "!", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("fff8dc"))
	var font := ThemeDB.fallback_font
	if font != null and not has_illustrated_sprite:
		var initials := _initials(display_name)
		draw_string(font, Vector2(-font.get_string_size(initials, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x * 0.5, -48), initials, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color("f7efda"))

func _initials(value: String) -> String:
	var parts := value.replace(",", "").split(" ", false)
	if parts.size() >= 2:
		return String(parts[0]).substr(0, 1) + String(parts[1]).substr(0, 1)
	return value.substr(0, 2)
