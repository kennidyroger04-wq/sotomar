extends RefCounted
class_name NpcDialogueCatalog

const PATH := "res://resources/npcs/npc_dialogues_g09.json"

static func all() -> Dictionary:
	if not FileAccess.file_exists(PATH):
		push_error("Canonical NPC dialogue resource is missing: " + PATH)
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(PATH))
	if not parsed is Dictionary or not (parsed as Dictionary).has("npcs"):
		push_error("Canonical NPC dialogue resource is invalid: " + PATH)
		return {}
	return (parsed as Dictionary).duplicate(true)

static func get_npc(npc_id: String) -> Dictionary:
	return all().get("npcs", {}).get(npc_id, {}).duplicate(true)
