extends RefCounted
class_name QuestProgressStateG13

const REGISTRY_PATH := "res://resources/quests/quest_registry.json"
var _quests: Dictionary = {}
var _aliases: Dictionary = {}
var _map_quests: Dictionary = {}
var _states: Dictionary = {}
var _processed_events: Dictionary = {}
var _flags: Dictionary = {}

func _init() -> void:
	var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
	if file == null:
		push_error("Quest registry is missing: " + REGISTRY_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Quest registry JSON is invalid")
		return
	_quests = parsed.get("quests", {}).duplicate(true)
	_aliases = parsed.get("npc_aliases", {}).duplicate(true)
	_map_quests = parsed.get("map_quests", {}).duplicate(true)
	for quest_id: String in _quests:
		var progress := {}
		for objective: Dictionary in _quests[quest_id].get("objectives", []):
			progress[String(objective.id)] = 0
		_states[quest_id] = {"accepted": false, "completed": false, "objectives": progress}

func process_event(event: Dictionary) -> Dictionary:
	var event_id := String(event.get("eventId", ""))
	if event_id.is_empty():
		return _result(false, "EVENT_ID_REQUIRED")
	if _processed_events.has(event_id):
		return _result(false, "DUPLICATE_EVENT")
	_processed_events[event_id] = true
	var completed: Array[String] = []
	var unlocked: Array[String] = []
	for quest_id: String in _quests:
		var definition: Dictionary = _quests[quest_id]
		var state: Dictionary = _states[quest_id]
		if not bool(state.accepted) or bool(state.completed):
			continue
		var objective := _matching_objective(quest_id, definition, event)
		if objective.is_empty():
			continue
		var objective_id := String(objective.id)
		var amount := maxi(1, int(objective.get("amount", 1)))
		state.objectives[objective_id] = mini(amount, int(state.objectives[objective_id]) + maxi(1, int(event.get("amount", 1))))
		if _objectives_met(quest_id, definition) and _completion_defined(definition):
			state.completed = true
			completed.append(quest_id)
			var flag_id := String(definition.get("worldFlagReward", ""))
			if not flag_id.is_empty() and not has_flag(flag_id):
				_flags[flag_id] = true
				unlocked.append(flag_id)
	return {"accepted": true, "reason": "PROCESSED", "completed_quests": completed, "unlocked_flags": unlocked}

func record_map_entry(map_id: String, event_id: String) -> Dictionary:
	for quest_id: String in _map_quests.get(map_id, []):
		var definition: Dictionary = _quests.get(quest_id, {})
		if definition.is_empty() or _has_talk_objective(definition):
			continue
		accept_quest(quest_id)
	return process_event({"eventId": event_id, "type": "EXPLORE", "target": map_id})

func record_npc_talk(npc_runtime_id: String, event_id: String) -> Dictionary:
	var canonical_id := ""
	for candidate: String in _aliases:
		if String(_aliases[candidate]) == npc_runtime_id:
			canonical_id = candidate
			break
	if canonical_id.is_empty():
		return _result(false, "UNKNOWN_NPC")
	return process_event({"eventId": event_id, "type": "TALK", "target": canonical_id})

func set_flag(flag_id: String, enabled := true) -> void:
	if not flag_id.is_empty():
		_flags[flag_id] = enabled

func accept_quest(quest_id: String) -> bool:
	if not _quests.has(quest_id) or not _states.has(quest_id):
		return false
	var definition: Dictionary = _quests[quest_id]
	var state: Dictionary = _states[quest_id]
	if bool(state.accepted) or bool(state.completed) or not _prerequisites_met(definition) or not _flags_met(definition.get("requiredFlags", [])):
		return false
	state.accepted = true
	return true

func available_quests_for_npc(npc_runtime_id: String) -> Array[String]:
	var canonical_id := ""
	for candidate: String in _aliases:
		if String(_aliases[candidate]) == npc_runtime_id:
			canonical_id = candidate
			break
	var result: Array[String] = []
	if canonical_id.is_empty():
		return result
	for quest_id: String in _quests:
		var definition: Dictionary = _quests[quest_id]
		if not is_available(quest_id):
			continue
		for objective: Dictionary in definition.get("objectives", []):
			if String(objective.get("type", "")) == "TALK" and String(objective.get("target", "")) == canonical_id:
				result.append(quest_id)
				break
	return result

func _has_talk_objective(definition: Dictionary) -> bool:
	for objective: Dictionary in definition.get("objectives", []):
		if String(objective.get("type", "")) == "TALK":
			return true
	return false

func is_available(quest_id: String) -> bool:
	if not _quests.has(quest_id) or not _states.has(quest_id):
		return false
	var state: Dictionary = _states[quest_id]
	var definition: Dictionary = _quests[quest_id]
	return not bool(state.accepted) and not bool(state.completed) and _prerequisites_met(definition) and _flags_met(definition.get("requiredFlags", []))

func has_flag(flag_id: String) -> bool:
	return bool(_flags.get(flag_id, false))

func is_completed(quest_id: String) -> bool:
	return bool(_states.get(quest_id, {}).get("completed", false))

func progress(quest_id: String, objective_id: String) -> int:
	return int(_states.get(quest_id, {}).get("objectives", {}).get(objective_id, 0))

func tracker_text() -> String:
	var rows: Array[String] = []
	for quest_id: String in _quests:
		var definition: Dictionary = _quests[quest_id]
		var state: Dictionary = _states[quest_id]
		if bool(state.completed):
			continue
		if not bool(state.accepted):
			if is_available(quest_id):
				rows.append("Disponível · %s" % String(definition.get("title", quest_id)))
			if rows.size() >= 2:
				break
			continue
		for objective: Dictionary in definition.get("objectives", []):
			var objective_id := String(objective.id)
			var amount := maxi(1, int(objective.get("amount", 1)))
			var current := int(state.objectives[objective_id])
			if current >= amount:
				continue
			var target := String(objective.get("target", objective.get("type", "Objetivo")))
			if String(objective.get("type", "")) == "OR":
				var alternatives: Array[String] = []
				for option: Dictionary in objective.get("alternatives", []):
					alternatives.append(String(option.get("target", "")))
				target = "Visite %s" % " ou ".join(alternatives)
			else:
				target = "%s (%d/%d)" % [String(objective.get("label", target)), current, amount]
			rows.append("%s · %s" % [String(definition.get("title", quest_id)), target])
			break
		if rows.size() >= 2:
			break
	return "\n".join(rows)

func snapshot() -> Dictionary:
	return {"states": _states.duplicate(true), "processed_events": _processed_events.duplicate(true), "flags": _flags.duplicate(true)}

func _matching_objective(quest_id: String, definition: Dictionary, event: Dictionary) -> Dictionary:
	var state: Dictionary = _states[quest_id]
	var event_type := String(event.get("type", ""))
	for objective: Dictionary in definition.get("objectives", []):
		var objective_id := String(objective.id)
		if int(state.objectives[objective_id]) >= maxi(1, int(objective.get("amount", 1))):
			continue
		var type := String(objective.get("type", ""))
		if type == "OR":
			if event_type == "EXPLORE":
				for option: Dictionary in objective.get("alternatives", []):
					if String(option.get("type", "")) == "EXPLORE" and String(option.get("target", "")) == String(event.get("target", "")):
						return objective
			continue
		var expected: String = {"TALK":"TALK", "EXPLORE":"EXPLORE", "KILL":"MOB_KILLED", "ENCOUNTER":"ENCOUNTER_RESOLVED", "COLLECT":"COLLECT", "INSPECT":"INSPECT", "BOSS":"BOSS_DEFEATED"}.get(type, "")
		if event_type != expected or String(objective.get("target", "")) != String(event.get("target", "")):
			continue
		if type == "BOSS" and bool(objective.get("requireNonLethal", false)) and not bool(event.get("nonLethal", false)):
			continue
		return objective
	return {}

func _prerequisites_met(definition: Dictionary) -> bool:
	for quest_id: String in definition.get("prerequisites", []):
		if not is_completed(quest_id):
			return false
	return true

func _flags_met(required: Array) -> bool:
	for flag_id: String in required:
		if not has_flag(String(flag_id)):
			return false
	return true

func _objectives_met(quest_id: String, definition: Dictionary) -> bool:
	for objective: Dictionary in definition.get("objectives", []):
		if progress(quest_id, String(objective.id)) < maxi(1, int(objective.get("amount", 1))):
			return false
	return true

func _completion_defined(definition: Dictionary) -> bool:
	if bool(definition.get("deliveryTbd", false)) or bool(definition.get("problemResolutionTbd", false)):
		return false
	if not definition.get("pendingObjectives", []).is_empty():
		return false
	return not ["scene_deferred", "nonlethal_encounter_deferred"].has(String(definition.get("contentStatus", "")))

func _result(accepted: bool, reason: String) -> Dictionary:
	return {"accepted": accepted, "reason": reason, "completed_quests": [], "unlocked_flags": []}
