<script lang="ts">
  import type { ArmyDetachment, ArmyUnit, Datasheet, DatasheetModelCost, DatasheetOption, Faction } from '$lib/types';
  import AddUnitForm from './AddUnitForm.svelte';
  import UnitRow from './UnitRow.svelte';
  import { addUnit as addUnitRecord, removeUnit, updateUnit } from '$lib/armyRepository';
  import { getUnitCost, getOptionGroups, getLeaderTargetDatasheetIds, allowsStackingWithExistingLeader, ROLE_PRIORITY, getBattlefieldRole } from '$lib/datasheetParsing';

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
  let roleByDatasheet = $state<Record<string, string>>({});

  $effect(() => {
    const datasheetIds = [...new Set(detachment.units.map((u) => u.datasheet_id))];
    for (const id of datasheetIds) {
      if (id in leaderTargetsByDatasheet) continue;
      getLeaderTargetDatasheetIds(id).then((targets) => {
        leaderTargetsByDatasheet = { ...leaderTargetsByDatasheet, [id]: targets };
      });
    }
  });

  $effect(() => {
    const datasheetIds = [...new Set(detachment.units.map((u) => u.datasheet_id))];
    for (const id of datasheetIds) {
      if (id in roleByDatasheet) continue;
      getBattlefieldRole(id).then((role) => {
        roleByDatasheet = { ...roleByDatasheet, [id]: role };
      });
    }
  });

  const groupedUnits = $derived.by(() => {
    const groups = new Map<string, ArmyUnit[]>();
    for (const unit of detachment.units) {
      const role = roleByDatasheet[unit.datasheet_id] ?? 'Other';
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role)!.push(unit);
    }

    const ordered: { role: string; units: ArmyUnit[] }[] = [];
    for (const role of [...ROLE_PRIORITY, 'Other']) {
      if (groups.has(role)) ordered.push({ role, units: groups.get(role)! });
    }
    return ordered;
  });

  function canLead(unit: ArmyUnit): boolean {
    return (leaderTargetsByDatasheet[unit.datasheet_id]?.length ?? 0) > 0;
  }

  function leaderFooterFor(datasheetId: string): string | undefined {
    return datasheets.find((s) => s.id === datasheetId)?.leader_footer;
  }

  const unitDisplayLabels = $derived.by(() => {
    const countByDatasheet = new Map<string, number>();
    for (const u of detachment.units) {
      countByDatasheet.set(u.datasheet_id, (countByDatasheet.get(u.datasheet_id) ?? 0) + 1);
    }

    const seenIndex = new Map<string, number>();
    const labels = new Map<string, string>(); // unit.id -> label

    for (const u of detachment.units) {
      const baseName = datasheetName(u.datasheet_id);
      const total = countByDatasheet.get(u.datasheet_id) ?? 1;
      if (total <= 1) {
        labels.set(u.id, baseName);
        continue;
      }
      const idx = (seenIndex.get(u.datasheet_id) ?? 0) + 1;
      seenIndex.set(u.datasheet_id, idx);
      labels.set(u.id, `${baseName} #${idx}`);
    }

    return labels;
  });

  function unitLabel(unit: ArmyUnit): string {
    return unitDisplayLabels.get(unit.id) ?? datasheetName(unit.datasheet_id);
  }

  function eligibleTargetsFor(unit: ArmyUnit): { id: string; label: string }[] {
    const targetDatasheetIds = leaderTargetsByDatasheet[unit.datasheet_id] ?? [];
    if (targetDatasheetIds.length === 0) return [];

    const canStack = allowsStackingWithExistingLeader(leaderFooterFor(unit.datasheet_id));

    return detachment.units
      .filter((u) => u.id !== unit.id)
      .filter((u) => targetDatasheetIds.includes(u.datasheet_id))
      .filter((u) => {
        const existingLeaders = detachment.units.filter((other) => other.leads_unit_id === u.id);
        const sameLeaderAlreadyAttached = existingLeaders.some(
          (l) => l.datasheet_id === unit.datasheet_id && l.id !== unit.id
        );
        if (sameLeaderAlreadyAttached) return false;

        if (existingLeaders.length === 0) return true;
        if (existingLeaders.some((l) => l.id === unit.id)) return true;
        return canStack;
      })
      .map((u) => ({ id: u.id, label: unitLabel(u) }));
  }

  function ledByNames(unit: ArmyUnit): string[] {
    return detachment.units
      .filter((u) => u.leads_unit_id === unit.id)
      .map((u) => unitLabel(u));
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
      <div class="space-y-4">
        {#if detachment.units.length === 0}
          <p class="text-sm text-gray-500">No units added yet.</p>
        {:else}
          {#each groupedUnits as group (group.role)}
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                {group.role}
              </h3>
              <div class="grid gap-2">
                {#each group.units as unit (unit.id)}
                  <UnitRow
                    {unit}
                    datasheetName={unitLabel(unit)}
                    canLead={canLead(unit)}
                    eligibleTargets={eligibleTargetsFor(unit)}
                    ledByNames={ledByNames(unit)}
                    onDelete={handleDeleteUnit}
                    onSetLeads={(targetId) => handleSetLeads(unit.id, targetId)}
                  />
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</article>