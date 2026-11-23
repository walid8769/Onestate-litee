extends CharacterBody3D

@export var walk_speed: float = 1.35
@export var outfit_color: Color = Color(0.16, 0.22, 0.29)
@export var faction_name := "CIVILIAN"
@export var patrol_points: Array[Vector3] = []

var _target_index := 1
var _clock := 0.0
var _current_speed := 0.0
var _pause_timer := 0.0
var _turn_speed := 5.5
var _visual_root: Node3D
var _left_leg: Node3D
var _right_leg: Node3D
var _left_arm: Node3D
var _right_arm: Node3D
var _character_animation: AnimationPlayer
var _active_character_animation := ""

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
	var character_scene := load("res://assets/models/realistic_character.glb") as PackedScene
	if character_scene != null:
		var character := character_scene.instantiate()
		character.name = "RealisticNPCCharacter"
		_visual_root.add_child(character)
		_character_animation = _find_animation_player(character)
		_play_npc_animation("idle")
	else:
		push_warning("Realistic character asset missing; NPC visual is unavailable.")
	_add_faction_tag()


func _find_animation_player(root: Node) -> AnimationPlayer:
	if root is AnimationPlayer:
		return root as AnimationPlayer
	for child in root.get_children():
		var found := _find_animation_player(child)
		if found != null:
			return found
	return null


func _play_npc_animation(requested: String) -> void:
	if _character_animation == null:
		return
	var wanted := requested.to_lower()
	for animation_name in _character_animation.get_animation_list():
		if String(animation_name).to_lower().contains(wanted):
			if _active_character_animation != animation_name:
				_character_animation.play(animation_name, 0.2)
				_active_character_animation = animation_name
			return


func _add_npc_appearance() -> void:
	var tone_seed: int = abs(hash(str(get_instance_id()))) % 5
	var skin_tones := [Color(0.88, 0.67, 0.49), Color(0.72, 0.48, 0.34), Color(0.55, 0.34, 0.23), Color(0.39, 0.25, 0.19), Color(0.94, 0.76, 0.60)]
	var skin := _npc_material(skin_tones[tone_seed], 0.76)
	var hair_color := Color(0.055, 0.045, 0.04) if faction_name != "ARMY" else Color(0.12, 0.13, 0.10)
	var hair := _npc_material(hair_color, 0.92)
	var eye := _npc_material(Color(0.91, 0.88, 0.79), 0.3)
	var dark := _npc_material(Color(0.035, 0.045, 0.055), 0.7)
	var uniform := outfit_color
	# Face, hairline, ears and eyes.
	_npc_sphere("HairCap", Vector3(0, 2.075, 0.012), Vector3(0.132, 0.064, 0.125), hair)
	for side in [-1.0, 1.0]:
		_npc_sphere("Ear", Vector3(side * 0.139, 1.94, 0), Vector3(0.026, 0.041, 0.024), skin)
		_npc_sphere("Eye", Vector3(side * 0.047, 1.985, -0.116), Vector3(0.020, 0.014, 0.010), eye)
	_npc_sphere("Nose", Vector3(0, 1.936, -0.132), Vector3(0.020, 0.029, 0.023), skin)
	# Department-specific protective equipment and recognizable uniform details.
	_npc_box("DutyBelt", Vector3(0, 1.035, -0.151), Vector3(0.39, 0.065, 0.31), dark)
	_npc_box("BeltBuckle", Vector3(0, 1.04, -0.177), Vector3(0.07, 0.05, 0.018), _npc_material(Color(0.67, 0.53, 0.28), 0.3, 0.62))
	if faction_name == "POLICE":
		_npc_box("BallisticVest", Vector3(0, 1.34, -0.145), Vector3(0.36, 0.43, 0.055), _npc_material(Color(0.055, 0.085, 0.12), 0.88))
		_npc_box("PoliceBadge", Vector3(-0.105, 1.48, -0.181), Vector3(0.055, 0.075, 0.012), _npc_material(Color(0.78, 0.63, 0.29), 0.28, 0.7))
		_npc_box("Radio", Vector3(0.17, 1.46, -0.17), Vector3(0.065, 0.13, 0.045), dark)
	elif faction_name == "ARMY":
		_npc_sphere("CombatHelmet", Vector3(0, 2.055, 0.015), Vector3(0.155, 0.085, 0.145), _npc_material(Color(0.24, 0.29, 0.20), 0.9))
		_npc_box("PlateCarrier", Vector3(0, 1.35, -0.15), Vector3(0.39, 0.42, 0.07), _npc_material(Color(0.23, 0.28, 0.19), 0.95))
		for side in [-1.0, 1.0]:
			_npc_box("AmmoPouch", Vector3(side * 0.17, 1.13, -0.18), Vector3(0.095, 0.13, 0.075), _npc_material(Color(0.17, 0.21, 0.15), 0.94))
	elif faction_name == "MEDICAL":
		_npc_box("MedicalChestPatch", Vector3(0.11, 1.48, -0.154), Vector3(0.105, 0.105, 0.014), _npc_material(Color(0.94, 0.94, 0.88), 0.55))
		_npc_box("MedicalCrossVertical", Vector3(0.11, 1.48, -0.166), Vector3(0.025, 0.075, 0.008), _npc_material(Color(0.78, 0.08, 0.08), 0.5))
		_npc_box("MedicalCrossHorizontal", Vector3(0.11, 1.48, -0.167), Vector3(0.075, 0.025, 0.008), _npc_material(Color(0.78, 0.08, 0.08), 0.5))
	else:
		_npc_box("JacketFront", Vector3(0, 1.36, -0.147), Vector3(0.32, 0.34, 0.025), _npc_material(uniform.darkened(0.12), 0.9))
		_npc_box("ClothingButton", Vector3(0, 1.38, -0.168), Vector3(0.018, 0.018, 0.012), _npc_material(Color(0.66, 0.58, 0.39), 0.35, 0.35))

func _npc_material(color: Color, roughness: float, metallic: float = 0.0) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	material.metallic = metallic
	material.specular = 0.48
	material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	if color.r > 0.35 and color.g > 0.20 and color.b < 0.55:
		material.subsurf_scatter_enabled = true
		material.subsurf_scatter_strength = 0.26
	return material

func _npc_sphere(label: String, at: Vector3, dimensions: Vector3, material: Material) -> void:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 16
	mesh.rings = 10
	node.mesh = mesh
	node.position = at
	node.scale = dimensions
	node.material_override = material
	_visual_root.add_child(node)

func _npc_box(label: String, at: Vector3, dimensions: Vector3, material: Material) -> void:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	node.mesh = mesh
	node.position = at
	node.material_override = material
	_visual_root.add_child(node)

func _add_faction_tag() -> void:
	var tag := Label3D.new()
	tag.name = "FactionNameplate"
	tag.text = faction_name
	tag.position = Vector3(0, 2.0, 0)
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
	if _pause_timer > 0.0:
		_pause_timer = maxf(0.0, _pause_timer - delta)
		_current_speed = move_toward(_current_speed, 0.0, walk_speed * 2.5 * delta)
		velocity.x = move_toward(velocity.x, 0.0, walk_speed * 2.5 * delta)
		velocity.z = move_toward(velocity.z, 0.0, walk_speed * 2.5 * delta)
	else:
		var offset := patrol_points[_target_index] - global_position
		offset.y = 0.0
		if offset.length() < 1.2:
			_target_index = (_target_index + 1) % patrol_points.size()
			_pause_timer = 0.45 if faction_name == "CIVILIAN" else 0.2
			offset = patrol_points[_target_index] - global_position
			offset.y = 0.0
		var direction := offset.normalized()
		_current_speed = move_toward(_current_speed, walk_speed, walk_speed * 2.0 * delta)
		velocity.x = direction.x * _current_speed
		velocity.z = direction.z * _current_speed
		if direction.length_squared() > 0.001:
			var target_rotation := atan2(-direction.x, -direction.z)
			rotation.y = lerp_angle(rotation.y, target_rotation, minf(1.0, _turn_speed * delta))
	if is_on_floor():
		velocity.y = -0.05
	else:
		velocity.y -= 22.0 * delta
	move_and_slide()
	_play_npc_animation("walk" if _current_speed > 0.12 else "idle")
	_clock += delta * (10.0 if _current_speed > walk_speed * 0.75 else 6.0)
	var movement_ratio := clampf(_current_speed / maxf(walk_speed, 0.01), 0.0, 1.0)
	var swing := sin(_clock) * 0.42 * movement_ratio
	_visual_root.position.y = absf(sin(_clock * 2.0)) * 0.035 if swing != 0.0 else move_toward(_visual_root.position.y, 0.0, delta * 0.12)
	_visual_root.rotation.z = sin(_clock) * 0.018 if swing != 0.0 else move_toward(_visual_root.rotation.z, 0.0, delta * 0.08)
	_visual_root.rotation.x = cos(_clock) * 0.012 if swing != 0.0 else move_toward(_visual_root.rotation.x, 0.0, delta * 0.08)
