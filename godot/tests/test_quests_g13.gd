extends SceneTree

const QuestState = preload("res://scripts/quest_progress_state_g13.gd")
var failures := 0

func _initialize() -> void:
	var state = QuestState.new()
	_check(state._quests.size() == 13, "all thirteen canonical quest definitions load from generated registry")
	var unknown := state.record_npc_talk("missing_npc", "talk:unknown")
	_check(not unknown.accepted and unknown.reason == "UNKNOWN_NPC", "unknown NPC aliases are ignored")
	_check(state.available_quests_for_npc("guarda_mira").has("MAIN_01") and state.accept_quest("MAIN_01"), "canonical TALK quest is offered by its mapped NPC and requires acceptance")
	_check(state.dialogue_state_for_npc("guarda_mira") == "active", "NPC dialogue state reflects explicit quest acceptance")
	var talk := state.record_npc_talk("guarda_mira", "talk:mira:01")
	_check(talk.accepted and state.progress("MAIN_01", "main01_talk_mira") == 1, "runtime NPC alias records canonical TALK progress")
	var duplicate := state.record_npc_talk("guarda_mira", "talk:mira:01")
	_check(duplicate.reason == "DUPLICATE_EVENT" and state.progress("MAIN_01", "main01_talk_mira") == 1, "event replay is idempotent")
	state.record_map_entry("MAP_02", "map:02:entry:1")
	var mob_event := state.process_event({"eventId": "combat:enc01:cascudo:1", "type": "MOB_KILLED", "target": "CRE_CASCUDO_DE_CAL"})
	_check(mob_event.accepted and state.progress("MAIN_01", "main01_cascudo") == 1, "G11 MOB_KILLED event updates canonical KILL objective")
	_check(state.dialogue_state_for_npc("guarda_mira") == "ready", "NPC dialogue changes to ready when the canonical turn-in is the only remaining objective")
	state.record_npc_talk("guarda_mira", "talk:mira:02")
	_check(state.is_completed("MAIN_01") and not state.is_completed("MAIN_02"), "quest completion respects objective set and prerequisite chain")
	_check(state.dialogue_state_for_npc("guarda_mira") == "available", "NPC offers the next prerequisite-unlocked quest after completion")
	_check(state.is_available("MAIN_02") and state.accept_quest("MAIN_02"), "completed prerequisite makes the next main quest available for explicit acceptance")
	var map04 := state.record_map_entry("MAP_04", "map:04:entry:1")
	_check(map04.accepted and state.progress("MAIN_02", "main02_map04") == 1, "completed prerequisite activates next main quest objective")
	_check(state.progress("MAIN_04", "main04_route") == 0, "locked quests do not accumulate events")
	var npc_event := state.record_npc_talk("exploradora_lia", "talk:lia:01")
	_check(npc_event.accepted and state.progress("SIDE_02", "side02_bram") == 0, "NPC events match canonical IDs rather than role or display text")
	var gated := state.process_event({"eventId": "boss:nonlethal-missing", "type": "BOSS_DEFEATED", "target": "CRE_SINEIRA", "nonLethal": false})
	_check(gated.accepted and state.progress("MAIN_07", "main07_sineira") == 0, "lethal boss event cannot satisfy nonlethal canonical requirement")
	_check(state.tracker_text().contains("A Cerca Quebrada") or state.tracker_text().contains("Rastros Subindo"), "objective summary is available for compact mobile tracker")
	var gated_state = QuestState.new()
	gated_state._states["MAIN_07"]["completed"] = true
	gated_state.process_event({"eventId": "main08:collect:locked", "type": "COLLECT", "target": "QITEM_DECALQUE_DO_SELO"})
	gated_state.process_event({"eventId": "main08:talk:locked", "type": "TALK", "target": "NPC_MIRA"})
	_check(not gated_state.is_completed("MAIN_08"), "MAIN_08 stays locked until its required world flags are true")
	gated_state.set_flag("FLAG_SINEIRA_RESOLVED")
	gated_state.set_flag("FLAG_SEAL_INSPECTED")
	_check(gated_state.accept_quest("MAIN_08"), "MAIN_08 becomes available after prerequisite and required flags")
	gated_state.process_event({"eventId": "main08:collect:open", "type": "COLLECT", "target": "QITEM_DECALQUE_DO_SELO"})
	gated_state.process_event({"eventId": "main08:talk:open", "type": "TALK", "target": "NPC_MIRA"})
	_check(gated_state.is_completed("MAIN_08"), "MAIN_08 objectives advance only after both canonical flags are set")
	var gate_state = QuestState.new()
	gate_state._states["MAIN_03"]["completed"] = true
	_check(gate_state.accept_quest("MAIN_04"), "unlocked quest requires acceptance before objectives begin")
	gate_state.process_event({"eventId": "main04:map05", "type": "EXPLORE", "target": "MAP_05"})
	gate_state.process_event({"eventId": "main04:registro", "type": "COLLECT", "target": "QITEM_REGISTRO_DE_NIVEL"})
	gate_state.process_event({"eventId": "main04:batidas", "type": "COLLECT", "target": "QITEM_PAGINA_DAS_BATIDAS"})
	gate_state.process_event({"eventId": "main04:lia", "type": "TALK", "target": "NPC_LIA"})
	_check(gate_state.is_completed("MAIN_04") and gate_state.has_flag("FLAG_ESCADA_MARCO_PRUMO_UNLOCKED"), "MAIN_04 grants its canonical gate flag after the sourced OR and turn-in objectives")
	var deferred_state = QuestState.new()
	deferred_state._states["MAIN_01"]["completed"] = true
	_check(deferred_state.accept_quest("MAIN_02"), "prerequisite-complete quest can be accepted")
	deferred_state.process_event({"eventId": "main02:map", "type": "EXPLORE", "target": "MAP_04"})
	deferred_state.process_event({"eventId": "main02:item", "type": "COLLECT", "target": "QITEM_TUFO_PALIDO"})
	deferred_state.process_event({"eventId": "main02:mob", "type": "MOB_KILLED", "target": "CRE_TOPETAO"})
	deferred_state.process_event({"eventId": "main02:lia", "type": "TALK", "target": "NPC_LIA"})
	_check(not deferred_state.is_completed("MAIN_02"), "MAIN_02 remains incomplete while the canonical delivery is marked TBD")
	var map_assigned_state = QuestState.new()
	for prerequisite: String in ["MAIN_01", "MAIN_02", "MAIN_03", "MAIN_04", "MAIN_05", "MAIN_06"]:
		map_assigned_state._states[prerequisite]["completed"] = true
	map_assigned_state.record_map_entry("MAP_10", "map:10:assigned")
	_check(map_assigned_state._states["MAIN_07"]["accepted"], "map-assigned quest without TALK objective is accepted through the canonical map adapter")
	if failures == 0:
		print("PASS: G13 quest state, aliases, event idempotency, prerequisites and nonlethal requirements")
		quit(0)
	else:
		push_error("%d G13 quest check(s) failed" % failures)
		quit(1)

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		failures += 1
		push_error("FAIL: " + label)
