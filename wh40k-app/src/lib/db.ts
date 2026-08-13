import Dexie, { type Table } from "dexie";
import type {
  Army,
  Faction,
  ArmyDetachment,
  ArmyUnit,
  Datasheet,
  DatasheetOption,
  Collection,
  CollectionUnit,
  FactionCollection,
} from "./types";

interface DatasheetModel {
  datasheet_id: string;
  [key: string]: any;
}
interface DatasheetAbility {
  datasheet_id: string;
  [key: string]: any;
}
interface DatasheetWargear {
  datasheet_id: string;
  [key: string]: any;
}
interface DatasheetKeyword {
  datasheet_id: string;
  [key: string]: any;
}

interface DatasheetModelCost {
  datasheet_id: string;
  [key: string]: any;
}

class WahDB extends Dexie {
  factions!: Table<Faction>;
  datasheets!: Table<Datasheet>;
  datasheet_models!: Table<DatasheetModel>;
  datasheet_abilities!: Table<DatasheetAbility>;
  datasheet_wargear!: Table<DatasheetWargear>;
  datasheet_keywords!: Table<DatasheetKeyword>;
  datasheet_options!: Table<DatasheetOption>;
  datasheet_models_cost!: Table<DatasheetModelCost>;
  armies!: Table<Army>;
  army_detachments!: Table<ArmyDetachment>;
  army_units!: Table<ArmyUnit>;
  collection!: Table<Collection>;
  collection_units!: Table<CollectionUnit>;
  faction_collections!: Table<FactionCollection>;

  constructor() {
    super("wahapedia");
    this.version(3).stores({
      factions: "id, name",
      datasheets: "id, faction_id, name",
      datasheet_models: "++localId, datasheet_id",
      datasheet_abilities: "++localId, datasheet_id",
      datasheet_wargear: "++localId, datasheet_id",
      datasheet_keywords: "++localId, datasheet_id",
      datasheet_options: "++localId, datasheet_id",
      datasheet_models_cost: "++localId, datasheet_id",
      armies: "id, name, faction_id, points_limit, created_at, updated_at",
      army_detachments: "id, army_id, detachment_id, name, faction_id",
      army_units: "id, army_id, datasheet_id, detachment_id, quantity, points",
      collection: "armies",
      collection_units: "id, factionCollection_id, datasheet_id, quantity",
      faction_collections: "id, faction_id",
    });
  }
}

export const db = new WahDB();

export async function seedIfEmpty() {
  const count = await db.factions.count();
  if (count > 0) return;

  try {
    const load = (name: string) =>
      fetch(`/data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`${name} failed: ${r.status}`);
        return r.json();
      });

    const [
      factions,
      datasheets,
      models,
      abilities,
      wargear,
      keywords,
      options,
      models_cost,
    ] = await Promise.all([
      load("Factions"),
      load("Datasheets"),
      load("Datasheets_models"),
      load("Datasheets_abilities"),
      load("Datasheets_wargear"),
      load("Datasheets_keywords"),
      load("Datasheets_options"),
      load("Datasheets_models_cost"),
    ]);

    await db.factions.bulkPut(factions);
    await db.datasheets.bulkPut(datasheets);
    await db.datasheet_models.bulkPut(models);
    await db.datasheet_abilities.bulkPut(abilities);
    await db.datasheet_wargear.bulkPut(wargear);
    await db.datasheet_keywords.bulkPut(keywords);
    await db.datasheet_options.bulkPut(options);
    await db.datasheet_models_cost.bulkPut(models_cost);
  } catch (e) {
    console.error(
      "Seed failed (probablement hors-ligne au premier lancement):",
      e,
    );
    throw e;
  }
}
