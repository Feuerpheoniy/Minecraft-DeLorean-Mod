#!/usr/bin/env python3
"""Basic structural validator for this Bedrock add-on repository."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PACKS = (ROOT / "behavior_pack", ROOT / "resource_pack")
errors = []
checked = 0

def load_json(path):
    global checked
    try:
        json.loads(path.read_text(encoding="utf-8"))
        checked += 1
    except Exception as exc:
        errors.append(f"Invalid JSON: {path.relative_to(ROOT)} ({exc})")

for pack in PACKS:
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

# Check RP texture paths used by client entity and item atlas.
client_entity = ROOT / "resource_pack/entity/delorean.entity.json"
if client_entity.exists():
    try:
        data = json.loads(client_entity.read_text(encoding="utf-8"))
        textures = data["minecraft"]["client_entity"]["description"]["textures"]
        for key, value in textures.items():
            texture_file = ROOT / "resource_pack" / (value + ".png")
            if not texture_file.exists():
                errors.append(f"Missing entity texture '{key}': {texture_file.relative_to(ROOT)}")
    except Exception as exc:
        errors.append(f"Could not inspect client entity texture references: {exc}")

atlas = ROOT / "resource_pack/textures/item_texture.json"
if atlas.exists():
    try:
        data = json.loads(atlas.read_text(encoding="utf-8"))
        for key, entry in data.get("texture_data", {}).items():
            value = entry.get("textures")
            candidates = value if isinstance(value, list) else [value]
            for candidate in candidates:
                if not candidate:
                    continue
                if not (ROOT / "resource_pack" / (candidate + ".png")).exists():
                    errors.append(f"Missing item atlas texture '{key}': resource_pack/{candidate}.png")
    except Exception as exc:
        errors.append(f"Could not inspect item atlas: {exc}")

print(f"JSON files parsed: {checked}")
if errors:
    print("Validation: FAILED")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("Validation: PASSED (JSON and basic texture-reference checks)")
