import { db } from "./db";
import type {
  Detachment as DetachmentCatalog,
  DatasheetModelCost,
} from "./types";

export async function getDetachments(
  factionIds?: string[],
): Promise<DetachmentCatalog[]> {
  if (!factionIds || factionIds.length === 0) return db.detachments.toArray();
  return db.detachments.where("faction_id").anyOf(factionIds).toArray();
}

export async function getModelCosts(
  datasheetIds?: string[],
): Promise<DatasheetModelCost[]> {
  if (!datasheetIds || datasheetIds.length === 0)
    return db.datasheet_models_cost.toArray();
  return db.datasheet_models_cost
    .where("datasheet_id")
    .anyOf(datasheetIds)
    .toArray();
}
