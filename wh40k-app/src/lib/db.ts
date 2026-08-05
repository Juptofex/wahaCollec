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

class WahDB extends Dexie {
  factions!: Table<Faction>;
  datasheets!: Table<Datasheet>;
  datasheet_models!: Table<DatasheetModel>;
  datasheet_abilities!: Table<DatasheetAbility>;
  datasheet_wargear!: Table<DatasheetWargear>;
  datasheet_keywords!: Table<DatasheetKeyword>;
  datasheet_options!: Table<DatasheetOption>;

  constructor() {
    super("wahapedia");
    this.version(1).stores({
      factions: "id, name",
      datasheets: "id, faction_id, name",
      datasheet_models: "++localId, datasheet_id",
      datasheet_abilities: "++localId, datasheet_id",
      datasheet_wargear: "++localId, datasheet_id",
      datasheet_keywords: "++localId, datasheet_id",
      datasheet_options: "++localId, datasheet_id",
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
