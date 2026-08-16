// $lib/coreWeaponAbilities.ts

export const CORE_WEAPON_ABILITIES: Record<string, string> = {
  ANTI: "Scores a Critical Wound against the specified keyword on an unmodified Wound roll at or above the stated value.",
  ASSAULT:
    "Can be fired even if the bearer's unit made a Normal, Advance, or Fall Back move this turn.",
  BLAST:
    "Gains extra Attacks against larger target units, scaling with the number of models in the target.",
  "DEVASTATING WOUNDS":
    "A Critical Wound scored with this weapon becomes a Devastating Wound: no saving throw of any kind can be made against it.",
  "EXTRA ATTACKS":
    "Cannot be a model's only weapon; attacks made with it resolve after the model's other attacks.",
  HAZARDOUS:
    "After the bearer's unit fights or shoots, roll for each model that used this weapon; on a 1, that model is destroyed.",
  HEAVY:
    "Add 1 to the Hit roll if the bearer's unit Remained Stationary this turn.",
  "IGNORES COVER":
    "The target does not receive the Benefit of Cover against attacks made with this weapon.",
  "INDIRECT FIRE":
    "Can target units the bearer cannot see, at a penalty to the Hit roll and granting the target Benefit of Cover.",
  LANCE:
    "Add 1 to the Hit roll if the bearer's unit made a Charge move this turn.",
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
 * "[DEVASTATING WOUNDS]" out of raw HTML ability/wargear description text.
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
 */
export function annotateCoreAbilityTags(html: string): string {
  return html.replace(
    /\[([A-Z][A-Z\s\-]+?(?:\s[\dX]+\+?)?)\]/g,
    (full, tag) => {
      const desc = getCoreAbilityDescription(tag.trim());
      if (!desc) return full;
      const escapedDesc = desc.replace(/"/g, "&quot;");
      return `<span class="core-ability-tag" title="${escapedDesc}">${tag}</span>`;
    },
  );
}
