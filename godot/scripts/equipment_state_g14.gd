extends RefCounted
class_name EquipmentStateG14

var slots: Dictionary = {}

func equip(item_id: String, inventory: InventoryStateG14) -> Dictionary:
	if inventory == null or not inventory.has(item_id):
		return {"ok": false, "reason": "ITEM_UNAVAILABLE"}
	var item: Dictionary = inventory.item_registry.get(item_id, {})
	var equipment: Dictionary = item.get("equip", {})
	var slot := String(equipment.get("slot", item.get("canonicalSlot", "")))
	if slot.is_empty() or String(item.get("mechanicsStatus", "")) == "adiado":
		return {"ok": false, "reason": "NOT_EQUIPPABLE"}
	var previous := String(slots.get(slot, ""))
	if not inventory.remove(item_id, 1):
		return {"ok": false, "reason": "ITEM_UNAVAILABLE"}
	if not previous.is_empty() and not inventory.add(previous, 1):
		inventory.add(item_id, 1)
		return {"ok": false, "reason": "INVALID_PREVIOUS_EQUIPMENT"}
	slots[slot] = item_id
	return {"ok": true, "slot": slot, "equipped": item_id, "unequipped": previous}

func unequip(slot: String, inventory: InventoryStateG14) -> Dictionary:
	var item_id := String(slots.get(slot, ""))
	if item_id.is_empty():
		return {"ok": false, "reason": "EMPTY_SLOT"}
	if not inventory.add(item_id, 1):
		return {"ok": false, "reason": "INVALID_EQUIPMENT"}
	slots.erase(slot)
	return {"ok": true, "slot": slot, "item_id": item_id}

func snapshot() -> Dictionary:
	return slots.duplicate(true)
