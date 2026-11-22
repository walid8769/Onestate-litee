extends Node3D

const PLAYER_SCRIPT = preload("res://scripts/player.gd")

func _ready() -> void:
	_build_environment()
	_build_city_block()
	var player := CharacterBody3D.new()
	player.set_script(PLAYER_SCRIPT)
	player.name = "Player"
	player.position = Vector3(0, 1.2, 8)
	add_child(player)

func _build_environment() -> void:
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = Sky.new()
	environment.sky.sky_material = ProceduralSkyMaterial.new()
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.68, 0.73, 0.82)
	environment.ambient_light_energy = 0.65
	world.environment = environment
	add_child(world)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)

func _build_city_block() -> void:
	_make_box("Ground", Vector3(0, -0.25, 0), Vector3(180, 0.5, 180), Color(0.22, 0.28, 0.24))
	_make_box("MainRoad", Vector3(0, 0.015, 0), Vector3(12, 0.03, 180), Color(0.10, 0.11, 0.12))
	_make_box("CrossRoad", Vector3(0, 0.02, 0), Vector3(180, 0.04, 12), Color(0.10, 0.11, 0.12))
	for z in [-1, 1]:
		for x in [-1, 1]:
			_make_box("Sidewalk", Vector3(x * 8.2, 0.08, 0), Vector3(3.8, 0.16, 180), Color(0.48, 0.49, 0.47))
			_make_box("Sidewalk", Vector3(0, 0.08, z * 8.2), Vector3(180, 0.16, 3.8), Color(0.48, 0.49, 0.47))
	var colors := [Color(0.56,0.59,0.61), Color(0.68,0.62,0.52), Color(0.43,0.50,0.56), Color(0.62,0.64,0.60)]
	var positions := [
		Vector3(-25,0,-25), Vector3(25,0,-25), Vector3(-25,0,25), Vector3(25,0,25),
		Vector3(-52,0,-48), Vector3(52,0,-48), Vector3(-52,0,48), Vector3(52,0,48)
	]
	for i in range(positions.size()):
		var height := 12.0 + float((i * 7) % 4) * 5.0
		_make_building("Building_%02d" % i, positions[i], Vector3(18, height, 18), colors[i % colors.size()])

func _make_building(label: String, at: Vector3, dimensions: Vector3, color: Color) -> void:
	_make_box(label, at + Vector3(0, dimensions.y * 0.5, 0), dimensions, color)

func _make_box(label: String, at: Vector3, dimensions: Vector3, color: Color) -> void:
	var body := StaticBody3D.new()
	body.name = label
	body.position = at
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = dimensions
	mesh.mesh = box
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.88
	mesh.material_override = material
	body.add_child(mesh)
	var collider := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = dimensions
	collider.shape = shape
	body.add_child(collider)
	add_child(body)
