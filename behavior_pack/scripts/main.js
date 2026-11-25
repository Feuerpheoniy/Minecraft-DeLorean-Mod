import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const DELOREAN_ID = "feuerpheoniy:delorean";
const MAX_LOOK_DISTANCE = 6;
const playersWithPrompt = new Set();
const playersWithOpenForm = new Set();

function getLookedAtDeLorean(player) {
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: MAX_LOOK_DISTANCE });
    return hits.find((entry) => entry.entity.typeId === DELOREAN_ID)?.entity;
  } catch {
    return undefined;
  }
}

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
