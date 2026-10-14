extends Control

const IDS := ["character.warrior_male.g06", "character.wayfarer.g05"]
const MALE_TITLE := "Guerreiro masculino"
const FEMALE_TITLE := "Guerreira feminina"

var selected_index := 0
var cards: Array[PanelContainer] = []
var previews: Array[TextureRect] = []
var preview_resources: Array[SpriteFrames] = []
var status_label: Label
var orientation_label: Label
var enter_button: Button
var content: VBoxContainer
var character_row: GridContainer
var footer: HBoxContainer
var choose_buttons: Array[Button] = []
var _ui_scale := 1.0
var preview_elapsed := 0.0
var preview_frame := 0

func _ready() -> void:
	selected_index = maxi(0, IDS.find(CharacterRoster.selected_id))
	_build_screen()
	_refresh_selection()
	get_viewport().size_changed.connect(_layout_screen)
	call_deferred("_layout_screen")

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	match event.keycode:
		KEY_LEFT, KEY_A:
			select_index(0)
			_mark_input_handled()
		KEY_RIGHT, KEY_D:
			select_index(1)
			_mark_input_handled()
		KEY_ENTER, KEY_KP_ENTER, KEY_SPACE:
			confirm_selection()
			_mark_input_handled()

func _process(delta: float) -> void:
	preview_elapsed += delta
	if preview_elapsed < 0.25:
		return
	preview_elapsed = 0.0
	preview_frame = (preview_frame + 1) % 4
	for index in previews.size():
		var frames := preview_resources[index]
		if frames != null:
			previews[index].texture = frames.get_frame_texture("idle_se", preview_frame)

func select_index(index: int) -> void:
	selected_index = clampi(index, 0, IDS.size() - 1)
	_refresh_selection()

func confirm_selection() -> bool:
	if not CharacterRoster.set_selected(IDS[selected_index]):
		status_label.text = "Não foi possível gravar a escolha."
		return false
	call_deferred("_change_to_prototype")
	return true

func _change_to_prototype() -> void:
	if not is_inside_tree():
		return
	var error := get_tree().change_scene_to_file("res://scenes/main.tscn")
	if error != OK:
		push_error("Could not enter the isometric prototype: %s" % error_string(error))

func _build_screen() -> void:
	var background := ColorRect.new()
	background.color = Color("17242d")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	content = VBoxContainer.new()
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.add_theme_constant_override("separation", 10)
	content.offset_left = 18
	content.offset_top = 16
	content.offset_right = -18
	content.offset_bottom = -16
	add_child(content)
	var title := Label.new()
	title.text = "SOTOMAR · FÍMBRIA"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color("f0d694"))
	content.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "Escolha quem seguirá pela fronteira de Fímbria"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle.add_theme_font_size_override("font_size", 17)
	subtitle.add_theme_color_override("font_color", Color("d5e0d3"))
	content.add_child(subtitle)
	orientation_label = Label.new()
	orientation_label.text = "Gire o aparelho para uma experiência mais ampla."
	orientation_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	orientation_label.add_theme_color_override("font_color", Color("f0d694"))
	content.add_child(orientation_label)
	character_row = GridContainer.new()
	character_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	character_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	character_row.add_theme_constant_override("separation", 12)
	content.add_child(character_row)
	for index in IDS.size():
		character_row.add_child(_make_card(index))
	footer = HBoxContainer.new()
	footer.alignment = BoxContainer.ALIGNMENT_CENTER
	footer.add_theme_constant_override("separation", 18)
	content.add_child(footer)
	status_label = Label.new()
	status_label.custom_minimum_size.x = 250
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	status_label.add_theme_color_override("font_color", Color("d5e0d3"))
	footer.add_child(status_label)
	enter_button = Button.new()
	enter_button.text = "Entrar no protótipo"
	enter_button.custom_minimum_size = Vector2(230, 46)
	enter_button.pressed.connect(confirm_selection)
	footer.add_child(enter_button)
	status_label.text = "Setas ou A/D para escolher · Enter confirma"
	_layout_screen()

func _make_card(index: int) -> PanelContainer:
	var id: String = IDS[index]
	var data := CharacterRoster.character_data(id)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 0)
	card.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	cards.append(card)
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", int(round(8.0 * _ui_scale)))
	card.add_child(body)
	var title := Label.new()
	title.name = "CardTitle"
	title.text = MALE_TITLE if id == "character.warrior_male.g06" else FEMALE_TITLE
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 21)
	title.add_theme_color_override("font_color", Color("f4e8c9"))
	body.add_child(title)
	var sprite_preview := TextureRect.new()
	sprite_preview.name = "Preview"
	sprite_preview.custom_minimum_size = Vector2(100, 100)
	sprite_preview.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sprite_preview.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
	sprite_preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	var frames := CharacterRoster.get_character_frames(id)
	previews.append(sprite_preview)
	preview_resources.append(frames)
	var direction := "se"
	if frames != null and frames.has_animation("idle_%s" % direction):
		sprite_preview.texture = frames.get_frame_texture("idle_%s" % direction, 0)
	body.add_child(sprite_preview)
	var subtitle := Label.new()
	subtitle.name = "CardSubtitle"
	subtitle.text = String(data.get("pronoun", "Aventureiro")) + " · regras iguais"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_color_override("font_color", Color("c8d5d1"))
	body.add_child(subtitle)
	var choose := Button.new()
	choose.text = "Selecionar"
	choose.custom_minimum_size.y = 50 * _ui_scale
	choose.pressed.connect(select_index.bind(index))
	choose_buttons.append(choose)
	body.add_child(choose)
	return card

func _refresh_selection() -> void:
	if cards.size() != IDS.size():
		return
	for index in cards.size():
		var box := StyleBoxFlat.new()
		box.bg_color = Color("273943") if index == selected_index else Color("202f38")
		box.border_width_left = 3 if index == selected_index else 1
		box.border_width_right = box.border_width_left
		box.border_width_top = box.border_width_left
		box.border_width_bottom = box.border_width_left
		box.border_color = Color("e8bd62") if index == selected_index else Color("51616a")
		box.corner_radius_top_left = 8
		box.corner_radius_top_right = 8
		box.corner_radius_bottom_left = 8
		box.corner_radius_bottom_right = 8
		box.content_margin_left = 10 * _ui_scale
		box.content_margin_right = 10 * _ui_scale
		box.content_margin_top = 10 * _ui_scale
		box.content_margin_bottom = 10 * _ui_scale
		cards[index].add_theme_stylebox_override("panel", box)

func _mark_input_handled() -> void:
	var viewport := get_viewport()
	if viewport != null and viewport.is_inside_tree():
		viewport.set_input_as_handled()

func _layout_screen() -> void:
	if content == null or not is_instance_valid(content):
		return
	var view_size := get_viewport_rect().size
	var screen_scale := 1.0
	if OS.has_feature("web"):
		screen_scale = get_viewport().get_screen_transform().get_scale().x
	_ui_scale = clampf(1.0 / maxf(screen_scale, 0.25), 1.0, 3.0)
	var portrait := view_size.x < view_size.y * 0.95
	var compact_landscape := not portrait and view_size.y * screen_scale < 480.0
	for control in content.get_children():
		if control is Label and control != orientation_label:
			var font_size := 22.0 if control == content.get_child(0) and view_size.x < 500.0 else (14.0 if view_size.x < 500.0 else (17.0 if control != content.get_child(0) else 30.0))
			control.add_theme_font_size_override("font_size", int(round(font_size * _ui_scale)))
	orientation_label.add_theme_font_size_override("font_size", int(round(14.0 * _ui_scale)))
	content.offset_left = (12 if view_size.x < 500.0 else 20) * _ui_scale
	content.offset_right = -content.offset_left
	content.offset_top = 12 * _ui_scale
	content.offset_bottom = -12 * _ui_scale
	content.add_theme_constant_override("separation", int(round((6 if portrait else (5 if compact_landscape else 10)) * _ui_scale)))
	character_row.columns = 1 if portrait else 2
	character_row.add_theme_constant_override("separation", int(round((6 if portrait else 16) * _ui_scale)))
	orientation_label.visible = portrait
	status_label.visible = not portrait and view_size.x > 720.0
	status_label.custom_minimum_size.x = 220 * _ui_scale if status_label.visible else 0
	footer.alignment = BoxContainer.ALIGNMENT_CENTER if portrait else BoxContainer.ALIGNMENT_END
	enter_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL if portrait else Control.SIZE_SHRINK_CENTER
	enter_button.custom_minimum_size = Vector2(0, 52 * _ui_scale) if portrait else Vector2(230 * _ui_scale, 50 * _ui_scale)
	enter_button.add_theme_font_size_override("font_size", int(round(16.0 * _ui_scale)))
	footer.add_theme_constant_override("separation", int(round(18.0 * _ui_scale)))
	status_label.add_theme_font_size_override("font_size", int(round(14.0 * _ui_scale)))
	for card in cards:
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.size_flags_vertical = Control.SIZE_EXPAND_FILL
		card.custom_minimum_size = Vector2(maxf(0.0, (view_size.x - 48.0) / 2.0), 0.0) if not portrait else Vector2(0.0, 0.0)
		var preview := card.find_child("Preview", true, false) as TextureRect
		if preview:
			var preview_height := 110.0 if portrait else (76.0 if compact_landscape else minf(120.0, view_size.y * 0.32))
			preview.custom_minimum_size = Vector2(100.0 * _ui_scale, preview_height * _ui_scale)
			preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
		var card_title := card.find_child("CardTitle", true, false) as Label
		if card_title:
			card_title.add_theme_font_size_override("font_size", int(round(21.0 * _ui_scale)))
		var card_subtitle := card.find_child("CardSubtitle", true, false) as Label
		if card_subtitle:
			card_subtitle.add_theme_font_size_override("font_size", int(round(15.0 * _ui_scale)))
		var body := card.get_child(0) as VBoxContainer
		body.add_theme_constant_override("separation", int(round(8.0 * _ui_scale)))
		for button in choose_buttons:
			button.custom_minimum_size.y = 50 * _ui_scale
			button.add_theme_font_size_override("font_size", int(round(16.0 * _ui_scale)))
		_refresh_selection()
