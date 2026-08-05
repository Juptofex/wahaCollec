import Papa from "papaparse";
import { writeFileSync, mkdirSync } from "fs";

const BASE = "https://wahapedia.ru/wh40k11ed";
const FILES = [
  "Factions",
  "Datasheets",
  "Datasheets_models",
  "Datasheets_abilities",
  "Datasheets_options",
  "Datasheets_keywords",
  "Datasheets_wargear",
  "Stratagems",
  "Abilities",
  "Enhancements",
  "Detachments",
  "Detachment_abilities",
];

async function main() {
  mkdirSync("static/data", { recursive: true });
  for (const name of FILES) {
    const res = await fetch(`${BASE}/${name}.csv`);
    const text = await res.text();
    const parsed = Papa.parse(text, {
      header: true,
      delimiter: "|",
      skipEmptyLines: true,
    });
    writeFileSync(`static/data/${name}.json`, JSON.stringify(parsed.data));
    console.log(`✔ ${name}: ${parsed.data.length} lignes`);
  }
}

main();
