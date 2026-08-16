<script lang="ts">
  import type { ArmyDetachment, ArmyUnit, Datasheet, DatasheetModelCost, DatasheetOption, Faction } from '$lib/types';
  import AddUnitForm from './AddUnitForm.svelte';
  import UnitRow from './UnitRow.svelte';
  import { addUnit as addUnitRecord, removeUnit, updateUnit } from '$lib/armyRepository';
  import { getUnitCost, getOptionGroups, getLeaderTargetDatasheetIds } from '$lib/datasheetParsing';

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

  function datasheetName(datasheetId: string) {
    return datasheets.find((s) => s.id === datasheetId)?.name ?? datasheetId;
  }

  // Cache of datasheet_id -> eligible target names (from its Leader ability).
  // Populated lazily as units with new datasheets appear.
  let leaderTargetsByDatasheet = $state<Record<string, string[]>>({});

  $effect(() => {
    const datasheetIds = [...new Set(detachment.units.map((u) => u.datasheet_id))];
    for (const id of datasheetIds) {
      if (id in leaderTargetsByDatasheet) continue;
      getLeaderTargetDatasheetIds(id).then((targets) => {
        leaderTargetsByDatasheet = { ...leaderTargetsByDatasheet, [id]: targets };
      });
    }
  });

  function canLead(unit: ArmyUnit): boolean {
    return (leaderTargetsByDatasheet[unit.datasheet_id]?.length ?? 0) > 0;
  }

  function eligibleTargetsFor(unit: ArmyUnit): { id: string; label: string }[] {
    const targetDatasheetIds = leaderTargetsByDatasheet[unit.datasheet_id] ?? [];
    if (targetDatasheetIds.length === 0) return [];

    return detachment.units
      .filter((u) => u.id !== unit.id)
      .filter((u) => targetDatasheetIds.includes(u.datasheet_id))
      .filter((u) => {
        const currentLeader = detachment.units.find((other) => other.leads_unit_id === u.id);
        return !currentLeader || currentLeader.id === unit.id;
      })
      .map((u) => ({ id: u.id, label: datasheetName(u.datasheet_id) }));
  }

  function ledByName(unit: ArmyUnit): string | undefined {
    const leader = detachment.units.find((u) => u.leads_unit_id === unit.id);
    return leader ? datasheetName(leader.datasheet_id) : undefined;
  }

  async function handleSetLeads(leaderUnitId: string, targetUnitId: string | null) {
    const leaderUnit = detachment.units.find((u) => u.id === leaderUnitId);
    if (!leaderUnit) return;

    const updated: ArmyUnit = {
      ...$state.snapshot(leaderUnit),
      leads_unit_id: targetUnitId ?? undefined
    };
    await updateUnit(updated);
    onUnitsChanged(
      detachment.id,
      detachment.units.map((u) => (u.id === leaderUnitId ? updated : u))
    );
  }

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
    const affectedLeader = detachment.units.find((u) => u.leads_unit_id === unitId);
    if (affectedLeader) {
      await updateUnit({ ...$state.snapshot(affectedLeader), leads_unit_id: undefined });
    }

    await removeUnit(unitId);
    onUnitsChanged(
      detachment.id,
      detachment.units
        .filter((u) => u.id !== unitId)
        .map((u) => (u.id === affectedLeader?.id ? { ...u, leads_unit_id: undefined } : u))
    );
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
            datasheetName={datasheetName(unit.datasheet_id)}
            canLead={canLead(unit)}
            eligibleTargets={eligibleTargetsFor(unit)}
            ledByName={ledByName(unit)}
            onDelete={handleDeleteUnit}
            onSetLeads={(targetId) => handleSetLeads(unit.id, targetId)}
          />
        {/each}
      </div>
    {/if}
  </div>
</article>