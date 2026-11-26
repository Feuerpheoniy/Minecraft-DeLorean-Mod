import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const DELOREAN_ID = "feuerpheoniy:delorean";
const MAX_LOOK_DISTANCE = 6;
const playersWithPrompt = new Set();
const playersWithOpenForm = new Set();
const SPEED_BAR_SEGMENTS = 10;
const SPEED_BAR_MAX_KMH = 140; // approximately 88 mph

function getLookedAtDeLorean(player) {
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: MAX_LOOK_DISTANCE });
    return hits.find((entry) => entry.entity.typeId === DELOREAN_ID)?.entity;
  } catch {
    return undefined;
  }
}

function getRiddenDeLorean(player) {
  for (const car of player.dimension.getEntities({ type: DELOREAN_ID })) {
    try {
      const rideable = car.getComponent("minecraft:rideable");
      if (rideable?.getRiders().some((rider) => rider.id === player.id)) return car;
    } catch {}
  }
  return undefined;
}

function showSpeedometer(player, car) {
  let speedKmh = 0;
  try {
    const velocity = car.getVelocity();
    speedKmh = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2) * 20 * 3.6;
  } catch {}

  const progress = Math.max(0, Math.min(1, speedKmh / SPEED_BAR_MAX_KMH));
  const filled = Math.round(progress * SPEED_BAR_SEGMENTS);
  const bar = "§a" + "▮".repeat(filled) + "§7" + "▯".repeat(SPEED_BAR_SEGMENTS - filled);
  player.onScreenDisplay.setActionBar(`§l§bDELOREAN §r ${bar} §f${Math.round(speedKmh)} km/h`);
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const riddenCar = getRiddenDeLorean(player);
    if (riddenCar) {
      showSpeedometer(player, riddenCar);
      playersWithPrompt.delete(player.id);
      continue;
    }

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
    } catch {}

    const action = doorsOpen ? "CLOSE" : "OPEN";
    const instruction = doorsOpen
      ? (player.isSneaking ? "Interagieren zum Schließen" : "Ducken zum Schließen")
      : (player.isSneaking ? "Aufstehen zum Öffnen" : "Interagieren zum Öffnen");
    player.onScreenDisplay.setActionBar(`§l§b[${action}]§r  §7${instruction}`);
  }
}, 5);

async function showDoorButton(player, car) {
  if (playersWithOpenForm.has(player.id)) return;
  playersWithOpenForm.add(player.id);

  try {
    const doorsOpen = car.getProperty("feuerpheoniy:doors_open") === true;
    // Match the requested controls: standing opens, crouching closes.
    if ((!doorsOpen && player.isSneaking) || (doorsOpen && !player.isSneaking)) return;

    const action = doorsOpen ? "CLOSE" : "OPEN";
    const form = new ActionFormData()
      .title("DeLorean · Flügeltüren")
      .body(doorsOpen
        ? "Die Flügeltüren sind geöffnet. Möchtest du sie schließen?"
        : "Die Flügeltüren sind geschlossen. Möchtest du sie öffnen?")
      .button(action);

    const response = await form.show(player);
    if (response.canceled || response.selection !== 0 || !car.isValid) return;

    car.triggerEvent(doorsOpen
      ? "feuerpheoniy:close_doors"
      : "feuerpheoniy:open_doors");
  } catch {
    // Another open UI or a player leaving can prevent the form from appearing.
  } finally {
    playersWithOpenForm.delete(player.id);
  }
}

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  if (event.target.typeId !== DELOREAN_ID) return;

  const player = event.player;
  const target = event.target;
  event.cancel = true;
  system.run(() => void showDoorButton(player, target));
});
