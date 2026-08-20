export type Army = {
  id: string;
  name: string;
  faction_id?: string;
  points_limit?: number;
  created_at: number;
  updated_at: number;
};

export type Faction = {
  id: string;
  name: string;
  link: string;
};

export type DetachmentCatalog = {
  id: string;
  faction_id: string;
  name: string;
  type: string;
  legend: string;
};

export type ArmyDetachment = {
  id: string;
  army_id: string;
  detachment_id?: string;
  name: string;
  faction_id: string;
};

export type UnitOptionSelection = {
  line: string;
  description: string;
  choice: string;
  isDefault: boolean;
};

export type ArmyUnit = {
  id: string;
  army_id: string;
  detachment_id: string;
  datasheet_id: string;
  quantity: number;
  points: number;
  options?: UnitOptionSelection[];
  leads_unit_id?: string;
};

export type Datasheet = {
  id: string;
  faction_id: string;
  name: string;
  leader_footer?: string;
};

export type DatasheetModelCost = {
  datasheet_id: string;
  line: string;
  description: string;
  cost: string;
};

export type DatasheetOption = {
  datasheet_id: string;
  line: string;
  description: string;
  button?: string;
};

export type PageData = {
  armyId: string;
};

export type OptionGroup = {
  key: string;
  prompt: string;
  choices: string[];
  defaultLabel: string;
};

export type Collection = {
  armies: FactionCollection[];
};

export type FactionCollection = {
  id: string;
  faction_id: string;
};

export type CollectionUnit = {
  id: string;
  factionCollection_id: string;
  datasheet_id: string;
  quantity: number;
  is_painted: boolean;
};

export type Detachment = {
  id: string;
  faction_id: string;
  name: string;
  type: string;
  legend: string;
  dp: number;
  force_disposition: string;
};

export type DetachmentAbility = {
  id: string;
  faction_id: string;
  name: string;
  description: string;
  legend: string;
  detachment: string;
  detachment_id: string;
};

export type Ability = {
  id: string;
  name: string;
  legend: string;
  faction_id: string;
  description: string;
};

export type DatasheetLeader = {
  leader_id: string;
  attached_id: string;
};
