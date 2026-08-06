// Cache module-level pour les données de jeu statiques.
// Ces fichiers JSON ne changent jamais entre deux sessions : on les
// fetch une seule fois par session (peu importe combien de pages
// les utilisent) au lieu de les refetch à chaque montage de page.

export type DetachmentCatalog = {
  id: string;
  faction_id: string;
  name: string;
  type: string;
  legend: string;
};

export type DatasheetModelCost = {
  datasheet_id: string;
  line: string;
  description: string;
  cost: string;
};

let detachmentsPromise: Promise<DetachmentCatalog[]> | null = null;
let modelCostsPromise: Promise<DatasheetModelCost[]> | null = null;

export function getDetachments(): Promise<DetachmentCatalog[]> {
  if (!detachmentsPromise) {
    detachmentsPromise = fetch('/data/Detachments.json').then((response) => {
      if (!response.ok) {
        // reset le cache si le fetch a échoué, pour permettre un retry
        detachmentsPromise = null;
        throw new Error(`Failed to load Detachments.json: ${response.status}`);
      }
      return response.json() as Promise<DetachmentCatalog[]>;
    });
  }
  return detachmentsPromise;
}

export function getModelCosts(): Promise<DatasheetModelCost[]> {
  if (!modelCostsPromise) {
    modelCostsPromise = fetch('/data/Datasheets_models_cost.json').then((response) => {
      if (!response.ok) {
        modelCostsPromise = null;
        throw new Error(`Failed to load Datasheets_models_cost.json: ${response.status}`);
      }
      return response.json() as Promise<DatasheetModelCost[]>;
    });
  }
  return modelCostsPromise;
}