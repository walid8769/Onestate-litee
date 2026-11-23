extends Node3D

@export var department := "CITY SERVICES"
@export var role_id := "CIVILIAN"
@export var mission_title := "CITY TASK"
@export var mission_description := "Complete the assigned city task."
@export var destination := Vector3.ZERO
@export var reward := 250

var _pulse := 0.0
var _marker: MeshInstance3D

func _ready() -> void:
	add_to_group("city_interactable")
	var pedestal := MeshInstance3D.new()
	var base := CylinderMesh.new()
	base.top_radius = 0.72
	base.bottom_radius = 0.9
	base.height = 0.22
	pedestal.mesh = base
	pedestal.position.y = 0.12
	var base_material := StandardMaterial3D.new()
	base_material.albedo_color = Color(0.055, 0.075, 0.095)
	base_material.roughness = 0.42
	pedestal.material_override = base_material
	add_child(pedestal)

	_marker = MeshInstance3D.new()
	var orb := SphereMesh.new()
	orb.radius = 0.34
	orb.height = 0.68
	_marker.mesh = orb
	_marker.position.y = 1.05
	var glow := StandardMaterial3D.new()
	glow.albedo_color = Color(0.88, 0.68, 0.27)
	glow.emission_enabled = true
	glow.emission = Color(0.88, 0.52, 0.12)
	glow.emission_energy_multiplier = 1.4
	_marker.material_override = glow
	add_child(_marker)

	var sign := Label3D.new()
	sign.text = department + "\nINTERACT"
	sign.position.y = 2.0
	sign.font_size = 30
	sign.pixel_size = 0.006
	sign.outline_size = 6
	sign.modulate = Color(0.94, 0.83, 0.58)
	add_child(sign)

func _process(delta: float) -> void:
	_pulse += delta
	if _marker != null:
		_marker.position.y = 1.05 + sin(_pulse * 2.2) * 0.10
		_marker.rotation.y += delta * 0.65

func interact(player: Node) -> void:
	if player != null and player.has_method("start_city_job"):
		player.call("start_city_job", role_id, mission_title, mission_description, destination, reward)
