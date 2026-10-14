extends SceneTree

const Inventory = preload("res://scripts/inventory_state_g14.gd")
const Equipment = preload("res://scripts/equipment_state_g14.gd")
const Stats = preload("res://scripts/character_stats_g14.gd")
const Rewards = preload("res://scripts/reward_transaction_g14.gd")
const Services = preload("res://scripts/services_controller_g14.gd")
const QuestState = preload("res://scripts/quest_progress_state_g13.gd")
var failures := 0

func _initialize() -> void:
	var inventory = Inventory.new()
	_check(inventory.count("pocao_simples") == 0, "inventory starts empty")
	_check(not inventory.add("unknown_item", 1) and not inventory.add("pocao_simples", -1), "invalid item and negative quantity are rejected")
	_check(inventory.add("pocao_simples", 2), "known item can be received")
	_check(not inventory.remove("pocao_simples", 3) and inventory.count("pocao_simples") == 2, "failed removal leaves inventory intact")
	var equipment = Equipment.new()
	_check(not equipment.equip("pocao_simples", inventory).ok, "consumable cannot be equipped")
	_check(inventory.add("espada_madeira", 1), "test weapon added")
	_check(equipment.equip("espada_madeira", inventory).ok, "valid equipment can be equipped")
	_check(inventory.add("cajado_magico", 1), "second weapon added")
	var swap := equipment.equip("cajado_magico", inventory)
	_check(swap.ok and swap.unequipped == "espada_madeira" and inventory.has("espada_madeira"), "equipment swap returns previous item")
	var stats = Stats.new({"forca": 10}, equipment, inventory)
	_check(stats.effective().inteligencia == 8 and stats.max_hp() == 100, "supported item bonuses affect derived stats")
	_check(equipment.unequip("weapon", inventory).ok and inventory.has("cajado_magico"), "unequip returns item")
	var progression := {"currency": {"base": 100}}
	var tx = Rewards.new(inventory, progression)
	_check(not tx.apply("", {"items": []}).ok, "transaction ID is required")
	var granted := tx.apply("quest:test", {"items": [{"itemId": "QITEM_TUFO_PALIDO", "amount": 1}], "currency": 12, "xp": 110})
	_check(granted.ok and inventory.has("QITEM_TUFO_PALIDO") and progression.currency.base == 112 and progression.level == 2 and progression.xp == 10, "reward transaction grants canonical item, currency and levels")
	_check(not tx.apply("quest:test", {"currency": 100}).ok and progression.currency.base == 112, "reward replay cannot duplicate currency")
	var before := inventory.snapshot()
	_check(not tx.apply("bad:partial", {"items": [{"itemId": "pocao_simples", "amount": 1}, {"itemId": "unknown", "amount": 1}], "currency": 50}).ok, "invalid partial reward is rejected")
	_check(inventory.snapshot() == before and progression.currency.base == 112, "failed reward does not partially mutate state")
	_check(not tx.apply("negative", {"items": [{"itemId": "pocao_simples", "amount": -1}]}).ok, "negative reward quantity rejected")
	var services = Services.new(inventory, equipment, progression)
	var used := services.use_consumable("pocao_simples", 20, 100)
	_check(used.ok and used.hp == 50 and inventory.count("pocao_simples") == 1, "consumable heals and consumes one unit")
	_check(not services.use_consumable("pocao_simples", 100, 100).ok, "consumable at full health rejected")
	_check(not services.use_consumable("pocao_simples", 20, 100, true, 1).ok, "combat AP cost enforced")
	var healed := services.heal(5, 100)
	_check(healed.healed and healed.hp == 100, "healer service restores health")
	var bought := services.buy("couro_javali", 2)
	_check(bought.ok and bought.provisional and inventory.count("couro_javali") == 2, "market purchase uses catalog and marks provisional pricing")
	_check(not services.sell("QITEM_TUFO_PALIDO", 1).ok, "quest item cannot be sold")
	_check(services.sell("couro_javali", 2).ok and inventory.count("couro_javali") == 0, "valid market sale updates inventory")
	_check(not services.buy("couro_javali", 1000).ok, "purchase rejects insufficient funds")
	_check(inventory.restore({"espada_madeira": 1}) and inventory.has("espada_madeira"), "valid inventory snapshot restores")
	_check(not inventory.restore({"unknown": 2}) and inventory.has("espada_madeira"), "invalid snapshot is rejected without replacement")
	var quest_state = QuestState.new()
	var point := {"id": "POINT_TUFO_PALIDO", "itemId": "QITEM_TUFO_PALIDO", "mapId": "MAP_02", "x": 2, "y": 2}
	quest_state.record_inspection(point)
	var claim: Dictionary = quest_state.pending_item_claims()[0]
	var claim_transaction := Rewards.new(inventory, progression)
	var committed := claim_transaction.apply("inspection:%s" % claim.event_id, {"items": [{"itemId": claim.item_id, "amount": claim.amount}]})
	var collected := quest_state.commit_item_claim(claim.event_id, "inspection:%s" % claim.event_id, committed.ok)
	_check(committed.ok and collected.accepted and inventory.has("QITEM_TUFO_PALIDO"), "canonical inspection claim reaches inventory before COLLECT is emitted")
	_check(not quest_state.commit_item_claim(claim.event_id, "inspection:%s" % claim.event_id, true).accepted, "inspection claim cannot be collected twice")
	if failures == 0:
		print("G14 inventory tests passed")
		quit(0)
	else:
		push_error("%d G14 test(s) failed" % failures)
		quit(1)

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: " + message)
	else:
		failures += 1
		push_error("FAIL: " + message)
