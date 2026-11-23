extends CharacterBody3D

@export var walk_speed: float = 1.35
@export var outfit_color: Color = Color(0.16, 0.22, 0.29)
@export var patrol_points: Array[Vector3] = []

var _target_index := 1
var _clock := 0.0
var _visual_root: Node3D
var _left_leg: Node3D
var _right_leg: Node3D
var _left_arm: Node3D
var _right_arm: Node3D

func _ready() -> void:
	_build_person()
	_build_collision()
	if patrol_points.size() > 0:
		global_position = patrol_points[0]
	_target_index = 1 if patrol_points.size() > 1 else 0

func _build_person() -> void:
	_visual_root = Node3D.new()
	_visual_root.name = "NPCVisual"
	add_child(_visual_root)
	_add_box("Jacket", Vector3(0, 1.23, 0), Vector3(0.52, 0.62, 0.30), outfit_color)
	_add_box("ShoulderLine", Vector3(0, 1.48, 0), Vector3(0.58, 0.13, 0.32), outfit_color.darkened(0.12))
	_add_sphere("Head", Vector3(0, 1.88, 0), 0.19, Color(0.67, 0.49, 0.36))
	_add_sphere("Hair", Vector3(0, 2.02, 0.015), 0.19, Color(0.12, 0.085, 0.06))
	_add_box("Belt", Vector3(0, 0.91, 0), Vector3(0.48, 0.10, 0.29), Color(0.08, 0.085, 0.09))
	_left_arm = _make_limb("LeftArm", Vector3(-0.34, 1.30, 0), outfit_color, 0.085)
	_right_arm = _make_limb("RightArm", Vector3(0.34, 1.30, 0), outfit_color, 0.085)
	_left_leg = _make_limb("LeftLeg", Vector3(-0.14, 0.66, 0), Color(0.10, 0.12, 0.15), 0.095)
	_right_leg = _make_limb("RightLeg", Vector3(0.14, 0.66, 0), Color(0.10, 0.12, 0.15), 0.095)

func _build_collision() -> void:
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.27
	capsule.height = 1.9
	collision.shape = capsule
	collision.position.y = 0.95
	add_child(collision)

func _make_limb(label: String, at: Vector3, color: Color, radius: float) -> Node3D:
	var pivot := Node3D.new()
	pivot.name = label
	pivot.position = at
	_visual_root.add_child(pivot)
	var mesh_node := MeshInstance3D.new()
	var capsule := CapsuleMesh.new()
	capsule.radius = radius
	capsule.height = 0.68
	mesh_node.mesh = capsule
	mesh_node.position.y = -0.22
	mesh_node.material_override = _material(color)
	pivot.add_child(mesh_node)
	return pivot

func _add_box(label: String, at: Vector3, dimensions: Vector3, color: Color) -> void:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color)
	_visual_root.add_child(node)

func _add_sphere(label: String, at: Vector3, radius: float, color: Color) -> void:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color)
	_visual_root.add_child(node)

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.78
	return material

func _physics_process(delta: float) -> void:
	if patrol_points.size() < 2:
		velocity = Vector3.ZERO
		return
	var offset := patrol_points[_target_index] - global_position
	offset.y = 0.0
	if offset.length() < 1.0:
		_target_index = (_target_index + 1) % patrol_points.size()
		offset = patrol_points[_target_index] - global_position
		offset.y = 0.0
	var direction := offset.normalized()
	velocity.x = direction.x * walk_speed
	velocity.z = direction.z * walk_speed
	if is_on_floor():
		velocity.y = -0.05
	else:
		velocity.y -= 22.0 * delta
	move_and_slide()
	if direction.length_squared() > 0.001:
		look_at(global_position + direction, Vector3.UP)
	_clock += delta * 7.0
	var swing := sin(_clock) * 0.42 if Vector2(velocity.x, velocity.z).length() > 0.1 else 0.0
	_left_leg.rotation.x = swing
	_right_leg.rotation.x = -swing
	_left_arm.rotation.x = -swing * 0.65
	_right_arm.rotation.x = swing * 0.65
