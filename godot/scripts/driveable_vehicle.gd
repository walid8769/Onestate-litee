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

func _ready() -> void:
	add_to_group("driveable_vehicle")
	_visual = get_node_or_null("VehicleVisual")

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

	if is_instance_valid(_driver):
		_driver.global_position = global_position + Vector3(0.0, 0.95, 0.0)
		_driver.global_rotation.y = global_rotation.y
		if _visual != null:
			_visual.rotation.z = lerpf(_visual.rotation.z, -steer * 0.035 * clampf(absf(_current_speed) / max_speed, 0.0, 1.0), delta * 4.0)
