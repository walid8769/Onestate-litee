extends Node3D

const PLAYER_SCRIPT = preload("res://scripts/player.gd")
const NPC_SCRIPT = preload("res://scripts/npc.gd")

func _ready() -> void:
	_build_environment()
	_build_city()
	_spawn_npcs()
	_build_hud()
	var player := CharacterBody3D.new()
	player.set_script(PLAYER_SCRIPT)
	player.name = "Player"
	player.position = Vector3(0, 1.2, 18)
	add_child(player)


func _spawn_npcs() -> void:
	_spawn_npc([Vector3(-8.7, 0, -34), Vector3(-8.7, 0, 34)], Color(0.18, 0.23, 0.29), 1.25)
	_spawn_npc([Vector3(8.7, 0, 34), Vector3(8.7, 0, -34)], Color(0.42, 0.25, 0.17), 1.35)
	_spawn_npc([Vector3(-34, 0, -8.7), Vector3(34, 0, -8.7)], Color(0.25, 0.32, 0.20), 1.15)
	_spawn_npc([Vector3(34, 0, 8.7), Vector3(-34, 0, 8.7)], Color(0.30, 0.18, 0.24), 1.30)
	_spawn_npc([Vector3(-61, 0, -91), Vector3(-61, 0, -61)], Color(0.08, 0.14, 0.22), 1.20)
	_spawn_npc([Vector3(92, 0, -91), Vector3(92, 0, -61)], Color(0.78, 0.79, 0.76), 1.10)
	_spawn_npc([Vector3(-92, 0, 61), Vector3(-92, 0, 91)], Color(0.28, 0.34, 0.22), 1.15)

func _spawn_npc(route: Array[Vector3], outfit: Color, speed: float) -> void:
	var npc := NPC_SCRIPT.new() as CharacterBody3D
	npc.set("patrol_points", route)
	npc.set("outfit_color", outfit)
	npc.set("walk_speed", speed)
	npc.position = route[0]
	add_child(npc)

func _build_environment() -> void:
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color(0.12, 0.25, 0.43)
	sky_material.sky_horizon_color = Color(0.72, 0.79, 0.84)
	sky_material.ground_bottom_color = Color(0.12, 0.14, 0.16)
	sky_material.ground_horizon_color = Color(0.48, 0.53, 0.56)
	environment.sky.sky_material = sky_material
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.68, 0.75, 0.86)
	environment.ambient_light_energy = 0.8
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world.environment = environment
	add_child(world)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 110.0
	add_child(sun)

func _build_city() -> void:
	_make_visual_box("Ground", Vector3(0, -0.3, 0), Vector3(220, 0.5, 220), Color(0.19, 0.25, 0.21))
	_make_static_box("GroundCollision", Vector3(0, -0.3, 0), Vector3(220, 0.5, 220))
	_make_visual_box("MainRoad", Vector3(0, 0.01, 0), Vector3(13, 0.08, 210), Color(0.075, 0.085, 0.095))
	_make_visual_box("CrossRoad", Vector3(0, 0.02, 0), Vector3(210, 0.08, 13), Color(0.075, 0.085, 0.095))

	for side in [-1.0, 1.0]:
		_make_visual_box("Sidewalk", Vector3(side * 8.7, 0.12, 0), Vector3(4.2, 0.24, 210), Color(0.48, 0.50, 0.49))
		_make_visual_box("Sidewalk", Vector3(0, 0.12, side * 8.7), Vector3(210, 0.24, 4.2), Color(0.48, 0.50, 0.49))

	for z in range(-95, 100, 12):
		_make_visual_box("LaneDash", Vector3(0, 0.07, float(z)), Vector3(0.16, 0.025, 5.2), Color(0.88, 0.82, 0.58))
	for x in range(-95, 100, 12):
		_make_visual_box("LaneDash", Vector3(float(x), 0.075, 0), Vector3(5.2, 0.025, 0.16), Color(0.88, 0.82, 0.58))

	var building_positions := [
		Vector3(-27, 0, -28), Vector3(27, 0, -28), Vector3(-27, 0, 28), Vector3(27, 0, 28),
		Vector3(-58, 0, -52), Vector3(58, 0, -52), Vector3(-58, 0, 52), Vector3(58, 0, 52),
		Vector3(-88, 0, -28), Vector3(88, 0, -28), Vector3(-88, 0, 28), Vector3(88, 0, 28)
	]
	var palettes := [Color(0.48, 0.53, 0.57), Color(0.64, 0.59, 0.50), Color(0.38, 0.46, 0.52), Color(0.66, 0.67, 0.63)]
	for i in range(building_positions.size()):
		var height := 15.0 + float((i * 7) % 5) * 5.0
		_make_building("CityBuilding_%02d" % i, building_positions[i], Vector3(17, height, 17), palettes[i % palettes.size()], i)

	# Secondary avenues connect the residential blocks to the city center.
	for avenue in [-45.0, 45.0]:
		_make_visual_box("NorthSouthAvenue", Vector3(avenue, 0.015, 0), Vector3(9.0, 0.07, 210), Color(0.085, 0.095, 0.105))
		_make_visual_box("EastWestAvenue", Vector3(0, 0.02, avenue), Vector3(210, 0.07, 9.0), Color(0.085, 0.095, 0.105))
		for offset in range(-90, 100, 15):
			_make_visual_box("AvenueDash", Vector3(avenue, 0.07, float(offset)), Vector3(0.12, 0.025, 5.5), Color(0.88, 0.82, 0.58))
			_make_visual_box("AvenueDash", Vector3(float(offset), 0.075, avenue), Vector3(5.5, 0.025, 0.12), Color(0.88, 0.82, 0.58))

	for z in range(-84, 90, 28):
		_make_streetlight(Vector3(-11.2, 0, float(z)))
		_make_streetlight(Vector3(11.2, 0, float(z)))
	for x in range(-84, 90, 28):
		_make_tree(Vector3(float(x), 0, -11.5))
		_make_tree(Vector3(float(x), 0, 11.5))

	# Distinct civic and emergency-service buildings give the city recognizable destinations.
	_make_facility("POLICE DEPARTMENT", Vector3(-76, 0, -76), Vector3(25, 13, 22), Color(0.12, 0.20, 0.29), Color(0.28, 0.58, 0.88))
	_make_facility("CITY HOSPITAL", Vector3(76, 0, -76), Vector3(27, 15, 23), Color(0.78, 0.80, 0.78), Color(0.80, 0.20, 0.20))
	_make_facility("ARMY BASE", Vector3(-76, 0, 76), Vector3(27, 12, 23), Color(0.30, 0.36, 0.27), Color(0.72, 0.68, 0.48))
	_make_facility("CITY HALL", Vector3(76, 0, 76), Vector3(25, 14, 22), Color(0.55, 0.49, 0.39), Color(0.84, 0.72, 0.43))
	_make_facility("FEDERAL BUREAU", Vector3(0, 0, -78), Vector3(28, 16, 22), Color(0.19, 0.23, 0.29), Color(0.76, 0.78, 0.82))
	_make_parked_vehicle(Vector3(-77, 0, -98), Color(0.055, 0.09, 0.15), true)
	_make_parked_vehicle(Vector3(76, 0, -99), Color(0.86, 0.86, 0.82), false)
	_make_parked_vehicle(Vector3(-76, 0, 99), Color(0.30, 0.34, 0.27), false)

func _make_facility(label: String, at: Vector3, dimensions: Vector3, color: Color, accent: Color) -> void:
	var center := at + Vector3(0, dimensions.y * 0.5, 0)
	_make_visual_box(label.replace(" ", "_"), center, dimensions, color)
	_make_static_box(label.replace(" ", "_") + "_Collision", center, dimensions)
	_make_visual_box("FacilityRoof", at + Vector3(0, dimensions.y + 0.2, 0), Vector3(dimensions.x + 0.8, 0.4, dimensions.z + 0.8), color.darkened(0.25))
	_make_visual_box("FacilityEntrance", at + Vector3(0, 1.35, -dimensions.z * 0.505), Vector3(3.4, 2.7, 0.18), Color(0.075, 0.09, 0.11))
	_make_visual_box("FacilityCanopy", at + Vector3(0, 2.9, -dimensions.z * 0.58), Vector3(7.0, 0.32, 2.2), accent)
	for column in range(5):
		var window_x := at.x - dimensions.x * 0.38 + float(column) * dimensions.x * 0.19
		_make_visual_box("FacilityWindow", Vector3(window_x, dimensions.y * 0.62, at.z - dimensions.z * 0.505), Vector3(2.5, 2.2, 0.08), Color(0.10, 0.20, 0.28))
	var sign := Label3D.new()
	sign.name = "FacilitySign"
	sign.text = label
	sign.font_size = 42
	sign.outline_size = 8
	sign.modulate = accent
	sign.position = at + Vector3(0, dimensions.y + 2.1, -dimensions.z * 0.54)
	sign.pixel_size = 0.008
	add_child(sign)
	# Marked visitor parking in front of each facility.
	for slot in range(4):
		var px := at.x - 7.5 + float(slot) * 5.0
		_make_visual_box("ParkingBayLine", Vector3(px, 0.075, at.z - dimensions.z * 0.5 - 7.0), Vector3(0.12, 0.025, 6.0), Color(0.82, 0.85, 0.84))

func _make_building(label: String, at: Vector3, dimensions: Vector3, color: Color, variant: int) -> void:
	_make_visual_box(label, at + Vector3(0, dimensions.y * 0.5, 0), dimensions, color)
	_make_static_box(label + "_Collision", at + Vector3(0, dimensions.y * 0.5, 0), dimensions)
	_make_visual_box(label + "_Roof", at + Vector3(0, dimensions.y + 0.18, 0), Vector3(dimensions.x + 0.7, 0.36, dimensions.z + 0.7), color.darkened(0.28))
	var floors := int(dimensions.y / 3.2)
	for floor_index in range(floors):
		for column in range(3):
			var wx := at.x - dimensions.x * 0.32 + float(column) * dimensions.x * 0.32
			var wy := at.y + 2.0 + float(floor_index) * 3.1
			var window_color := Color(0.12, 0.22, 0.29) if (floor_index + column + variant) % 4 != 0 else Color(0.78, 0.66, 0.39)
			_make_visual_box("FacadeWindow", Vector3(wx, wy, at.z - dimensions.z * 0.505), Vector3(2.1, 1.45, 0.08), window_color)
			_make_visual_box("FacadeWindow", Vector3(wx, wy, at.z + dimensions.z * 0.505), Vector3(2.1, 1.45, 0.08), window_color)
		for side in [-1.0, 1.0]:
			var wz := at.z - dimensions.z * 0.32 + float(floor_index % 3) * dimensions.z * 0.32
			_make_visual_box("SideFacadeWindow", Vector3(at.x + side * dimensions.x * 0.505, wy, wz), Vector3(0.08, 1.45, 2.1), Color(0.12, 0.22, 0.29))
	_make_visual_box(label + "_Entrance", Vector3(at.x, 1.15, at.z - dimensions.z * 0.512), Vector3(2.0, 2.3, 0.1), Color(0.10, 0.15, 0.19))


func _make_parked_vehicle(at: Vector3, paint: Color, police_lights: bool) -> void:
	var body := MeshInstance3D.new()
	body.name = "ParkedVehicleBody"
	var body_mesh := BoxMesh.new()
	body_mesh.size = Vector3(2.0, 0.72, 4.0)
	body.mesh = body_mesh
	body.position = at + Vector3(0, 0.78, 0)
	var paint_material := StandardMaterial3D.new()
	paint_material.albedo_color = paint
	paint_material.metallic = 0.28
	paint_material.roughness = 0.38
	body.material_override = paint_material
	add_child(body)
	_make_visual_box("VehicleCabin", at + Vector3(0, 1.38, -0.12), Vector3(1.68, 0.72, 2.05), paint.darkened(0.12))
	_make_visual_box("VehicleWindshield", at + Vector3(0, 1.43, -1.17), Vector3(1.48, 0.52, 0.06), Color(0.10, 0.19, 0.25))
	_make_visual_box("VehicleRearGlass", at + Vector3(0, 1.43, 0.94), Vector3(1.48, 0.52, 0.06), Color(0.10, 0.19, 0.25))
	for side in [-1.0, 1.0]:
		_make_visual_box("VehicleSideGlass", at + Vector3(side * 0.86, 1.43, -0.12), Vector3(0.05, 0.48, 1.75), Color(0.10, 0.19, 0.25))
		for axle in [-1.0, 1.0]:
			var wheel := MeshInstance3D.new()
			var wheel_mesh := CylinderMesh.new()
			wheel_mesh.top_radius = 0.36
			wheel_mesh.bottom_radius = 0.36
			wheel_mesh.height = 0.22
			wheel.mesh = wheel_mesh
			wheel.rotation.z = PI * 0.5
			wheel.position = at + Vector3(side * 1.02, 0.39, axle * 1.28)
			wheel.material_override = _simple_material(Color(0.035, 0.04, 0.045))
			add_child(wheel)
	if police_lights:
		_make_visual_box("PoliceLightbar", at + Vector3(0, 1.82, -0.12), Vector3(0.95, 0.16, 0.28), Color(0.12, 0.35, 0.92))
		_make_visual_box("PoliceLightRed", at + Vector3(-0.27, 1.93, -0.12), Vector3(0.35, 0.12, 0.25), Color(0.88, 0.12, 0.10))
		_make_visual_box("PoliceLightBlue", at + Vector3(0.27, 1.93, -0.12), Vector3(0.35, 0.12, 0.25), Color(0.10, 0.28, 0.92))

func _simple_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.92
	return material

func _make_streetlight(at: Vector3) -> void:
	_make_visual_box("LampPost", at + Vector3(0, 3.0, 0), Vector3(0.13, 6.0, 0.13), Color(0.12, 0.14, 0.16))
	_make_visual_box("LampArm", at + Vector3(0.55, 5.8, 0), Vector3(1.2, 0.12, 0.12), Color(0.12, 0.14, 0.16))
	_make_visual_box("LampHead", at + Vector3(1.0, 5.68, 0), Vector3(0.65, 0.16, 0.38), Color(0.92, 0.82, 0.58))

func _make_tree(at: Vector3) -> void:
	_make_visual_box("TreeTrunk", at + Vector3(0, 1.2, 0), Vector3(0.42, 2.4, 0.42), Color(0.27, 0.18, 0.12))
	var crown := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 1.6
	sphere.height = 3.2
	crown.mesh = sphere
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.13, 0.32, 0.19)
	material.roughness = 1.0
	crown.material_override = material
	crown.position = at + Vector3(0, 3.0, 0)
	add_child(crown)

func _make_visual_box(label: String, at: Vector3, dimensions: Vector3, color: Color) -> void:
	var mesh := MeshInstance3D.new()
	mesh.name = label
	var box := BoxMesh.new()
	box.size = dimensions
	mesh.mesh = box
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.82
	mesh.material_override = material
	mesh.position = at
	add_child(mesh)

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	layer.name = "GameHUD"
	add_child(layer)
	var panel := ColorRect.new()
	panel.position = Vector2(22, 18)
	panel.size = Vector2(250, 66)
	panel.color = Color(0.035, 0.055, 0.075, 0.78)
	layer.add_child(panel)
	var title := Label.new()
	title.text = "ONESTATE  |  LITEE"
	title.position = Vector2(38, 25)
	title.add_theme_font_size_override("font_size", 21)
	title.add_theme_color_override("font_color", Color(0.91, 0.79, 0.49))
	layer.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "CITY ROLEPLAY  •  DEVELOPMENT BUILD"
	subtitle.position = Vector2(39, 53)
	subtitle.add_theme_font_size_override("font_size", 10)
	subtitle.add_theme_color_override("font_color", Color(0.82, 0.87, 0.91))
	layer.add_child(subtitle)

func _make_static_box(label: String, at: Vector3, dimensions: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = label
	body.position = at
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = dimensions
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
