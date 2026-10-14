extends Node

const SAVE_PATH := "user://character_selection.cfg"
const MALE_ID := "character.warrior_male.g06"
const WAYFARER_ID := "character.wayfarer.g05"
const CATALOG := {
	"character.warrior_male.g06": {
		"display_name": "Guerreiro",
		"pronoun": "Herói guerreiro",
		"frames": "res://resources/characters/warrior_male_g06.tres",
		"equipment": "res://resources/characters/warrior_male_equipment_g06.tres",
		"stats": {"health": 100, "strength": 10, "agility": 10, "magic": 10}
	},
	"character.wayfarer.g05": {
		"display_name": "Wayfarer",
		"pronoun": "Guerreira",
		"frames": "res://resources/combat/wayfarer_combat_g05.tres",
		"equipment": "res://resources/combat/wayfarer_equipment_g05.tres",
		"stats": {"health": 100, "strength": 10, "agility": 10, "magic": 10}
	}
}

var selected_id := MALE_ID

func _ready() -> void:
	_load_selection()

func character_ids() -> Array[String]:
	return [MALE_ID, WAYFARER_ID]

func character_data(character_id: String) -> Dictionary:
	return CATALOG.get(character_id, {}).duplicate(true)

func set_selected(character_id: String, persist := true) -> bool:
	if not CATALOG.has(character_id):
		return false
	selected_id = character_id
	if persist:
		var config := ConfigFile.new()
		config.load(SAVE_PATH)
		config.set_value("character", "selected_id", selected_id)
		var error := config.save(SAVE_PATH)
		if error != OK:
			push_error("Could not save character selection: %s" % error_string(error))
			return false
	return true

func get_character_frames(character_id := "") -> SpriteFrames:
	var resolved := character_id if character_id != "" else selected_id
	var data: Dictionary = CATALOG.get(resolved, CATALOG[MALE_ID])
	return load(data.frames) as SpriteFrames

func get_equipment_frames(character_id := "") -> SpriteFrames:
	var resolved := character_id if character_id != "" else selected_id
	var data: Dictionary = CATALOG.get(resolved, CATALOG[MALE_ID])
	return load(data.equipment) as SpriteFrames

func _load_selection() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return
	var saved := String(config.get_value("character", "selected_id", MALE_ID))
	if CATALOG.has(saved):
		selected_id = saved
