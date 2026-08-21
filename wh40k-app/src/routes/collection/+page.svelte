<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { db } from '$lib/db';
  import { longpress } from '$lib/longpress';
  import type { FactionCollection, CollectionUnit } from '$lib/types';

  type UnitRow = CollectionUnit & { datasheetName: string };
  type FactionGroup = {
    factionCollection: FactionCollection;
    factionName: string;
    units: UnitRow[];
  };

  let groups = $state<FactionGroup[]>([]);
  let loading = $state(true);
  let expanded = $state<Record<string, boolean>>({});

  function toggleExpanded(id: string) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }

  async function loadCollection() {
    const factionCollections = await db.faction_collections.toArray();
    const result: FactionGroup[] = [];

    for (const fc of factionCollections) {
      const faction = await db.factions.get(fc.faction_id);
      const units = await db.collection_units
        .where('factionCollection_id')
        .equals(fc.id)
        .toArray();

      const unitsWithNames: UnitRow[] = await Promise.all(
        units.map(async (u) => {
          const datasheet = await db.datasheets.get(u.datasheet_id);
          return { ...u, datasheetName: datasheet?.name ?? 'Unknown unit' };
        })
      );

      if (unitsWithNames.length === 0) continue;

      result.push({
        factionCollection: fc,
        factionName: faction?.name ?? 'Unknown faction',
        units: unitsWithNames
      });
    }

    groups = result;
    loading = false;
  }

  async function removeUnit(unitId: string) {
    await db.collection_units.delete(unitId);
    await loadCollection();
  }

  // when shrinking, drop an unpainted model first so painted progress isn't lost by accident
  function removeOneModel(painted: boolean[]): boolean[] {
    const idx = painted.lastIndexOf(false);
    const removeIdx = idx !== -1 ? idx : painted.length - 1;
    return [...painted.slice(0, removeIdx), ...painted.slice(removeIdx + 1)];
  }

  async function decrementUnit(unit: UnitRow) {
    if (unit.quantity <= 1) {
      await removeUnit(unit.id);
    } else {
      const painted_models = removeOneModel(unit.painted_models);
      await db.collection_units.update(unit.id, { quantity: unit.quantity - 1, painted_models });
      await loadCollection();
    }
  }

  async function incrementUnit(unit: UnitRow) {
    const painted_models = [...unit.painted_models, false];
    await db.collection_units.update(unit.id, { quantity: unit.quantity + 1, painted_models });
    await loadCollection();
  }

  async function toggleModelPainted(unit: UnitRow, index: number) {
    const painted_models = [...unit.painted_models];
    painted_models[index] = !painted_models[index];
    await db.collection_units.update(unit.id, { painted_models });
    await loadCollection();
  }

  function paintedCount(unit: UnitRow) {
    return unit.painted_models.filter(Boolean).length;
  }

  onMount(loadCollection);
</script>

<div class="p-4 max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">My Collection</h1>

  {#if loading}
    <p class="text-gray-500">Loading…</p>
  {:else if groups.length === 0}
    <p class="text-gray-500">Your collection is empty.</p>
  {:else}
    <div class="space-y-4">
      {#each groups as group (group.factionCollection.id)}
      <section class="border-b pb-3">
        <details class="group">
          <summary class="flex cursor-pointer items-center justify-between select-none marker:content-none py-1">
            <h2 class="text-lg font-semibold">{group.factionName}</h2>
          </summary>

          <div class="space-y-1 mt-2">
            {#each group.units as unit (unit.id)}
              <div class="rounded hover:bg-gray-50">
                <div class="flex items-center justify-between gap-2 p-1.5">
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    role="button"
                    tabindex="0"
                    class="font-medium min-w-0 flex-1 cursor-pointer select-none"
                    style="touch-action: manipulation;"
                    use:longpress={500}
                    onlongpress={() => goto(`/datasheets/${unit.datasheet_id}`)}
                    onshortpress={() => toggleExpanded(unit.id)}
                    oncontextmenu={(e) => e.preventDefault()}
                    onkeydown={(e) => {
                      if (e.key === 'Enter') goto(`/datasheets/${unit.datasheet_id}`);
                    }}
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <p class="text-base sm:text-lg font-semibold truncate">{unit.datasheetName}</p>
                      <p class="text-xs font-semibold shrink-0 text-gray-500">
                        {paintedCount(unit)}/{unit.quantity} painted
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      class="rounded bg-gray-200 w-6 h-6 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-300"
                      onclick={() => decrementUnit(unit)}
                    >
                      −
                    </button>
                    <span class="w-5 text-center text-sm">{unit.quantity}</span>
                    <button
                      type="button"
                      class="rounded bg-gray-200 w-6 h-6 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-300"
                      onclick={() => incrementUnit(unit)}
                    >
                      +
                    </button>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                      type="button"
                      class="rounded bg-red-100 text-red-700 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-red-200"
                      onclick={() => removeUnit(unit.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                        <path d="M0 0h16v16H0z" fill="none" />
                        <path fill="currentColor" fill-rule="evenodd" d="M5.75 3V1.5h4.5V3zm-1.5 0V1a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v2h2.5a.75.75 0 0 1 0 1.5h-.365l-.743 9.653A2 2 0 0 1 11.148 16H4.852a2 2 0 0 1-1.994-1.847L2.115 4.5H1.75a.75.75 0 0 1 0-1.5zm-.63 1.5h8.76l-.734 9.538a.5.5 0 0 1-.498.462H4.852a.5.5 0 0 1-.498-.462z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {#if expanded[unit.id]}
                  <div class="flex flex-wrap gap-1.5 px-1.5 pb-2 pl-4">
                    {#each unit.painted_models as isPainted, i}
                      <button
                        type="button"
                        onclick={() => toggleModelPainted(unit, i)}
                        class="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition-colors
                          {isPainted
                            ? 'bg-green-500 text-white border-green-600'
                            : 'bg-gray-100 text-gray-500 border-gray-300'}"
                        title={`Model ${i + 1}: ${isPainted ? 'painted' : 'unpainted'}`}
                      >
                        {i + 1}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          </details>
        </section>
      {/each}
    </div>
  {/if}
</div>