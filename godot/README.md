# OneState Litee — Godot prototype

This folder starts a **separate Godot 4 project** alongside the existing browser version. Nothing in the current web game is replaced.

## Open the project
Open Godot 4.4 or newer and import `godot/project.godot`.

## Current prototype
- Mobile renderer configuration.
- Procedural test block with roads, sidewalks and placeholder buildings.
- Third-person capsule controller and spring-arm camera.
- Touch input: drag on the left side to move; drag on the right side to rotate the camera.
- Keyboard fallback for desktop testing (movement actions still need binding in Project Settings > Input Map).

## Important
This is the first playable foundation, not a finished city or a signed iOS package. The placeholder buildings and player are intentionally simple. Next work is touch HUD/buttons, optimized modular city assets, faction facilities, vehicles, and multiplayer integration. Keep the existing web project intact while the Godot version is developed and tested separately.
