<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import type { FactionCollection, CollectionUnit } from '$lib/types';

  type UnitRow = CollectionUnit & { datasheetName: string };
  type FactionGroup = {
    factionCollection: FactionCollection;
    factionName: string;
    units: UnitRow[];
  };

  let groups = $state<FactionGroup[]>([]);
  let loading = $state(true);

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

  async function decrementUnit(unit: UnitRow) {
    if (unit.quantity <= 1) {
      await removeUnit(unit.id);
    } else {
      await db.collection_units.update(unit.id, { quantity: unit.quantity - 1 });
      await loadCollection();
    }
  }

  async function incrementUnit(unit: UnitRow) {
    await db.collection_units.update(unit.id, { quantity: unit.quantity + 1 });
    await loadCollection();
  }

  async function statusPaintedChange(unit: UnitRow) {
    await db.collection_units.update(unit.id, {is_painted: !unit.is_painted})
    await loadCollection();
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
              <div class="flex items-center justify-between gap-2 rounded p-1.5 hover:bg-gray-50">
                <a
                  class="font-medium min-w-0 flex-1"
                  href={`/datasheets/${unit.datasheet_id}`}
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <p class="text-base sm:text-lg font-semibold truncate">{unit.datasheetName}</p>
                    {#if unit.is_painted}
                      <p class="text-green-600 text-xs font-semibold shrink-0">P</p>
                    {/if}
                  </div>
                </a>
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
                  {#if !unit.is_painted}
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                      type="button"
                      class="rounded bg-green-100 text-green-700 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-green-200"
                      onclick={() => statusPaintedChange(unit)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path fill="currentColor" d="M6 21q-1.125 0-2.225-.55T2 19q.65 0 1.325-.513T4 17q0-1.25.875-2.125T7 14t2.125.875T10 17q0 1.65-1.175 2.825T6 21m5.75-6L9 12.25l8.95-8.95q.275-.275.688-.288t.712.288l1.35 1.35q.3.3.3.7t-.3.7z" />
                      </svg>
                    </button>
                  {:else}
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                        type="button"
                        class="rounded bg-red-100 text-red-700 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-red-200"
                        onclick={() => statusPaintedChange(unit)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512">
                          <path d="M0 0h512v512H0z" fill="none" />
                          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M452.37 59.63a40.49 40.49 0 0 0-57.26 0L184 294.74c23.08 4.7 46.12 27.29 49.26 49.26l219.11-227.11a40.49 40.49 0 0 0 0-57.26M138 336c-29.88 0-54 24.5-54 54.86c0 23.95-20.88 36.57-36 36.57C64.56 449.74 92.82 464 120 464c39.78 0 72-32.73 72-73.14c0-30.36-24.12-54.86-54-54.86" />
                        </svg>
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
          </details>
        </section>
      {/each}
    </div>
  {/if}
</div>