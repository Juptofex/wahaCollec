import { db } from "$lib/db";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
  const datasheet = await db.datasheets.get(params.id);
  if (!datasheet) throw error(404, "Fiche introuvable");

  const [models, abilities, wargear, keywords, options] = await Promise.all([
    db.datasheet_models.where("datasheet_id").equals(params.id).toArray(),
    db.datasheet_abilities.where("datasheet_id").equals(params.id).toArray(),
    db.datasheet_wargear.where("datasheet_id").equals(params.id).toArray(),
    db.datasheet_keywords.where("datasheet_id").equals(params.id).toArray(),
    db.datasheet_options.where("datasheet_id").equals(params.id).toArray(),
  ]);

  await Promise.all(
    abilities
      .filter((a) => a.type === "Core" || a.type === "Faction")
      .map(async (ability) => {
        const abilityDetails = await db.abilities.get(ability.ability_id);
        if (abilityDetails) {
          ability.name = abilityDetails.name;
          ability.description = abilityDetails.description;
        } else {
          console.warn(
            `No matching ability found for ability_id=${ability.ability_id} on datasheet ${params.id}`,
          );
        }
      }),
  );

  return { datasheet, models, abilities, wargear, keywords, options };
};
