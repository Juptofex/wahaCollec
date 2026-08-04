import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const faction = await db.factions.get(params.id);
  if (!faction) throw error(404, 'Faction introuvable');

  const datasheets = await db.datasheets
    .where('faction_id')
    .equals(params.id)
    .sortBy('name');

  return { faction, datasheets };
};