extends SceneTree

var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: Variant = (load("res://scenes/main.tscn") as PackedScene).instantiate()
	get_root().add_child(scene)
	await process_frame
	_check(scene.get("inventory_button") != null and scene.get("inventory_panel") != null, "inventory controls exist in the main scene")
	_check(scene.get("healer_service_button") != null, "canonical healer service has a dedicated interaction control")
	for size: Vector2 in [Vector2(390, 844), Vector2(844, 390), Vector2(360, 800), Vector2(1280, 720)]:
		scene.call("_layout_interaction_ui", size)
		_check(_inside(scene.get("inventory_button"), size), "inventory button remains in bounds at %s" % str(size))
		_check(_inside(scene.get("inventory_panel"), size), "inventory panel remains in bounds at %s" % str(size))
		_check(_inside(scene.get("dialogue_panel"), size), "dialogue panel remains in bounds at %s" % str(size))
	_check(not scene.get("rotation_hint").visible, "portrait banner no longer overlaps the quest tracker")
	scene.call("_toggle_inventory_panel")
	await process_frame
	var panel: Control = scene.get("inventory_panel")
	var stack: Control = panel.get_child(0)
	_check(panel.visible and stack.size.x >= 300.0 and stack.size.y >= 300.0, "opened inventory content fills its responsive panel")
	_check(not scene.get("quest_tracker").visible, "inventory panel hides the quest tracker while they share screen space")
	var saved_inventory: Dictionary = scene.get("_inventory_state").snapshot()
	var export_data: Dictionary = scene.get("_save_store").export_json(scene.call("_current_save_payload"))
	scene.call("_layout_interaction_ui", Vector2(390, 844))
	scene.call("_handle_import_text", export_data.text, "test-backup.json")
	_check(scene.get("import_preview_panel").visible and not String(scene.get("_pending_import_text")).is_empty(), "valid backup opens a confirmation preview")
	scene.call("_layout_interaction_ui", Vector2(390, 844))
	_check(_inside(scene.get("import_preview_panel"), Vector2(390, 844)), "backup preview fits the portrait viewport")
	_check(scene.get("_inventory_state").snapshot() == saved_inventory, "backup preview leaves the live inventory unchanged")
	scene.call("_cancel_import_save")
	_check(String(scene.get("_pending_import_text")).is_empty() and scene.get("_inventory_state").snapshot() == saved_inventory, "canceling preview clears pending data without changing state")
	if failures == 0:
		print("G18A responsive layout tests passed")
		quit(0)
	else:
		push_error("%d G18A responsive layout test(s) failed" % failures)
		quit(1)

func _inside(control: Control, size: Vector2) -> bool:
	return control.position.x >= 0.0 and control.position.y >= 0.0 and control.position.x + control.size.x <= size.x + 0.5 and control.position.y + control.size.y <= size.y + 0.5

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: " + label)
	else:
		failures += 1
		push_error("FAIL: " + label)
