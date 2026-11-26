#!/usr/bin/env python3
"""Structural validator for the DeLorean Bedrock add-on."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "behavior_pack"
RP = ROOT / "resource_pack"
errors = []
checked = 0


def load_json(path):
    global checked
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        checked += 1
        return data
    except Exception as exc:
        errors.append(f"Invalid or unreadable JSON: {path.relative_to(ROOT)} ({exc})")
        return None


for pack in (BP, RP):
    if not pack.is_dir():
        errors.append(f"Missing pack directory: {pack.relative_to(ROOT)}")
        continue
    manifest = pack / "manifest.json"
    if not manifest.exists():
        errors.append(f"Missing manifest: {manifest.relative_to(ROOT)}")
    else:
        load_json(manifest)
    for path in pack.rglob("*.json"):
        if path != manifest:
            load_json(path)

# Collect named animation/controller resources for cross-file checks.
animation_names = set()
for path in (RP / "animations").rglob("*.json") if (RP / "animations").is_dir() else ():
    data = load_json(path)
    if isinstance(data, dict):
        animation_names.update(data.get("animations", {}).keys())

controller_names = set()
controller_files = (RP / "animation_controllers").rglob("*.json") if (RP / "animation_controllers").is_dir() else ()
for path in controller_files:
    data = load_json(path)
    if isinstance(data, dict):
        controller_names.update(data.get("animation_controllers", {}).keys())

# Verify the client entity's texture, geometry, animation aliases, and scripts.
client_entity_path = RP / "entity/delorean.entity.json"
client_entity = load_json(client_entity_path) if client_entity_path.exists() else None
if client_entity is None:
    errors.append(f"Missing client entity: {client_entity_path.relative_to(ROOT)}")
else:
    try:
        desc = client_entity["minecraft:client_entity"]["description"]
        for key, value in desc.get("textures", {}).items():
            texture_path = RP / (value + ".png")
            if not texture_path.exists():
                errors.append(f"Missing entity texture '{key}': {texture_path.relative_to(ROOT)}")

        geometry_id = desc.get("geometry", {}).get("default")
        geometry_path = RP / "models/entity/delorean.geo.json"
        if not geometry_path.exists():
            errors.append(f"Missing geometry file: {geometry_path.relative_to(ROOT)}")
        else:
            geometry = load_json(geometry_path)
            if geometry_id and geometry:
                identifiers = {
                    model.get("description", {}).get("identifier")
                    for model in geometry.get("minecraft:geometry", [])
                }
                if geometry_id not in identifiers:
                    errors.append(f"Client entity geometry '{geometry_id}' not found in {geometry_path.relative_to(ROOT)}")

        aliases = desc.get("animations", {})
        animate_list = desc.get("scripts", {}).get("animate", [])
        for alias in animate_list:
            resource = aliases.get(alias)
            if not resource:
                errors.append(f"scripts.animate references missing animation alias '{alias}'")
                continue
            if resource.startswith("controller.animation.") and resource not in controller_names:
                errors.append(f"Missing animation controller resource: {resource}")
            elif resource.startswith("animation.") and resource not in animation_names:
                errors.append(f"Missing animation resource: {resource}")

        # Controller states must use aliases declared by the client entity or valid resources.
        for controller_path in (RP / "animation_controllers").rglob("*.json") if (RP / "animation_controllers").is_dir() else ():
            controller_data = load_json(controller_path)
            for controller in controller_data.get("animation_controllers", {}).values() if isinstance(controller_data, dict) else ():
                for state in controller.get("states", {}).values():
                    for entry in state.get("animations", []):
                        animation_alias = entry if isinstance(entry, str) else next(iter(entry), None) if isinstance(entry, dict) else None
                        resource = aliases.get(animation_alias)
                        if resource is None and isinstance(animation_alias, str) and animation_alias.startswith(("animation.", "controller.animation.")):
                            resource = animation_alias
                        if resource is None:
                            errors.append(f"Unknown animation alias in controller state: {animation_alias}")
                        elif resource.startswith("animation.") and resource not in animation_names:
                            errors.append(f"Missing animation in controller state: {resource}")
                        elif resource.startswith("controller.animation.") and resource not in controller_names:
                            errors.append(f"Missing nested controller in controller state: {resource}")
    except Exception as exc:
        errors.append(f"Could not inspect client entity animation/geometry references: {exc}")

# Check all item-atlas texture paths.
atlas_path = RP / "textures/item_texture.json"
if atlas_path.exists():
    atlas = load_json(atlas_path)
    if isinstance(atlas, dict):
        for key, entry in atlas.get("texture_data", {}).items():
            value = entry.get("textures")
            candidates = value if isinstance(value, list) else [value]
            for candidate in candidates:
                if candidate and not (RP / (candidate + ".png")).exists():
                    errors.append(f"Missing item atlas texture '{key}': resource_pack/{candidate}.png")

print(f"JSON documents parsed: {checked}")
if errors:
    print("Validation: FAILED")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("Validation: PASSED (JSON, texture, geometry, and animation-reference checks)")
