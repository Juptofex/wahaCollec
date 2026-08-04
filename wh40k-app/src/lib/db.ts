import Dexie, { type Table } from 'dexie';

interface Faction { id: string; name: string; link: string; }
interface Datasheet { id: string; faction_id: string; name: string; [key: string]: any; }

class WahDB extends Dexie {
  factions!: Table<Faction>;
  datasheets!: Table<Datasheet>;

  constructor() {
    super('wahapedia');
    this.version(1).stores({
      factions: 'id, name',
      datasheets: 'id, faction_id, name'
    });
  }
}

export const db = new WahDB();

export async function seedIfEmpty() {
  const count = await db.factions.count();
  if (count > 0) return;

  const factions = await fetch('/data/Factions.json').then(r => r.json());
  const datasheets = await fetch('/data/Datasheets.json').then(r => r.json());

  await db.factions.bulkPut(factions);
  await db.datasheets.bulkPut(datasheets);
}