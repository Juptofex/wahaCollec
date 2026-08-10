import type { DatasheetOption, DatasheetModelCost, OptionGroup } from "./types";

export function parseModelCount(description: string) {
  const matches = description.match(/\d+/g);
  if (!matches) return 0;
  return matches.map(Number).reduce((total, value) => total + value, 0);
}

export function stripHtml(description: string) {
  return description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractDefaultLabel(rawDescription: string): string {
  const beforeList = rawDescription.split(/<ul/i)[0];
  const text = stripHtml(beforeList);

  const isEquipOnly =
    /\bequipped with\b/i.test(text) && !/\breplaced with\b/i.test(text);
  if (isEquipOnly) return "None";

  const idx = text.search(/\breplaced with\b/i);
  if (idx < 0) return "Standard";

  let subject = text.slice(0, idx);
  subject = subject
    .replace(/^for every \d+ models? in this unit,?\s*/i, "")
    .replace(/^if this unit contains \d+ models?,?\s*/i, "");

  let match = subject.match(/have (?:their|its)\s+(.+?)\s*$/i);

  if (!match) {
    match = subject.match(/(?:’s|'s)\s+(.+?)\s*$/i);
  }

  if (!match) return "Standard";

  const label = match[1].replace(/\s*\bcan (each )?be\s*$/i, "").trim();
  if (!label) return "Standard";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function extractChoiceLabel(rawDescription: string) {
  const text = stripHtml(rawDescription);
  const match =
    text.match(/replaced with\s+(.+?)\.?\s*$/i) ??
    text.match(/equipped with\s+(.+?)\.?\s*$/i);
  if (!match) return text;
  const label = match[1]
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\*+\s*$/, "")
    .replace(/^1\s+/, "")
    .trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : text;
}

export function getStem(rawDescription: string) {
  const beforeList = rawDescription.split(/<ul/i)[0];
  const text = stripHtml(beforeList);
  const idx = text.search(/\b(replaced with|equipped with)\b/i);
  const stem = idx >= 0 ? text.slice(0, idx) : text;
  return stem.replace(/\s*\b(can each be|can be|can)\s*$/i, "").trim();
}

export function getQuantityOptions(
  modelCosts: DatasheetModelCost[],
  datasheetId: string,
) {
  return modelCosts
    .filter((item) => item.datasheet_id === datasheetId)
    .map((item) => ({
      quantity: parseModelCount(item.description),
      cost: Number(item.cost),
    }))
    .filter((item) => item.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity);
}

export function getOptionGroups(
  datasheetOptions: DatasheetOption[],
  datasheetId: string,
): OptionGroup[] {
  const rows = datasheetOptions.filter(
    (item) =>
      item.datasheet_id === datasheetId &&
      item.button !== "*" &&
      stripHtml(item.description).toLowerCase() !== "none",
  );
  const groups = new Map<
    string,
    { prompt: string; choices: Set<string>; defaultLabel: string }
  >();

  for (const row of rows) {
    const stem = getStem(row.description);
    const key = stem.toLowerCase();

    const listChoices = Array.from(
      row.description.matchAll(/<li>(.*?)<\/li>/g),
    ).map((m) =>
      stripHtml(m[1])
        .replace(/\*+\s*$/, "")
        .trim(),
    );
    const choices =
      listChoices.length > 0
        ? listChoices
        : [extractChoiceLabel(row.description)];

    if (!groups.has(key)) {
      groups.set(key, {
        prompt: stem,
        choices: new Set(),
        defaultLabel: extractDefaultLabel(row.description),
      });
    }
    const group = groups.get(key)!;
    for (const c of choices) group.choices.add(c);
  }

  return Array.from(groups.entries()).map(
    ([key, { prompt, choices, defaultLabel }]) => ({
      key,
      prompt,
      choices: Array.from(choices),
      defaultLabel,
    }),
  );
}

export function getUnitCost(
  modelCosts: DatasheetModelCost[],
  datasheetId: string,
  quantity: number,
) {
  const options = modelCosts
    .filter((item) => item.datasheet_id === datasheetId)
    .map((item) => ({
      quantity: parseModelCount(item.description),
      cost: Number(item.cost),
    }))
    .filter((item) => item.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity);

  const exactMatch = options.find((item) => item.quantity === quantity);
  return exactMatch?.cost ?? null;
}
