import { world, system } from "@minecraft/server";

const DELOREAN_ID = "feuerpheoniy:delorean";
const MAX_LOOK_DISTANCE = 6;
const playersWithPrompt = new Set();

function getLookedAtDeLorean(player) {
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: MAX_LOOK_DISTANCE });
    const hit = hits.find((entry) => entry.entity.typeId === DELOREAN_ID);
    return hit?.entity;
  } catch {
    return undefined;
  }
}

// Context hint: OPEN normally, CLOSE while sneaking.
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const car = getLookedAtDeLorean(player);
    if (!car) {
      if (playersWithPrompt.has(player.id)) {
        player.onScreenDisplay.setActionBar("");
        playersWithPrompt.delete(player.id);
      }
      continue;
    }
    playersWithPrompt.add(player.id);

    let doorsOpen = false;
    try {
      doorsOpen = car.getProperty("feuerpheoniy:doors_open") === true;
    } catch {
      // Keep the prompt usable even if the property is temporarily unavailable.
    }

    if (doorsOpen && player.isSneaking) {
      player.onScreenDisplay.setActionBar("§l§6[ CLOSE ]§r  §7Interagieren");
    } else if (!doorsOpen && !player.isSneaking) {
      player.onScreenDisplay.setActionBar("§l§b[ OPEN ]§r  §7Interagieren");
    } else if (doorsOpen) {
      player.onScreenDisplay.setActionBar("§eDucken + Interagieren: CLOSE");
    } else {
      player.onScreenDisplay.setActionBar("§eAufstehen + Interagieren: OPEN");
    }
  }
}, 5);

// Use the normal interact/tap action on the DeLorean as the button press.
// Cancel the default ride interaction so it cannot accidentally mount the car.
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  if (event.target.typeId !== DELOREAN_ID) return;

  const shouldClose = event.player.isSneaking;
  const target = event.target;
  event.cancel = true;

  system.run(() => {
    try {
      target.triggerEvent(shouldClose
        ? "feuerpheoniy:close_doors"
        : "feuerpheoniy:open_doors");
    } catch {
      // The entity may have been removed before the scheduled callback.
    }
  });
});
