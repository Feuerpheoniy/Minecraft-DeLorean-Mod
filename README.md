# Minecraft DeLorean Mod

A Minecraft Bedrock add-on project for an original DeLorean-inspired time machine.

## Current status

- Behavior Pack and Resource Pack structure
- DeLorean entity definition with a driver seat
- Custom low-poly vehicle geometry
- First 64x64 vehicle texture and 16x16 spawn-egg icon
- Item texture atlas points to the custom spawn-egg icon
- Entity render controller is present
- Local JSON and texture-reference validator

## Install

Import the Behavior Pack and Resource Pack folders into Minecraft's development pack folders, or package them as separate `.mcpack` files and then as a combined `.mcaddon`. Enable both packs in a test world and enable creator experiments only if Minecraft prompts for them.

## Validation

Run `python tools/validate_addon.py` from the repository root. The script parses pack JSON and checks the entity and item-atlas texture files.

## Known limitations

This is an early development build, not yet verified in-game. The vehicle texture and spawn-egg icon are first-pass pixel-art assets; the geometry is still a blockout rather than a detailed DMC-12 model. Driving behavior, door animation, functional time circuits, and the 88 mph time-travel sequence are not implemented yet. The project targets the Bedrock 26.x format family, but exact engine compatibility must be confirmed with an in-game test.
