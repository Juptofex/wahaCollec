export const CORE_WEAPON_ABILITIES: Record<string, string> = {
  ANTI: "Scores a Critical Wound against the specified keyword on an unmodified Wound roll at or above the stated value.",
  ASSAULT:
    "Can be fired even if the bearer's unit made an Advance move this turn.",
  BLAST:
    "Gains extra Attacks against larger target units, scaling with the number of models in the target (+1 per 5 models).",
  "DEVASTATING WOUNDS":
    "A Critical Wound scored with this weapon becomes a Devastating Wound: damage become a mortal wound, no saving throw of any kind can be made against it.",
  "EXTRA ATTACKS":
    "The model can make additional attacks with this weapon, as specified by the stated value.",
  HAZARDOUS:
    "After the bearer's unit fights or shoots, roll for each model that used this weapon; on a 1-2, that unit suffers a mortal wound (3 for vehicles or monsters).",
  HEAVY:
    "Add 1 to the Hit roll if the bearer's unit Remained Stationary this turn (or moved less than 3\").",
  "IGNORES COVER":
    "The target does not receive the Benefit of Cover against attacks made with this weapon.",
  "INDIRECT FIRE":
    "Can target units the bearer cannot see, the target receives the Benefit of Cover. You cannot re-roll Hit rolls and an unmodified Hit roll of 1-5 automatically misses unless your unit remained stationnary this turn and the target is visible to one or more friendly units, in wich case an unmodified Hit roll of 1-3 automatically misses.",
  LANCE:
    "Add 1 to the Wound roll if the bearer's unit made a Charge move this turn.",
  "LETHAL HITS":
    "An unmodified Hit roll of 6 automatically scores a successful wound, skipping the Wound roll.",
  MELTA:
    "Increases this weapon's Damage characteristic by the stated value when the target is within half range.",
  "ONE SHOT": "Can only be used to make attacks once per battle.",
  PISTOL:
    "Can be fired even while the bearer is within Engagement Range, but must target an enemy unit within Engagement Range.",
  PRECISION:
    "Successful wound rolls can be allocated to a Character model in the target unit even if it is not the closest model.",
  "RAPID FIRE":
    "Increases this weapon's Attacks characteristic by the stated value when the target is within half range.",
  "SUSTAINED HITS":
    "Each Critical Hit scores additional hits on the target equal to the stated value.",
  TORRENT: "Automatically hits the target; no Hit roll is made.",
  "TWIN-LINKED":
    "The Wound roll can be re-rolled when attacking with this weapon.",
};

/**
 * Pulls bracketed ability tags like "[SUSTAINED HITS 1]" or
 * "[DEVASTATING WOUNDS]" out of raw HTML ability description text.
 * Used for datasheet_abilities.description, which embeds tags in prose.
 */
export function extractCoreAbilityTags(description: string): string[] {
  const matches = Array.from(
    description.matchAll(/\[([A-Z][A-Z\s\-]+?(?:\s[\dX]+\+?)?)\]/g),
  );
  return [...new Set(matches.map((m) => m[1].trim()))];
}

function baseNameFor(tag: string): string {
  // Strip trailing numeric/threshold values: "SUSTAINED HITS 1" -> "SUSTAINED HITS",
  // "ANTI-VEHICLE 4+" -> "ANTI"
  const withoutValue = tag.replace(/\s+[\dX]+\+?$/, "").trim();
  if (withoutValue.startsWith("ANTI-") || withoutValue.startsWith("ANTI "))
    return "ANTI";
  return withoutValue;
}

export function getCoreAbilityDescription(tag: string): string | null {
  return CORE_WEAPON_ABILITIES[baseNameFor(tag)] ?? null;
}

/**
 * Wraps every [TAG] occurrence in the given HTML with a styled, titled
 * span so it renders as a hoverable badge instead of plain bracket text.
 * Used for datasheet_abilities.description.
 */
export function annotateCoreAbilityTags(html: string): string {
  return html.replace(
    /\[([A-Z][A-Z\s\-]+?(?:\s[\dX]+\+?)?)\]/g,
    (full, tag) => {
      const desc = getCoreAbilityDescription(tag.trim());
      if (!desc) return full;
      const escapedDesc = desc.replace(/"/g, "&quot;").replace(/</g, "&lt;");
      return `<span class="core-ability-tag" data-open="false">${tag}<span class="core-ability-popover">${escapedDesc}</span></span>`;
    },
  );
}

/**
 * Parses a weapon's plain-text ability list from datasheet_wargear.description
 * (e.g. "anti-infantry 4+, devastating wounds, rapid fire 1") into
 * individual clauses, each matched against the Core ability glossary.
 * Unlike ability descriptions, this field has no brackets and no prose —
 * just a flat, comma-separated, lowercase list.
 */
export function parseWargearAbilities(
  description: string,
): { raw: string; description: string | null }[] {
  return description
    .split(",")
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause) => {
      // Separate a trailing value ("4+", "1", "d3") from the ability name.
      const match = clause.match(/^(.*?)(?:\s+([\dX]+\+?|d\d+))?$/i);
      const name = (match?.[1] ?? clause).trim();
      const key = normalizeAbilityKey(name);
      return {
        raw: clause,
        description: CORE_WEAPON_ABILITIES[key] ?? null,
      };
    });
}

function normalizeAbilityKey(rawName: string): string {
  const upper = rawName.trim().toUpperCase();
  if (upper.startsWith("ANTI-") || upper.startsWith("ANTI ")) return "ANTI";
  return upper;
}
