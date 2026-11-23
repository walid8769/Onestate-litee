extends CharacterBody3D

@export var max_speed := 25.0
@export var reverse_speed := 9.0
@export var acceleration := 13.0
@export var braking := 22.0
@export var steering_rate := 1.45

var _driver: CharacterBody3D
var _current_speed := 0.0
var _visual: Node3D
var _wheel_visuals: Array[Node3D] = []
var _steering_wheels: Array[Node3D] = []

func _ready() -> void:
	add_to_group("driveable_vehicle")
	_visual = get_node_or_null("VehicleVisual")
	if _visual != null:
		_collect_vehicle_parts(_visual)


func _collect_vehicle_parts(root: Node) -> void:
	for child in root.get_children():
		var node_name := child.name.to_lower()
		if node_name.contains("wheel_fl") or node_name.contains("wheel_fr") or node_name.contains("wheel_rl") or node_name.contains("wheel_rr"):
			_wheel_visuals.append(child as Node3D)
		elif node_name.contains("steering_wheel"):
			_steering_wheels.append(child as Node3D)
		_collect_vehicle_parts(child)


func enter_vehicle(player: CharacterBody3D) -> void:
	_driver = player
	_current_speed = 0.0

func exit_vehicle() -> void:
	_driver = null
	_current_speed = 0.0
	velocity = Vector3.ZERO

func has_driver() -> bool:
	return _driver != null

func _physics_process(delta: float) -> void:
	if _driver == null:
		_current_speed = move_toward(_current_speed, 0.0, braking * 0.25 * delta)
		return

	var controls: Dictionary = _driver.call("get_vehicle_control_state")
	var throttle: float = float(controls.get("throttle", 0.0))
	var steer: float = float(controls.get("steer", 0.0))
	var target_speed := throttle * (max_speed if throttle >= 0.0 else reverse_speed)
	var rate := acceleration if absf(throttle) > 0.01 else braking
	_current_speed = move_toward(_current_speed, target_speed, rate * delta)

	var speed_factor := clampf(absf(_current_speed) / max_speed, 0.12, 1.0)
	if absf(_current_speed) > 0.15:
		rotate_y(steer * steering_rate * speed_factor * signf(_current_speed) * delta)

	velocity = -global_transform.basis.z * _current_speed
	if not is_on_floor():
		velocity.y -= 22.0 * delta
	else:
		velocity.y = -0.05
	move_and_slide()
	var wheel_spin := -_current_speed * delta / 0.37
	for wheel in _wheel_visuals:
		wheel.rotate_x(wheel_spin)
	for steering_wheel in _steering_wheels:
		steering_wheel.rotation.y = steer * 0.42

	if is_instance_valid(_driver):
		_driver.global_position = global_position + Vector3(0.0, 0.95, 0.0)
		_driver.global_rotation.y = global_rotation.y
		if _visual != null:
			_visual.rotation.z = lerpf(_visual.rotation.z, -steer * 0.035 * clampf(absf(_current_speed) / max_speed, 0.0, 1.0), delta * 4.0)
