extends RefCounted
class_name InventoryStateG14

const REGISTRY_PATH := "res://resources/items/item_registry.json"
var item_registry: Dictionary = {}
var quantities: Dictionary = {}

func _init(registry: Dictionary = {}) -> void:
	if registry.is_empty():
		var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
		if file != null:
			var parsed: Variant = JSON.parse_string(file.get_as_text())
			if parsed is Dictionary:
				registry = parsed
	item_registry = registry.get("items", {}).duplicate(true)

func count(item_id: String) -> int:
	return int(quantities.get(item_id, 0))

func add(item_id: String, amount: int) -> bool:
	if not item_registry.has(item_id) or amount <= 0:
		return false
	quantities[item_id] = count(item_id) + amount
	return true

func remove(item_id: String, amount: int) -> bool:
	if amount <= 0 or count(item_id) < amount:
		return false
	var left := count(item_id) - amount
	if left == 0:
		quantities.erase(item_id)
	else:
		quantities[item_id] = left
	return true

func has(item_id: String, amount := 1) -> bool:
	return amount > 0 and count(item_id) >= amount

func snapshot() -> Dictionary:
	return quantities.duplicate(true)

func restore(snapshot_data: Dictionary) -> bool:
	var clean := {}
	for item_id: String in snapshot_data:
		var amount := int(snapshot_data[item_id])
		if not item_registry.has(item_id) or amount <= 0 or float(snapshot_data[item_id]) != amount:
			return false
		clean[item_id] = amount
	quantities = clean
	return true
