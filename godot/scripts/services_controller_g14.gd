extends RefCounted
class_name ServicesControllerG14

var inventory: InventoryStateG14
var equipment: EquipmentStateG14
var progression: Dictionary
var item_registry: Dictionary

func _init(target_inventory: InventoryStateG14, target_equipment: EquipmentStateG14, target_progression: Dictionary = {}) -> void:
	inventory = target_inventory
	equipment = target_equipment
	progression = target_progression
	var file := FileAccess.open("res://resources/items/item_registry.json", FileAccess.READ)
	if file != null:
		var parsed: Variant = JSON.parse_string(file.get_as_text())
		if parsed is Dictionary:
			item_registry = parsed.get("items", {}).duplicate(true)

func heal(current_hp: int, max_hp: int) -> Dictionary:
	if current_hp >= max_hp:
		return {"ok": true, "healed": false, "hp": current_hp}
	return {"ok": true, "healed": true, "hp": max_hp, "amount": max_hp - current_hp}

func use_consumable(item_id: String, current_hp: int, max_hp: int, in_combat := false, current_ap := 0) -> Dictionary:
	var item: Dictionary = item_registry.get(item_id, {})
	if item.get("type", "") != "CONSUMABLE" or not inventory.has(item_id):
		return {"ok": false, "reason": "UNAVAILABLE"}
	if current_hp <= 0:
		return {"ok": false, "reason": "DEAD"}
	if current_hp >= max_hp:
		return {"ok": false, "reason": "FULL"}
	var cost := int(item.get("useCostAp", 0)) if in_combat else 0
	if current_ap < cost:
		return {"ok": false, "reason": "AP"}
	var effect: Dictionary = item.get("effect", {})
	if effect.get("type", "") != "HEAL":
		return {"ok": false, "reason": "EFFECT"}
	var hp := mini(max_hp, current_hp + maxi(0, int(effect.get("amount", 0))))
	if hp <= current_hp or not inventory.remove(item_id, 1):
		return {"ok": false, "reason": "FULL"}
	return {"ok": true, "item_id": item_id, "hp": hp, "healed": hp - current_hp, "ap_cost": cost}

func buy(item_id: String, amount := 1) -> Dictionary:
	return _trade(item_id, amount, true)

func sell(item_id: String, amount := 1) -> Dictionary:
	return _trade(item_id, amount, false)

func _trade(item_id: String, amount: int, buying: bool) -> Dictionary:
	var item: Dictionary = item_registry.get(item_id, {})
	var market: Dictionary = item.get("economy", {})
	if item.is_empty() or market.is_empty():
		return {"ok": false, "reason": "UNKNOWN_ITEM"}
	if amount <= 0:
		return {"ok": false, "reason": "INVALID_QUANTITY"}
	if not buying and (market.get("sellable", true) == false or item.get("questItem", false)):
		return {"ok": false, "reason": "UNSELLABLE_ITEM"}
	var currency := String(market.get("currencyId", "base"))
	var balance := int(progression.get("currency", {}).get(currency, 0))
	var price := int(market.get("buyPrice" if buying else "sellPrice", 0)) * amount
	if buying:
		if balance < price:
			return {"ok": false, "reason": "INSUFFICIENT_FUNDS"}
		if not inventory.add(item_id, amount):
			return {"ok": false, "reason": "INVALID_ITEM"}
		progression.currency[currency] = balance - price
	else:
		if not inventory.has(item_id, amount):
			return {"ok": false, "reason": "INSUFFICIENT_QUANTITY"}
		inventory.remove(item_id, amount)
		progression.currency[currency] = balance + price
	return {"ok": true, "item_id": item_id, "quantity": amount, "total": price, "balance": int(progression.currency[currency]), "provisional": market.get("provisional", false)}
