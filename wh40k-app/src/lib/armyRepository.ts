import { db } from "./db";
import type { Army, ArmyDetachment, ArmyUnit } from "./types";

export async function loadArmyBundle(armyId: string) {
  const [army, factions, armyDetachments, armyUnits, datasheetOptions] =
    await Promise.all([
      db.armies.get(armyId),
      db.factions.toArray(),
      db.army_detachments.where("army_id").equals(armyId).toArray(),
      db.army_units.where("army_id").equals(armyId).toArray(),
      db.datasheet_options.toArray(),
    ]);
  if (!army) throw new Error("Army not found");
  return { army, factions, armyDetachments, armyUnits, datasheetOptions };
}

export async function loadDatasheetsByFaction(factionIds: string[]) {
  if (!factionIds.length) return [];
  return db.datasheets.where("faction_id").anyOf(factionIds).toArray();
}

export async function saveArmy(army: Army) {
  await db.armies.put(army);
}

export async function addUnit(unit: ArmyUnit) {
  await db.army_units.add(unit);
}

export async function removeUnit(unitId: string) {
  await db.army_units.delete(unitId);
}

export async function addDetachment(detachment: ArmyDetachment) {
  await db.army_detachments.add(detachment);
}

export async function removeDetachment(detachmentId: string) {
  const units = await db.army_units
    .where("detachment_id")
    .equals(detachmentId)
    .toArray();
  await db.army_units.bulkDelete(units.map((u) => u.id));
  await db.army_detachments.delete(detachmentId);
}
