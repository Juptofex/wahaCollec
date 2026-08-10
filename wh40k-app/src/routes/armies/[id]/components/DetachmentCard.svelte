<script lang="ts">
  import type { ArmyDetachment, ArmyUnit, Datasheet, DatasheetModelCost, DatasheetOption, Faction } from '$lib/types';
  import AddUnitForm from './AddUnitForm.svelte';
  import UnitRow from './UnitRow.svelte';
  import { addUnit as addUnitRecord, removeUnit } from '$lib/armyRepository';
  import { getUnitCost, getOptionGroups } from '$lib/datasheetParsing';

  let {
    detachment,
    factionName,
    datasheets,
    modelCosts,
    datasheetOptions,
    onUnitsChanged,
    onRemove
  }: {
    detachment: ArmyDetachment & { units: ArmyUnit[] };
    factionName: string | undefined;
    datasheets: Datasheet[];
    modelCosts: DatasheetModelCost[];
    datasheetOptions: DatasheetOption[];
    onUnitsChanged: (detachmentId: string, units: ArmyUnit[]) => void;
    onRemove: (detachment: ArmyDetachment) => void;
  } = $props();

  const factionDatasheets = $derived(datasheets.filter((s) => s.faction_id === detachment.faction_id));
  const points = $derived(detachment.units.reduce((sum, u) => sum + u.points, 0));

  async function handleAddUnit(formData: FormData) {
    const datasheetId = String(formData.get('datasheet_id') ?? '');
    const quantity = Number(formData.get('quantity') ?? 1);
    if (!datasheetId) return;

    const points = getUnitCost(modelCosts, datasheetId, quantity);
    if (points === null) return;

    const optionSelections = getOptionGroups(datasheetOptions, datasheetId).map((group) => {
      const raw = String(formData.get(`option_${group.key}`) ?? '__default__');
      const isDefault = raw === '__default__' || raw === '';
      return { line: group.key, description: group.prompt, choice: isDefault ? group.defaultLabel : raw, isDefault };
    });

    const newUnit: ArmyUnit = {
      id: crypto.randomUUID(),
      army_id: detachment.army_id,
      detachment_id: detachment.id,
      datasheet_id: datasheetId,
      quantity,
      points,
      options: optionSelections
    };

    await addUnitRecord(newUnit);
    onUnitsChanged(detachment.id, [...detachment.units, newUnit]);
  }

  async function handleDeleteUnit(unitId: string) {
    await removeUnit(unitId);
    onUnitsChanged(detachment.id, detachment.units.filter((u) => u.id !== unitId));
  }
</script>

<article class="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
  <div class="flex items-start justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-wide text-gray-400">{factionName}</p>
      <a href={`/factions/${detachment.faction_id}/detachments/${detachment.detachment_id}`}>
        <p class="text-lg font-semibold">{detachment.name}</p>
      </a>
      <p>{points} pts</p>
    </div>
    <button type="button" class="rounded bg-red-600 px-3 py-1 text-white text-sm cursor-pointer hover:bg-red-700" onclick={() => onRemove(detachment)}>
      Remove
    </button>
  </div>

  <AddUnitForm {factionDatasheets} {modelCosts} {datasheetOptions} onSubmit={handleAddUnit} />

  <div class="space-y-2">
    {#if detachment.units.length === 0}
      <p class="text-sm text-gray-500">No units added yet.</p>
    {:else}
      <div class="grid gap-2">
        {#each detachment.units as unit}
          <UnitRow
            {unit}
            datasheetName={datasheets.find((s) => s.id === unit.datasheet_id)?.name ?? unit.datasheet_id}
            onDelete={handleDeleteUnit}
          />
        {/each}
      </div>
    {/if}
  </div>
</article>