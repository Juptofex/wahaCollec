import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

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

export const load: PageLoad = async ({ params }) => {
  const faction = await db.factions.get(params.id);
  if (!faction) throw error(404, "Faction introuvable");

  const [detachments, detachmentAbilities, stratagems, enhancements] =
    await Promise.all([
      fetch("/data/Detachments.json").then(
        (r) => r.json() as Promise<Detachment[]>,
      ),
      fetch("/data/Detachment_abilities.json").then(
        (r) => r.json() as Promise<DetachmentAbility[]>,
      ),
      fetch("/data/Stratagems.json").then((r) => r.json()),
      fetch("/data/Enhancements.json").then((r) => r.json()),
    ]);

  const detachment = detachments.find(
    (item) => item.faction_id === params.id && item.id === params.detachmentsId,
  );

  if (!detachment) {
    throw error(404, "Détachement introuvable");
  }

  const abilities = detachmentAbilities.filter(
    (ability) =>
      ability.faction_id === params.id &&
      (ability.detachment_id === detachment.id ||
        ability.detachment?.trim() === detachment.name),
  );

  const stratagemList = stratagems as Array<{
    faction_id?: string;
    detachment?: string;
    detachment_id?: string;
    name: string;
    type?: string;
    cp_cost?: string;
    turn?: string;
    phase?: string;
    legend?: string;
    description?: string;
  }>;

  function uniqueByName<T extends { name: string }>(items: T[]) {
    return [...new Map(items.map((item) => [item.name, item])).values()];
  }

  const generalStratagems = uniqueByName(stratagemList).filter(
    (item) => !item.faction_id?.trim() && item.cp_cost !== "0",
  );

  const relatedStratagems = uniqueByName(stratagemList).filter(
    (item) =>
      item.faction_id === params.id &&
      (item.detachment_id === detachment.id ||
        item.detachment?.trim() === detachment.name),
  );

  const relatedEnhancements = enhancements.filter(
    (item: {
      faction_id?: string;
      detachment_id?: string;
      detachment?: string;
    }) =>
      item.faction_id === params.id &&
      (item.detachment_id === detachment.id ||
        item.detachment?.trim() === detachment.name),
  );

  return {
    faction,
    detachment,
    abilities,
    stratagems: relatedStratagems,
    generalStratagems,
    enhancements: relatedEnhancements,
  };
};
