extends CharacterBody3D

@export var move_speed := 6.0
@export var run_multiplier := 1.65
@export var look_sensitivity := 0.004
@export var gravity := 22.0

var _touch_move := Vector2.ZERO
var _move_finger := -1
var _look_finger := -1
var _last_look := Vector2.ZERO
var _camera_pitch := deg_to_rad(-12.0)
var _camera: Camera3D
var _run_touch := false

func _ready() -> void:
	_make_character()
	_make_camera()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _make_character() -> void:
	var capsule := CapsuleMesh.new()
	capsule.radius = 0.42
	capsule.height = 1.8
	var visual := MeshInstance3D.new()
	visual.mesh = capsule
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.18, 0.32, 0.48)
	visual.material_override = material
	visual.position.y = 0.9
	add_child(visual)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.42
	shape.height = 1.8
	collision.shape = shape
	collision.position.y = 0.9
	add_child(collision)

func _make_camera() -> void:
	var pivot := Node3D.new()
	pivot.name = "CameraPivot"
	pivot.position.y = 1.5
	add_child(pivot)
	var spring := SpringArm3D.new()
	spring.spring_length = 5.5
	spring.margin = 0.25
	pivot.add_child(spring)
	_camera = Camera3D.new()
	_camera.current = true
	_camera.fov = 72
	spring.add_child(_camera)
	pivot.rotation.x = _camera_pitch

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_apply_look(event.relative)
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x < get_viewport().get_visible_rect().size.x * 0.48 and _move_finger == -1:
				_move_finger = event.index
				_touch_move = Vector2.ZERO
			elif _look_finger == -1:
				_look_finger = event.index
				_last_look = event.position
		else:
			if event.index == _move_finger:
				_move_finger = -1
				_touch_move = Vector2.ZERO
			if event.index == _look_finger:
				_look_finger = -1
	elif event is InputEventScreenDrag:
		if event.index == _move_finger:
			var size := get_viewport().get_visible_rect().size
			var center := Vector2(size.x * 0.22, size.y * 0.78)
			_touch_move = ((event.position - center) / 105.0).limit_length(1.0)
		elif event.index == _look_finger:
			_apply_look(event.relative)

func _apply_look(delta: Vector2) -> void:
	rotate_y(-delta.x * look_sensitivity)
	_camera_pitch = clampf(_camera_pitch - delta.y * look_sensitivity, deg_to_rad(-65), deg_to_rad(35))
	var pivot := get_node_or_null("CameraPivot") as Node3D
	if pivot:
		pivot.rotation.x = _camera_pitch

func _physics_process(delta: float) -> void:
	var input_vector := Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
	)
	if _move_finger != -1:
		input_vector = _touch_move
	input_vector = input_vector.limit_length(1.0)
	var direction := (transform.basis * Vector3(input_vector.x, 0, input_vector.y)).normalized()
	var speed := move_speed * (run_multiplier if Input.is_action_pressed("run") or _run_touch else 1.0)
	velocity.x = direction.x * speed
	velocity.z = direction.z * speed
	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = 7.0
	move_and_slide()
