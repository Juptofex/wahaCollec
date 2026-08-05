import Dexie, { type Table } from "dexie";

interface Faction {
  id: string;
  name: string;
  link: string;
}
interface Datasheet {
  id: string;
  faction_id: string;
  name: string;
  [key: string]: any;
}
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
interface DatasheetOption {
  datasheet_id: string;
  [key: string]: any;
}

interface ArmyDetachment {
  id: string;
  army_id: string;
  detachment_id?: string;
  name: string;
  faction_id: string;
}

interface ArmyUnit {
  id: string;
  army_id: string;
  detachment_id: string;
  datasheet_id: string;
  quantity: number;
  points: number;
}

interface Army {
  id: string;
  name: string;
  faction_id?: string;
  points_limit?: number;
  created_at: number;
  updated_at: number;
}

class WahDB extends Dexie {
  factions!: Table<Faction>;
  datasheets!: Table<Datasheet>;
  datasheet_models!: Table<DatasheetModel>;
  datasheet_abilities!: Table<DatasheetAbility>;
  datasheet_wargear!: Table<DatasheetWargear>;
  datasheet_keywords!: Table<DatasheetKeyword>;
  datasheet_options!: Table<DatasheetOption>;
  armies!: Table<Army>;
  army_detachments!: Table<ArmyDetachment>;
  army_units!: Table<ArmyUnit>;

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
      armies: "id, name, faction_id, points_limit, created_at, updated_at",
      army_detachments: "id, army_id, detachment_id, name, faction_id",
      army_units: "id, army_id, datasheet_id, detachment_id, quantity, points",
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
    ] = await Promise.all([
      load("Factions"),
      load("Datasheets"),
      load("Datasheets_models"),
      load("Datasheets_abilities"),
      load("Datasheets_wargear"),
      load("Datasheets_keywords"),
      load("Datasheets_options"),
    ]);

    await db.factions.bulkPut(factions);
    await db.datasheets.bulkPut(datasheets);
    await db.datasheet_models.bulkPut(models);
    await db.datasheet_abilities.bulkPut(abilities);
    await db.datasheet_wargear.bulkPut(wargear);
    await db.datasheet_keywords.bulkPut(keywords);
    await db.datasheet_options.bulkPut(options);
  } catch (e) {
    console.error(
      "Seed failed (probablement hors-ligne au premier lancement):",
      e,
    );
    throw e;
  }
}
