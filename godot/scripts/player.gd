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

func _ready() -> void:
	_make_character()
	_make_camera()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _make_character() -> void:
	_visual_root = Node3D.new()
	_visual_root.name = "CharacterVisual"
	add_child(_visual_root)

	_add_capsule("Torso", Vector3(0, 1.12, 0), 0.34, 0.82, Color(0.075, 0.16, 0.24))
	_add_sphere("Head", Vector3(0, 1.91, 0), 0.235, Color(0.72, 0.54, 0.40))
	_add_box("Jacket", Vector3(0, 1.27, -0.015), Vector3(0.61, 0.54, 0.34), Color(0.10, 0.20, 0.29))
	_add_box("Belt", Vector3(0, 0.91, 0), Vector3(0.57, 0.10, 0.33), Color(0.075, 0.085, 0.09))
	_add_box("ChestPatch", Vector3(0.19, 1.43, -0.19), Vector3(0.13, 0.10, 0.025), Color(0.78, 0.64, 0.32))
	_left_arm = _add_limb("LeftArm", Vector3(-0.40, 1.28, 0), Color(0.10, 0.20, 0.29))
	_right_arm = _add_limb("RightArm", Vector3(0.40, 1.28, 0), Color(0.10, 0.20, 0.29))
	_left_leg = _add_limb("LeftLeg", Vector3(-0.17, 0.62, 0), Color(0.10, 0.12, 0.15))
	_right_leg = _add_limb("RightLeg", Vector3(0.17, 0.62, 0), Color(0.10, 0.12, 0.15))

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

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			var width := get_viewport().get_visible_rect().size.x
			if event.position.x < width * 0.48 and _move_finger == -1:
				_move_finger = event.index
				_move_touch = Vector2.ZERO
			elif _look_finger == -1:
				_look_finger = event.index
		else:
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

func _apply_look(delta: Vector2) -> void:
	rotate_y(-delta.x * look_sensitivity)
	_camera_pitch = clampf(_camera_pitch - delta.y * look_sensitivity, deg_to_rad(-48), deg_to_rad(28))
	_pivot.rotation.x = _camera_pitch

func _physics_process(delta: float) -> void:
	var input_vector := Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
	)
	if _move_finger != -1:
		input_vector = _move_touch
	input_vector = input_vector.limit_length(1.0)
	var local_direction := Vector3(input_vector.x, 0, input_vector.y)
	var direction := (transform.basis * local_direction).normalized()
	_sprinting = Input.is_action_pressed("run") and input_vector.length() > 0.1
	var target_speed := sprint_speed if _sprinting else walk_speed
	var target_velocity := direction * target_speed
	velocity.x = move_toward(velocity.x, target_velocity.x, acceleration * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, acceleration * delta)

	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity
	move_and_slide()
	_animate_character(delta, input_vector.length())

func _animate_character(delta: float, input_amount: float) -> void:
	_animation_clock += delta * (12.0 if _sprinting else 8.0)
	var moving := input_amount > 0.08 and is_on_floor()
	var swing := sin(_animation_clock) * (0.62 if moving else 0.0)
	_left_leg.rotation.x = swing
	_right_leg.rotation.x = -swing
	_left_arm.rotation.x = -swing * 0.72
	_right_arm.rotation.x = swing * 0.72
	_visual_root.position.y = absf(sin(_animation_clock * 2.0)) * 0.045 if moving else move_toward(_visual_root.position.y, 0.0, delta * 0.2)
