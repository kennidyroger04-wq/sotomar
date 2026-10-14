extends RefCounted
class_name CharacterStatsG14

var base_stats: Dictionary = {"vitalidade": 0, "forca": 0, "inteligencia": 0, "agilidade": 0}
var equipment: EquipmentStateG14
var inventory: InventoryStateG14

func _init(base: Dictionary = {}, equipped: EquipmentStateG14 = null, item_inventory: InventoryStateG14 = null) -> void:
	for key: String in base_stats:
		base_stats[key] = maxi(0, int(base.get(key, 0)))
	equipment = equipped
	inventory = item_inventory

func effective() -> Dictionary:
	var result := base_stats.duplicate(true)
	result["flat_hp_bonus"] = 0
	if equipment == null or inventory == null:
		return result
	for item_id: String in equipment.slots.values():
		var item: Dictionary = inventory.item_registry.get(item_id, {})
		var bonus: Dictionary = item.get("equip", {}).get("bonus", {})
		for stat: String in bonus:
			if stat == "hp":
				result["flat_hp_bonus"] += int(bonus[stat])
			else:
				result[stat] = int(result.get(stat, 0)) + int(bonus[stat])
	return result

func max_hp() -> int:
	var stats := effective()
	return 100 + int(stats.get("vitalidade", 0)) * 10 + int(stats.get("flat_hp_bonus", 0))
