extends RefCounted
class_name EncounterStateStoreG11
## Session-scoped result contract; no inventory, quest or disk writes in G11.

signal encounter_started(encounter_id: String, attempt: int)
signal encounter_resolved(encounter_id: String, outcome: String, result_id: String)

var records: Dictionary = {}

func start(encounter_id: String, repeat_allowed := false) -> Dictionary:
	if encounter_id.is_empty():
		return {"ok": false, "reason": "EMPTY_ID"}
	var record: Dictionary = records.get(encounter_id, {})
	if String(record.get("status", "")) == "IN_PROGRESS":
		return {"ok": false, "reason": "ALREADY_IN_PROGRESS"}
	if String(record.get("status", "")) == "VICTORY" and not repeat_allowed:
		return {"ok": false, "reason": "ALREADY_RESOLVED"}
	var attempt := int(record.get("attempts", 0)) + 1
	var result_id := "%s#%d" % [encounter_id, attempt]
	var previous_claims: Array = record.get("reward_claim_ids", []).duplicate()
	records[encounter_id] = {
		"encounter_id": encounter_id, "status": "IN_PROGRESS", "attempts": attempt,
		"result_id": result_id, "result": {}, "reward_candidates": [],
		"reward_claim_ids": previous_claims, "rewards_applied": false,
		"started_at_session_tick": Time.get_ticks_msec()
	}
	encounter_started.emit(encounter_id, attempt)
	return {"ok": true, "attempt": attempt, "result_id": result_id}

func finish(encounter_id: String, outcome: String, result: Dictionary = {}, reward_candidates: Array = []) -> Dictionary:
	if not outcome in ["VICTORY", "DEFEAT"]:
		return {"ok": false, "reason": "INVALID_OUTCOME"}
	if not records.has(encounter_id) or String(records[encounter_id].status) != "IN_PROGRESS":
		return {"ok": false, "reason": "NOT_IN_PROGRESS"}
	var record: Dictionary = records[encounter_id]
	var result_id := String(record.result_id)
	record.status = outcome
	record.result = result.duplicate(true)
	record.reward_candidates = reward_candidates.duplicate(true)
	record.rewards_applied = false
	encounter_resolved.emit(encounter_id, outcome, result_id)
	return {"ok": true, "result_id": result_id, "record": record.duplicate(true)}

## Future inventory adapters can reserve a stable claim ID. G11 never grants an item.
func reserve_reward_claim(encounter_id: String, reward_claim_id: String) -> Dictionary:
	if reward_claim_id.is_empty() or not records.has(encounter_id):
		return {"ok": false, "reason": "UNKNOWN_REWARD_CLAIM"}
	var record: Dictionary = records[encounter_id]
	if String(record.status) != "VICTORY":
		return {"ok": false, "reason": "ENCOUNTER_NOT_WON"}
	var has_candidate := false
	for candidate: Variant in record.get("reward_candidates", []):
		if candidate is Dictionary and String(candidate.get("id", "")) == reward_claim_id:
			has_candidate = true
			break
	if not has_candidate:
		return {"ok": false, "reason": "REWARD_NOT_DEFINED"}
	if record.reward_claim_ids.has(reward_claim_id):
		return {"ok": false, "reason": "DUPLICATE_CLAIM"}
	record.reward_claim_ids.append(reward_claim_id)
	return {"ok": true, "grant_pending": true, "reward_claim_id": reward_claim_id}

func snapshot() -> Dictionary:
	return {"schema_version": 1, "records": records.duplicate(true)}

func restore_snapshot(snapshot_data: Dictionary) -> bool:
	if int(snapshot_data.get("schema_version", 0)) != 1 or not snapshot_data.get("records", {}) is Dictionary:
		return false
	var restored: Dictionary = snapshot_data.records.duplicate(true)
	for encounter_id: String in restored:
		var record: Dictionary = restored[encounter_id]
		if String(record.get("encounter_id", "")) != encounter_id or not String(record.get("status", "")) in ["IN_PROGRESS", "VICTORY", "DEFEAT"]:
			return false
		if not record.get("reward_claim_ids", []) is Array:
			return false
	records = restored
	return true

func is_resolved(encounter_id: String) -> bool:
	return String(records.get(encounter_id, {}).get("status", "")) == "VICTORY"

func get_record(encounter_id: String) -> Dictionary:
	return records.get(encounter_id, {}).duplicate(true)
