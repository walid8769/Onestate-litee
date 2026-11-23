# OneState Litee — Godot iOS prototype

This is a separate native Godot 4.4.1 project. The existing browser game remains untouched.

## Open the project
Open Godot 4.4.1 or newer and import `godot/project.godot`.

## Current prototype
- Landscape mobile viewport with the Godot mobile renderer.
- Procedural city block with roads, sidewalks, buildings, street furniture and five department facilities.
- World-owned third-person follow camera, initialized before procedural scene construction.
- Touch joystick, look drag, sprint and interaction controls.
- Keyboard fallback: WASD / arrow keys, Shift to sprint, Space to jump.
- Patrol NPCs for police, army, medical and civilian roles.
- Driveable service SUV and basic department mission points.
- Core scenes, scripts and model assets are bundled into the exported app.

## Build
The iOS workflow imports the project, runs a headless scene-start smoke test, exports an unsigned ARM64 iPhone app, packages the IPA and verifies its archive structure. The IPA still needs to be signed with a compatible certificate and provisioning profile before installation.

## Scope and limitations
This is a playable prototype foundation, not a finished OneState-scale open-world game. Character meshes and city architecture are original low-poly/blockout assets; characters do not yet use a full skeletal animation rig. Online multiplayer, account services, persistent economy and production-grade city assets are not implemented yet.