import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
  const faction = await db.factions.get(params.id);
  if (!faction) throw error(404, "Faction introuvable");

  const [datasheets, detachments, detachmentAbilities] = await Promise.all([
    db.datasheets.where("faction_id").equals(params.id).sortBy("name"),
    db.detachments.where("faction_id").equals(params.id).toArray(),
    db.detachment_abilities.where("faction_id").equals(params.id).toArray(),
  ]);

  const factionDetachments = detachments.map((detachment) => ({
    ...detachment,
    abilities: detachmentAbilities.filter(
      (ability) =>
        ability.detachment_id === detachment.id ||
        ability.detachment?.trim() === detachment.name,
    ),
  }));

  return { faction, datasheets, detachments: factionDetachments };
};
