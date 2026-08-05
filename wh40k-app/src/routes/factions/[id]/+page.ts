import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

type Detachment = {
  id: string;
  faction_id: string;
  name: string;
  type: string;
  legend: string;
};

type DetachmentAbility = {
  id: string;
  faction_id: string;
  name: string;
  description: string;
  legend: string;
  detachment: string;
  detachment_id: string;
};

type DetachmentView = Detachment & {
  abilities: DetachmentAbility[];
};

export const load: PageLoad = async ({ params }) => {
  const faction = await db.factions.get(params.id);
  if (!faction) throw error(404, 'Faction introuvable');

  const [datasheets, detachments, detachmentAbilities] = await Promise.all([
    db.datasheets.where('faction_id').equals(params.id).sortBy('name'),
    fetch('/data/Detachments.json').then((r) => r.json() as Promise<Detachment[]>),
    fetch('/data/Detachment_abilities.json').then((r) => r.json() as Promise<DetachmentAbility[]>)
  ]);

  const factionDetachments = detachments
  .filter((d) => d.faction_id === params.id)
  .map((detachment) => {
    const abilities = detachmentAbilities.filter(
      (ability) =>
        ability.faction_id === params.id &&
        (ability.detachment_id === detachment.id ||
          ability.detachment?.trim() === detachment.name)
    );

    return {
      ...detachment,
      abilities
    };
  });

  return {
    faction,
    datasheets,
    detachments: factionDetachments
  };
};