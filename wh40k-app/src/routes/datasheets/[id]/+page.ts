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

  return { datasheet, models, abilities, wargear, keywords, options };
};
