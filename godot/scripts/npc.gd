extends CharacterBody3D

@export var walk_speed: float = 1.35
@export var outfit_color: Color = Color(0.16, 0.22, 0.29)
@export var faction_name := "CIVILIAN"
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
	var model_path := "res://assets/models/civilian_character.obj"
	if outfit_color.b > outfit_color.r * 1.18 and outfit_color.b > outfit_color.g * 0.95:
		model_path = "res://assets/models/police_character.obj"
	elif outfit_color.g > outfit_color.r * 1.05 and outfit_color.g > outfit_color.b * 0.88:
		model_path = "res://assets/models/military_character.obj"
	var model := MeshInstance3D.new()
	model.name = "DetailedCharacterModel"
	model.mesh = load(model_path) as Mesh
	if model.mesh != null:
		for surface in range(model.mesh.get_surface_count()):
			var source_material := model.mesh.surface_get_material(surface)
			if source_material is BaseMaterial3D:
				var two_sided := source_material.duplicate() as BaseMaterial3D
				two_sided.cull_mode = BaseMaterial3D.CULL_DISABLED
				model.set_surface_override_material(surface, two_sided)
	_visual_root.add_child(model)
	_add_faction_tag()

func _add_faction_tag() -> void:
	var tag := Label3D.new()
	tag.name = "FactionNameplate"
	tag.text = faction_name
	tag.position = Vector3(0, 2.25, 0)
	tag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	tag.font_size = 28
	tag.pixel_size = 0.006
	tag.outline_size = 7
	tag.modulate = Color(0.45, 0.78, 1.0) if faction_name == "POLICE" else Color(0.72, 0.82, 0.55) if faction_name == "ARMY" else Color(0.55, 0.92, 0.78) if faction_name == "MEDICAL" else Color(0.94, 0.94, 0.90)
	_visual_root.add_child(tag)

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
	_visual_root.position.y = absf(sin(_clock * 2.0)) * 0.035 if swing != 0.0 else move_toward(_visual_root.position.y, 0.0, delta * 0.12)
	_visual_root.rotation.z = sin(_clock) * 0.018 if swing != 0.0 else move_toward(_visual_root.rotation.z, 0.0, delta * 0.08)
	_visual_root.rotation.x = cos(_clock) * 0.012 if swing != 0.0 else move_toward(_visual_root.rotation.x, 0.0, delta * 0.08)
	_visual_root.rotation.z = sin(_clock) * 0.012 if swing != 0.0 else 0.0
