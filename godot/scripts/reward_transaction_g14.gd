extends RefCounted
class_name RewardTransactionG14

var inventory: InventoryStateG14
var progression: Dictionary
var applied: Dictionary = {}

func _init(target_inventory: InventoryStateG14, target_progression: Dictionary = {}) -> void:
	inventory = target_inventory
	progression = target_progression
	if not progression.has("currency"):
		progression["currency"] = {}

func apply(transaction_id: String, reward: Dictionary) -> Dictionary:
	if transaction_id.is_empty():
		return {"ok": false, "reason": "TRANSACTION_ID_REQUIRED"}
	if applied.has(transaction_id):
		return {"ok": false, "reason": "DUPLICATE_TRANSACTION"}
	var items: Array = reward.get("items", [])
	var currency := int(reward.get("currency", 0))
	var xp := int(reward.get("xp", 0))
	if currency < 0 or xp < 0 or float(reward.get("currency", 0)) != currency or float(reward.get("xp", 0)) != xp:
		return {"ok": false, "reason": "INVALID_REWARD"}
	var normalized: Array[Dictionary] = []
	for entry: Dictionary in items:
		var item_id := String(entry.get("itemId", ""))
		var amount := int(entry.get("amount", 0))
		if not inventory.item_registry.has(item_id) or amount <= 0 or float(entry.get("amount", 0)) != amount:
			return {"ok": false, "reason": "INVALID_ITEM_REWARD"}
		normalized.append({"itemId": item_id, "amount": amount})
	# Validation is complete before any state changes, so failure leaves all domains intact.
	var before_inventory := inventory.snapshot()
	var before_currency: Dictionary = progression.currency.duplicate(true)
	var before_xp := int(progression.get("xp", 0))
	for entry: Dictionary in normalized:
		if not inventory.add(entry.itemId, entry.amount):
			inventory.restore(before_inventory)
			progression.currency = before_currency
			return {"ok": false, "reason": "APPLY_FAILED"}
	progression.currency["base"] = int(progression.currency.get("base", 0)) + currency
	if xp > 0:
		var remaining := before_xp + xp
		var level := int(progression.get("level", 1))
		var threshold := int(progression.get("xp_next_level", 100))
		while remaining >= threshold:
			remaining -= threshold
			level += 1
			threshold = roundi(float(threshold) * 1.5)
			progression["available_stat_points"] = int(progression.get("available_stat_points", 0)) + 5
		progression["xp"] = remaining
		progression["level"] = level
		progression["xp_next_level"] = threshold
	applied[transaction_id] = true
	return {"ok": true, "transaction_id": transaction_id, "items": normalized, "currency": currency, "xp": xp}

func snapshot() -> Dictionary:
	return applied.duplicate(true)

func restore(snapshot_data: Dictionary) -> bool:
	for transaction_id: String in snapshot_data:
		if transaction_id.is_empty() or snapshot_data[transaction_id] != true:
			return false
	applied = snapshot_data.duplicate(true)
	return true
