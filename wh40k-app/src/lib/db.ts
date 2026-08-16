import Dexie, { type Table } from "dexie";
import type {
  Army,
  Faction,
  ArmyDetachment,
  ArmyUnit,
  Datasheet,
  DatasheetOption,
  DatasheetModelCost,
  Collection,
  CollectionUnit,
  FactionCollection,
  Detachment,
  DetachmentAbility,
  Ability,
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

class WahDB extends Dexie {
  factions!: Table<Faction>;
  detachments!: Table<Detachment>;
  detachment_abilities!: Table<DetachmentAbility>;
  abilities!: Table<Ability>;
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

    this.version(4).stores({
      factions: "id, name",
      detachments: "id, faction_id, name",
      detachment_abilities: "id, faction_id, detachment_id",
      abilities: "id, name, legend, faction_id, description",
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

    this.version(5)
      .stores({
        factions: "id, name",
        detachments: "id, faction_id, name",
        detachment_abilities: "id, faction_id, detachment_id",
        abilities: "id, name, legend, faction_id, description",
        datasheets: "id, faction_id, name",
        datasheet_models: "++localId, datasheet_id",
        datasheet_abilities: "++localId, datasheet_id",
        datasheet_wargear: "++localId, datasheet_id",
        datasheet_keywords: "++localId, datasheet_id",
        datasheet_options: "++localId, datasheet_id",
        datasheet_models_cost: "++localId, datasheet_id",
        armies: "id, name, faction_id, points_limit, created_at, updated_at",
        army_detachments: "id, army_id, detachment_id, name, faction_id",
        army_units:
          "id, army_id, datasheet_id, detachment_id, quantity, points",
        collection: "armies",
        collection_units: "id, factionCollection_id, datasheet_id, quantity",
        faction_collections: "id, faction_id",
      })
      .upgrade(async (tx) => {
        const tablesToDedupe = [
          "datasheet_models",
          "datasheet_abilities",
          "datasheet_wargear",
          "datasheet_keywords",
          "datasheet_options",
          "datasheet_models_cost",
        ];

        for (const tableName of tablesToDedupe) {
          const table = tx.table(tableName);
          const rows = await table.toArray();
          const seen = new Set<string>();
          const idsToDelete: number[] = [];

          for (const row of rows) {
            const { localId, ...rest } = row;
            const fingerprint = JSON.stringify(rest);
            if (seen.has(fingerprint)) {
              idsToDelete.push(localId);
            } else {
              seen.add(fingerprint);
            }
          }

          if (idsToDelete.length > 0) {
            await table.bulkDelete(idsToDelete);
          }
        }
      });

    // v6: the "abilities" seeding bug (see doSeed) misaligned the loaded
    // JSON files with their destination tables — datasheet_abilities got
    // the global Abilities data, and datasheet_wargear/keywords/options/
    // models_cost each ended up with the wrong file's contents, one slot
    // off. Force a full re-seed of the affected tables on next load.
    this.version(6)
      .stores({
        factions: "id, name",
        detachments: "id, faction_id, name",
        detachment_abilities: "id, faction_id, detachment_id",
        abilities: "id, name, legend, faction_id, description",
        datasheets: "id, faction_id, name",
        datasheet_models: "++localId, datasheet_id",
        datasheet_abilities: "++localId, datasheet_id",
        datasheet_wargear: "++localId, datasheet_id",
        datasheet_keywords: "++localId, datasheet_id",
        datasheet_options: "++localId, datasheet_id",
        datasheet_models_cost: "++localId, datasheet_id",
        armies: "id, name, faction_id, points_limit, created_at, updated_at",
        army_detachments: "id, army_id, detachment_id, name, faction_id",
        army_units:
          "id, army_id, datasheet_id, detachment_id, quantity, points",
        collection: "armies",
        collection_units: "id, factionCollection_id, datasheet_id, quantity",
        faction_collections: "id, faction_id",
      })
      .upgrade(async (tx) => {
        const tablesToResync = [
          "datasheet_abilities",
          "datasheet_wargear",
          "datasheet_keywords",
          "datasheet_options",
          "datasheet_models_cost",
        ];
        for (const tableName of tablesToResync) {
          await tx.table(tableName).clear();
        }
      });
  }
}

export const db = new WahDB();

let seedingPromise: Promise<void> | null = null;

export function seedIfEmpty(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = doSeed().finally(() => {});
  }
  return seedingPromise;
}

async function doSeed(): Promise<void> {
  const counts = await Promise.all([
    db.factions.count(),
    db.detachments.count(),
    db.abilities.count(),
    db.datasheets.count(),
    db.datasheet_models.count(),
    db.datasheet_abilities.count(),
    db.datasheet_wargear.count(),
    db.datasheet_keywords.count(),
    db.datasheet_options.count(),
    db.datasheet_models_cost.count(),
  ]);

  if (counts.every((c) => c > 0)) return;

  try {
    const load = (name: string) =>
      fetch(`/data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`${name} failed: ${r.status}`);
        return r.json();
      });

    const [
      factions,
      detachments,
      detachmentAbilities,
      abilities,
      datasheets,
      models,
      datasheetAbilities,
      wargear,
      keywords,
      options,
      models_cost,
    ] = await Promise.all([
      load("Factions"),
      load("Detachments"),
      load("Detachment_abilities"),
      load("Abilities"),
      load("Datasheets"),
      load("Datasheets_models"),
      load("Datasheets_abilities"),
      load("Datasheets_wargear"),
      load("Datasheets_keywords"),
      load("Datasheets_options"),
      load("Datasheets_models_cost"),
    ]);

    await db.factions.bulkPut(factions);
    await db.abilities.bulkPut(abilities);
    await db.detachments.bulkPut(detachments);
    await db.detachment_abilities.bulkPut(detachmentAbilities);
    await db.datasheets.bulkPut(datasheets);

    await db.transaction(
      "rw",
      [
        db.datasheet_models,
        db.datasheet_abilities,
        db.datasheet_wargear,
        db.datasheet_keywords,
        db.datasheet_options,
        db.datasheet_models_cost,
      ],
      async () => {
        await Promise.all([
          db.datasheet_models.clear(),
          db.datasheet_abilities.clear(),
          db.datasheet_wargear.clear(),
          db.datasheet_keywords.clear(),
          db.datasheet_options.clear(),
          db.datasheet_models_cost.clear(),
        ]);

        await Promise.all([
          db.datasheet_models.bulkAdd(models),
          db.datasheet_abilities.bulkAdd(datasheetAbilities),
          db.datasheet_wargear.bulkAdd(wargear),
          db.datasheet_keywords.bulkAdd(keywords),
          db.datasheet_options.bulkAdd(options),
          db.datasheet_models_cost.bulkAdd(models_cost),
        ]);
      },
    );
  } catch (e) {
    console.error(
      "Seed failed (probablement hors-ligne au premier lancement):",
      e,
    );
    throw e;
  }
}
