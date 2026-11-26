# Minecraft DeLorean Mod

A Minecraft Bedrock add-on project for an original DeLorean-inspired time machine.

## Current status

- Behavior Pack and Resource Pack structure
- DeLorean entity definition with a driver seat
- Expanded low-poly DMC-12 geometry with front/rear fascia, gullwing-door outlines, side trim, wheels, and rear time-machine hardware
- 64x64 vehicle texture and custom 64x64 spawn-egg icon
- Item texture atlas points to the custom spawn-egg icon
- Entity render controller is present
- Gullwing doors have open, hold-open, and close animations driven by a client animation controller
- Local JSON and texture-reference validator

## Install

Import the Behavior Pack and Resource Pack folders into Minecraft's development pack folders, or package them as separate `.mcpack` files and then as a combined `.mcaddon`. Enable both packs in a test world and enable creator experiments only if Minecraft prompts for them.

## Validation

Run `python tools/validate_addon.py` from the repository root. The script parses pack JSON and checks entity/item texture paths, geometry IDs, and animation/controller references.

## Gullwing door test commands

After summoning a DeLorean, use these commands to open and close its doors:

```mcfunction
/event entity @e[type=feuerpheoniy:delorean,c=1] feuerpheoniy:open_doors
/event entity @e[type=feuerpheoniy:delorean,c=1] feuerpheoniy:close_doors
```

The door state is synchronized to the Resource Pack. The client entity uses the Bedrock 1.10 animation `scripts.animate` wiring, and the Resource Pack controller selects open/hold/close states from the synchronized `feuerpheoniy:doors_open` property. The Behavior Pack includes a Script API interaction: when you look at the DeLorean within six blocks, the action bar shows the available OPEN/CLOSE action. Stand normally, look at the car, and interact to open the door menu with its **OPEN** button. After the doors open, crouch, look at the car, and interact to open the menu with its **CLOSE** button. The script cancels the default ride interaction while this door menu is used. The menu is a clickable Bedrock ActionForm, not a permanently visible HUD button.

## Known limitations

This is an early development build, not yet verified in-game. The vehicle texture and spawn-egg icon are first-pass pixel-art assets; the geometry is still a blockout rather than a detailed DMC-12 model. Driving behavior, functional time circuits, and the 88 mph time-travel sequence are not implemented yet. Gullwing-door animation wiring has been added, but it still needs an in-game test. The project targets the Bedrock 26.x format family, but exact engine compatibility must be confirmed with an in-game test.
