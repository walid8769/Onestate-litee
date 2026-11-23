extends CharacterBody3D

@export var walk_speed := 5.2
@export var sprint_speed := 8.4
@export var acceleration := 18.0
@export var gravity := 22.0
@export var look_sensitivity := 0.004
@export var jump_velocity := 7.0

var _move_touch := Vector2.ZERO
var _move_finger := -1
var _look_finger := -1
var _camera_pitch := deg_to_rad(-12.0)
var _camera: Camera3D
var _pivot: Node3D
var _visual_root: Node3D
var _left_leg: Node3D
var _right_leg: Node3D
var _left_arm: Node3D
var _right_arm: Node3D
var _animation_clock := 0.0
var _sprinting := false
var _sprint_touch := false
var _active_vehicle: CharacterBody3D
var _gas_finger := -1
var _brake_finger := -1
var _vehicle_gas := false
var _vehicle_brake := false
var _vehicle_gas_rect := Rect2()
var _vehicle_brake_rect := Rect2()
var _vehicle_exit_rect := Rect2()
var _touch_hud: Control
var _stick_base: Panel
var _stick_knob: Panel

func _ready() -> void:
	_make_character()
	_make_camera()
	_make_touch_hud()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _make_character() -> void:
	_visual_root = Node3D.new()
	_visual_root.name = "CharacterVisual"
	add_child(_visual_root)
	var model := MeshInstance3D.new()
	model.name = "PlayerDetailedCharacter"
	model.mesh = load("res://assets/models/civilian_character.obj") as Mesh
	if model.mesh != null:
		for surface in range(model.mesh.get_surface_count()):
			var source_material := model.mesh.surface_get_material(surface)
			if source_material is BaseMaterial3D:
				var two_sided := source_material.duplicate() as BaseMaterial3D
				two_sided.cull_mode = BaseMaterial3D.CULL_DISABLED
				model.set_surface_override_material(surface, two_sided)
	_visual_root.add_child(model)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.36
	shape.height = 1.95
	collision.shape = shape
	collision.position.y = 0.98
	add_child(collision)
func _add_capsule(label: String, at: Vector3, radius: float, height: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := CapsuleMesh.new()
	mesh.radius = radius
	mesh.height = height
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color)
	_visual_root.add_child(node)
	return node

func _add_sphere(label: String, at: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color)
	_visual_root.add_child(node)
	return node

func _add_box(label: String, at: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color)
	_visual_root.add_child(node)
	return node

func _add_limb(label: String, at: Vector3, color: Color) -> Node3D:
	var pivot := Node3D.new()
	pivot.name = label
	pivot.position = at
	_visual_root.add_child(pivot)
	var segment := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 0.115
	mesh.height = 0.78
	segment.mesh = mesh
	segment.position.y = -0.24
	segment.material_override = _material(color)
	pivot.add_child(segment)
	var boot := MeshInstance3D.new()
	var boot_mesh := BoxMesh.new()
	boot_mesh.size = Vector3(0.25, 0.13, 0.38)
	boot.mesh = boot_mesh
	boot.position = Vector3(0, -0.59, -0.055)
	boot.material_override = _material(Color(0.055, 0.06, 0.065))
	pivot.add_child(boot)
	return pivot

func _material(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.72
	return mat

func _make_camera() -> void:
	_pivot = Node3D.new()
	_pivot.name = "CameraPivot"
	_pivot.position.y = 1.55
	add_child(_pivot)
	var spring := SpringArm3D.new()
	spring.spring_length = 5.8
	spring.margin = 0.22
	_pivot.add_child(spring)
	_camera = Camera3D.new()
	_camera.current = true
	_camera.fov = 72.0
	_camera.position.x = 0.55
	spring.add_child(_camera)
	_pivot.rotation.x = _camera_pitch


func _make_touch_hud() -> void:
	_touch_hud = Control.new()
	_touch_hud.name = "MobileControls"
	_touch_hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_touch_hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_touch_hud.z_index = 20
	var layer := CanvasLayer.new()
	layer.name = "TouchControlsLayer"
	add_child(layer)
	layer.add_child(_touch_hud)
	_stick_base = _make_touch_panel(Vector2(108, 108), Color(0.06, 0.09, 0.12, 0.42), 54)
	_stick_knob = _make_touch_panel(Vector2(46, 46), Color(0.82, 0.86, 0.89, 0.62), 23)
	_touch_hud.add_child(_stick_base)
	_touch_hud.add_child(_stick_knob)
	var look_ring := _make_touch_panel(Vector2(82, 82), Color(0.06, 0.09, 0.12, 0.20), 41)
	look_ring.name = "LookRing"
	_touch_hud.add_child(look_ring)
	var gas := _make_touch_panel(Vector2(84, 48), Color(0.12, 0.42, 0.30, 0.88), 12)
	gas.name = "GasButton"
	_touch_hud.add_child(gas)
	_add_button_label(gas, "GAS")
	var brake := _make_touch_panel(Vector2(84, 48), Color(0.55, 0.18, 0.16, 0.88), 12)
	brake.name = "BrakeButton"
	_touch_hud.add_child(brake)
	_add_button_label(brake, "BRAKE")
	var sprint := _make_touch_panel(Vector2(78, 42), Color(0.65, 0.48, 0.18, 0.78), 12)
	sprint.name = "SprintButton"
	_touch_hud.add_child(sprint)
	var interact := _make_touch_panel(Vector2(82, 42), Color(0.12, 0.28, 0.36, 0.82), 12)
	interact.name = "InteractButton"
	_touch_hud.add_child(interact)
	var interact_label := Label.new()
	interact_label.text = "DRIVE"
	interact_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	interact_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	interact_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	interact_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.96))
	interact_label.add_theme_font_size_override("font_size", 14)
	interact.add_child(interact_label)
	var sprint_label := Label.new()
	sprint_label.text = "RUN"
	sprint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sprint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	sprint_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	sprint_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.95))
	sprint_label.add_theme_font_size_override("font_size", 15)
	sprint.add_child(sprint_label)
	_layout_touch_hud()
	_set_vehicle_controls_visible(false)

func _add_button_label(panel: Panel, text_value: String) -> void:
	var label := Label.new()
	label.text = text_value
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.add_theme_color_override("font_color", Color(1, 1, 1, 0.96))
	label.add_theme_font_size_override("font_size", 13)
	panel.add_child(label)

func _set_vehicle_controls_visible(visible_value: bool) -> void:
	for node_name in ["GasButton", "BrakeButton"]:
		var node := _touch_hud.get_node_or_null(node_name) if _touch_hud != null else null
		if node != null:
			node.visible = visible_value
	var drive := _touch_hud.get_node_or_null("InteractButton") if _touch_hud != null else null
	if drive != null:
		var label := drive.get_child(0) as Label
		if label != null:
			label.text = "EXIT" if visible_value else "DRIVE"

func _make_touch_panel(panel_size: Vector2, fill: Color, corner: int) -> Panel:
	var panel := Panel.new()
	panel.size = panel_size
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.corner_radius_top_left = corner
	style.corner_radius_top_right = corner
	style.corner_radius_bottom_left = corner
	style.corner_radius_bottom_right = corner
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = Color(0.85, 0.88, 0.92, 0.35)
	panel.add_theme_stylebox_override("panel", style)
	return panel

func _layout_touch_hud() -> void:
	if _touch_hud == null:
		return
	var size := get_viewport().get_visible_rect().size
	var center := Vector2(size.x * 0.22, size.y * 0.78)
	_stick_base.position = center - Vector2(54, 54)
	_stick_knob.position = center - Vector2(23, 23)
	var look := _touch_hud.get_node_or_null("LookRing")
	if look:
		look.position = Vector2(size.x * 0.82 - 41, size.y * 0.78 - 41)
	var sprint := _touch_hud.get_node_or_null("SprintButton")
	if sprint:
		sprint.position = Vector2(size.x - 102, size.y - 245)
	var interact := _touch_hud.get_node_or_null("InteractButton")
	if interact:
		interact.position = Vector2(size.x - 104, size.y - 188)
	var gas := _touch_hud.get_node_or_null("GasButton")
	if gas:
		gas.position = Vector2(size.x - 104, size.y - 296)
	var brake := _touch_hud.get_node_or_null("BrakeButton")
	if brake:
		brake.position = Vector2(size.x - 104, size.y - 242)
	_vehicle_gas_rect = Rect2(Vector2(size.x - 104, size.y - 296), Vector2(84, 48))
	_vehicle_brake_rect = Rect2(Vector2(size.x - 104, size.y - 242), Vector2(84, 48))
	_vehicle_exit_rect = Rect2(Vector2(size.x - 104, size.y - 188), Vector2(82, 42))

func _update_touch_hud() -> void:
	if _stick_knob == null:
		return
	var size := get_viewport().get_visible_rect().size
	var center := Vector2(size.x * 0.22, size.y * 0.78)
	_stick_knob.position = center + _move_touch * 34.0 - Vector2(23, 23)
	var sprint := _touch_hud.get_node_or_null("SprintButton")
	if sprint:
		var style := sprint.get_theme_stylebox("panel").duplicate() as StyleBoxFlat
		style.bg_color = Color(0.88, 0.66, 0.20, 0.92) if _sprint_touch else Color(0.65, 0.48, 0.18, 0.78)
		sprint.add_theme_stylebox_override("panel", style)

func _is_interact_button(position: Vector2) -> bool:
	var size := get_viewport().get_visible_rect().size
	return Rect2(Vector2(size.x - 104, size.y - 188), Vector2(82, 42)).has_point(position)

func _is_sprint_button(position: Vector2) -> bool:
	var size := get_viewport().get_visible_rect().size
	var button_rect := Rect2(Vector2(size.x - 102, size.y - 245), Vector2(78, 42))
	return button_rect.has_point(position)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			var width := get_viewport().get_visible_rect().size.x
			if _active_vehicle != null and _vehicle_gas_rect.has_point(event.position):
				_gas_finger = event.index
				_vehicle_gas = true
			elif _active_vehicle != null and _vehicle_brake_rect.has_point(event.position):
				_brake_finger = event.index
				_vehicle_brake = true
			elif _is_interact_button(event.position):
				_toggle_vehicle()
			elif event.position.x < width * 0.48 and _move_finger == -1:
				_move_finger = event.index
				_move_touch = Vector2.ZERO
			elif _is_sprint_button(event.position):
				_sprint_touch = not _sprint_touch
			elif _look_finger == -1:
				_look_finger = event.index
		else:
			if event.index == _gas_finger:
				_gas_finger = -1
				_vehicle_gas = false
			if event.index == _brake_finger:
				_brake_finger = -1
				_vehicle_brake = false
			if event.index == _move_finger:
				_move_finger = -1
				_move_touch = Vector2.ZERO
			if event.index == _look_finger:
				_look_finger = -1
	elif event is InputEventScreenDrag:
		if event.index == _move_finger:
			var size := get_viewport().get_visible_rect().size
			var center := Vector2(size.x * 0.22, size.y * 0.78)
			_move_touch = ((event.position - center) / 105.0).limit_length(1.0)
		elif event.index == _look_finger:
			_apply_look(event.relative)
	elif event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_apply_look(event.relative)
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_RIGHT:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif event is InputEventKey and event.pressed and event.keycode == KEY_F:
		_toggle_vehicle()

func _toggle_vehicle() -> void:
	if _active_vehicle != null and is_instance_valid(_active_vehicle):
		var vehicle := _active_vehicle
		vehicle.call("exit_vehicle")
		global_position = vehicle.global_position + vehicle.global_transform.basis.x * 2.0 + Vector3(0, 0.15, 0)
		_visual_root.visible = true
		_active_vehicle = null
		_vehicle_gas = false
		_vehicle_brake = false
		_gas_finger = -1
		_brake_finger = -1
		_set_vehicle_controls_visible(false)
		return
	for candidate in get_tree().get_nodes_in_group("driveable_vehicle"):
		var vehicle := candidate as CharacterBody3D
		if vehicle == null or vehicle.call("has_driver"):
			continue
		if global_position.distance_to(vehicle.global_position) <= 7.0:
			_active_vehicle = vehicle
			vehicle.call("enter_vehicle", self)
			_visual_root.visible = false
			return

func get_vehicle_control_state() -> Dictionary:
	var throttle := Input.get_action_strength("move_forward") - Input.get_action_strength("move_back")
	var steer := Input.get_action_strength("move_left") - Input.get_action_strength("move_right")
	if _active_vehicle != null:
		if _vehicle_gas:
			throttle = 1.0
		elif _vehicle_brake:
			throttle = -1.0
		if _move_finger != -1:
			steer = _move_touch.x
	return {"throttle": throttle, "steer": steer}

func _apply_look(delta: Vector2) -> void:
	rotate_y(-delta.x * look_sensitivity)
	_camera_pitch = clampf(_camera_pitch - delta.y * look_sensitivity, deg_to_rad(-48), deg_to_rad(28))
	_pivot.rotation.x = _camera_pitch

func _physics_process(delta: float) -> void:
	if _active_vehicle != null and is_instance_valid(_active_vehicle):
		global_position = _active_vehicle.global_position + Vector3(0.0, 0.95, 0.0)
		return
	_active_vehicle = null
	var input_vector := Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
	)
	if _move_finger != -1:
		input_vector = _move_touch
	input_vector = input_vector.limit_length(1.0)
	var local_direction := Vector3(input_vector.x, 0, input_vector.y)
	var direction := (transform.basis * local_direction).normalized()
	_sprinting = (Input.is_action_pressed("run") or _sprint_touch) and input_vector.length() > 0.1
	var target_speed := sprint_speed if _sprinting else walk_speed
	var target_velocity := direction * target_speed
	velocity.x = move_toward(velocity.x, target_velocity.x, acceleration * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, acceleration * delta)

	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity
	move_and_slide()
	_update_touch_hud()
	_animate_character(delta, input_vector.length())

func _animate_character(delta: float, input_amount: float) -> void:
	_animation_clock += delta * (12.0 if _sprinting else 8.0)
	var moving := input_amount > 0.08 and is_on_floor()
	var swing := sin(_animation_clock) * (0.62 if moving else 0.0)
	_visual_root.rotation.z = sin(_animation_clock) * 0.012 if moving else 0.0
	_visual_root.position.y = absf(sin(_animation_clock * 2.0)) * 0.045 if moving else move_toward(_visual_root.position.y, 0.0, delta * 0.2)
