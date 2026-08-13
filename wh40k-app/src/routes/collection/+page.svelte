<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import type { FactionCollection, CollectionUnit, Faction, Datasheet } from '$lib/types';

  type UnitRow = CollectionUnit & { datasheetName: string };
  type FactionGroup = {
    factionCollection: FactionCollection;
    factionName: string;
    units: UnitRow[];
  };

  let groups = $state<FactionGroup[]>([]);
  let loading = $state(true);

  async function loadCollection() {
    loading = true;

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

  onMount(loadCollection);
</script>

<div class="p-4 max-w-3xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">My Collection</h1>

  {#if loading}
    <p class="text-gray-500">Loading…</p>
  {:else if groups.length === 0}
    <p class="text-gray-500">Your collection is empty.</p>
  {:else}
    <div class="space-y-6">
      {#each groups as group}
        <div>
          <h2 class="text-lg font-semibold mb-2">{group.factionName}</h2>
          <div class="space-y-2">
            {#each group.units as unit}
              <div class="flex items-center justify-between border rounded p-2">
                <a
                  class="font-medium"
                  href={`/datasheets/${unit.datasheet_id}`}
                >
                  <p class="text-lg font-semibold">{unit.datasheetName}</p>
                </a>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded bg-gray-200 px-2 py-1 text-sm cursor-pointer hover:bg-gray-300"
                    onclick={() => decrementUnit(unit)}
                  >
                    −
                  </button>
                  <span class="w-6 text-center">{unit.quantity}</span>
                  <button
                    type="button"
                    class="rounded bg-gray-200 px-2 py-1 text-sm cursor-pointer hover:bg-gray-300"
                    onclick={() => incrementUnit(unit)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    class="rounded bg-red-100 text-red-700 px-2 py-1 text-sm cursor-pointer hover:bg-red-200"
                    onclick={() => removeUnit(unit.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>