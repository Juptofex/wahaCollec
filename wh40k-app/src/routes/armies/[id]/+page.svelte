<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';

  type Army = {
    id: string;
    name: string;
    faction_id?: string;
    points_limit?: number;
    created_at: number;
    updated_at: number;
  };

  type Faction = {
    id: string;
    name: string;
    link: string;
  };

  type DetachmentCatalog = {
    id: string;
    faction_id: string;
    name: string;
    type: string;
    legend: string;
  };

  type ArmyDetachment = {
    id: string;
    army_id: string;
    detachment_id?: string;
    name: string;
    faction_id: string;
  };

  type ArmyUnit = {
    id: string;
    army_id: string;
    detachment_id: string;
    datasheet_id: string;
    quantity: number;
    points: number;
  };

  type Datasheet = {
    id: string;
    faction_id: string;
    name: string;
  };

  type DatasheetModelCost = {
    datasheet_id: string;
    line: string;
    description: string;
    cost: string;
  };

  type PageData = {
    armyId: string;
  };

  let { data }: { data: PageData } = $props();

  let army = $state<Army | null>(null);
  let factions = $state<Faction[]>([]);
  let detachmentCatalog = $state<DetachmentCatalog[]>([]);
  let armyDetachments = $state<Array<ArmyDetachment & { units: ArmyUnit[] }>>([]);
  let datasheets = $state<Datasheet[]>([]);
  let modelCosts = $state<DatasheetModelCost[]>([]);

  let loading = $state(true);
  let savingArmy = $state(false);
  let savingDetachment = $state(false);
  let error = $state('');

  let selectedFactionId = $state('');
  let selectedDetachmentId = $state('');

  async function loadPageData() {
    const [armyRecord, factionList, detachmentList, armyDetachmentRows, armyUnitRows, datasheetList, costList] =
      await Promise.all([
        db.armies.get(data.armyId),
        db.factions.toArray(),
        fetch('/data/Detachments.json').then((response) => response.json() as Promise<DetachmentCatalog[]>),
        db.army_detachments.where('army_id').equals(data.armyId).toArray(),
        db.army_units.where('army_id').equals(data.armyId).toArray(),
        db.datasheets.toArray(),
        fetch('/data/Datasheets_models_cost.json').then((response) => response.json() as Promise<DatasheetModelCost[]>)
      ]);

    if (!armyRecord) {
      throw new Error('Army not found');
    }

    army = armyRecord;
    factions = factionList;
    detachmentCatalog = detachmentList;
    datasheets = datasheetList;
    modelCosts = costList;
    armyDetachments = armyDetachmentRows.map((detachment) => ({
      ...detachment,
      units: armyUnitRows.filter((unit) => unit.detachment_id === detachment.id)
    }));

    if (!selectedFactionId) {
      selectedFactionId = armyRecord.faction_id ?? factionList[0]?.id ?? '';
    }
  }

  function parseModelCount(description: string) {
    const matches = description.match(/\d+/g);
    if (!matches) return 0;
    return matches.map(Number).reduce((total, value) => total + value, 0);
  }

  function getUnitCost(datasheetId: string, quantity: number) {
    const options = modelCosts
      .filter((item) => item.datasheet_id === datasheetId)
      .map((item) => ({
        quantity: parseModelCount(item.description),
        cost: Number(item.cost)
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.quantity - b.quantity);

    const exactMatch = options.find((item) => item.quantity === quantity);
    return exactMatch?.cost ?? null;
  }

  function getDetachmentPoints(detachmentId: string) {
    const detachment = armyDetachments.find((item) => item.id === detachmentId);
    return detachment?.units.reduce((total, unit) => total + unit.points, 0) ?? 0;
  }

  function getArmyPoints() {
    return armyDetachments.reduce(
      (total, detachment) => total + detachment.units.reduce((sum, unit) => sum + unit.points, 0),
      0,
    );
  }

  async function saveArmyFaction(factionId: string) {
    if (!army) return;

    savingArmy = true;
    error = '';

    try {
        const updatedArmy: Army = {
        id: army.id,
        name: army.name,
        faction_id: factionId,
        points_limit: army.points_limit,
        created_at: army.created_at,
        updated_at: Date.now()
        };

        army = updatedArmy;
        await db.armies.put(updatedArmy);
    } catch (e) {
        console.error(e);
        error = 'Impossible de sauvegarder la faction de l’armée.';
    } finally {
        savingArmy = false;
    }
    }

  async function addDetachment() {
    error = '';

    const selectedDetachment = detachmentCatalog.find((item) => item.id === selectedDetachmentId);
    if (!selectedDetachment || !selectedFactionId) {
      error = 'Choisis une faction et un détachement.';
      return;
    }

    savingDetachment = true;

    try {
      const detachment: ArmyDetachment = {
        id: crypto.randomUUID(),
        army_id: data.armyId,
        detachment_id: selectedDetachment.id,
        name: selectedDetachment.name,
        faction_id: selectedFactionId
      };

      await db.army_detachments.add(detachment);
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible d’ajouter le détachement.';
    } finally {
      savingDetachment = false;
    }
  }

  async function addUnit(detachment: ArmyDetachment, event: SubmitEvent) {
    event.preventDefault();
    error = '';

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const datasheetId = String(formData.get('datasheet_id') ?? '');
    const quantity = Number(formData.get('quantity') ?? 1);

    if (!datasheetId) {
      error = 'Choisis une unité.';
      return;
    }

    const points = getUnitCost(datasheetId, quantity);
    if (points === null) {
      error = 'No point cost found for this unit size.';
      return;
    }

    try {
      await db.army_units.add({
        id: crypto.randomUUID(),
        army_id: data.armyId,
        detachment_id: detachment.id,
        datasheet_id: datasheetId,
        quantity,
        points
      });

      form.reset();
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible d’ajouter l’unité.';
    }
  }

  async function deleteUnit(unitId: string) {
    try {
      await db.army_units.delete(unitId);
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible de supprimer l’unité.';
    }
  }

  async function deleteDetachment(detachment: ArmyDetachment) {
    const confirmed = confirm(`Supprimer le détachement "${detachment.name}" ?`);
    if (!confirmed) return;

    try {
      const units = await db.army_units.where('detachment_id').equals(detachment.id).toArray();
      await db.army_units.bulkDelete(units.map((unit) => unit.id));
      await db.army_detachments.delete(detachment.id);
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible de supprimer le détachement.';
    }
  }

  $effect(() => {
    const options = detachmentCatalog.filter((item) => item.faction_id === selectedFactionId);
    if (!options.length) {
      selectedDetachmentId = '';
      return;
    }

    if (!options.some((item) => item.id === selectedDetachmentId)) {
      selectedDetachmentId = options[0].id;
    }
  });

  onMount(async () => {
    loading = true;
    try {
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible de charger l’armée.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4 max-w-5xl mx-auto space-y-6">
  {#if loading}
    <p class="text-gray-500">Chargement...</p>
  {:else if army}
    <header class="rounded-2xl border bg-slate-900 text-white p-5 shadow-md">
      <p class="text-xs uppercase tracking-wide text-slate-400">Army builder</p>
      <h1 class="text-2xl font-bold mt-1">{army.name}</h1>
      <p class="text-sm text-slate-300 mt-2">
        {getArmyPoints()} / {army.points_limit ? `${army.points_limit} pts` : 'Pas de limite de points'}
      </p>
    </header>

    {#if error}
      <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
    {/if}

    <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Army faction</h2>
        {#if savingArmy}
          <span class="text-xs text-gray-500">Saving...</span>
        {/if}
      </div>

      <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label class="block">
          <span class="block text-sm font-medium mb-1">Faction</span>
          <select
            class="w-full rounded border px-3 py-2"
            bind:value={selectedFactionId}
            onchange={() => saveArmyFaction(selectedFactionId)}
          >
            <option value="">Choose a faction</option>
            {#each factions as faction}
              <option value={faction.id}>{faction.name}</option>
            {/each}
          </select>
        </label>

        <p class="text-sm text-gray-500">
          Pick one faction as your current focus, then add detachments from any faction below.
        </p>
      </div>
    </section>

    <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <h2 class="text-lg font-semibold">Add detachment</h2>

      <div class="grid gap-3 md:grid-cols-2">
        <label class="block">
          <span class="block text-sm font-medium mb-1">Faction</span>
          <select class="w-full rounded border px-3 py-2" bind:value={selectedFactionId}>
            {#each factions as faction}
              <option value={faction.id}>{faction.name}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="block text-sm font-medium mb-1">Detachment</span>
          <select class="w-full rounded border px-3 py-2" bind:value={selectedDetachmentId}>
            {#each detachmentCatalog.filter((item) => item.faction_id === selectedFactionId) as detachment}
              <option value={detachment.id}>{detachment.name}</option>
            {/each}
          </select>
        </label>
      </div>

      <button
        type="button"
        class="rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-50"
        onclick={addDetachment}
        disabled={savingDetachment || !selectedDetachmentId}
      >
        {savingDetachment ? 'Adding...' : 'Add detachment'}
      </button>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Detachments in this army</h2>

      {#if armyDetachments.length === 0}
        <p class="text-gray-500">No detachments added yet.</p>
      {:else}
        <div class="grid gap-4">
          {#each armyDetachments as detachment}
            <article class="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-wide text-gray-400">
                    {factions.find((item) => item.id === detachment.faction_id)?.name}
                  </p>
                  <h3 class="text-lg font-semibold">{detachment.name}</h3>
                  <p>
                    {getDetachmentPoints(detachment.id)} pts
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded bg-red-600 px-3 py-1 text-white text-sm cursor-pointer hover:bg-red-700"
                  onclick={() => deleteDetachment(detachment)}
                >
                  Remove
                </button>
              </div>

              <form class="grid gap-3 md:grid-cols-[2fr_80px_auto]" onsubmit={(event) => addUnit(detachment, event)}>
                <label class="block">
                  <span class="block text-sm font-medium mb-1">Unit</span>
                  <select name="datasheet_id" class="w-full rounded border px-3 py-2">
                    <option value="">Choose a unit</option>
                    {#each datasheets.filter((sheet) => sheet.faction_id === detachment.faction_id) as sheet}
                      <option value={sheet.id}>{sheet.name}</option>
                    {/each}
                  </select>
                </label>

                <label class="block">
                  <span class="block text-sm font-medium mb-1">Qty</span>
                  <input name="quantity" type="number" min="1" value="1" class="w-full rounded border px-3 py-2" />
                </label>

                <button
                  type="submit"
                  class="self-end rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700"
                >
                  Add unit
                </button>
              </form>

              <div class="space-y-2">
                {#if detachment.units.length === 0}
                  <p class="text-sm text-gray-500">No units added yet.</p>
                {:else}
                  <div class="grid gap-2">
                    {#each detachment.units as unit}
                      <article class="rounded-xl border bg-slate-50 p-3 flex items-start justify-between gap-3">
                        <div>
                          <p class="font-medium">
                            {datasheets.find((sheet) => sheet.id === unit.datasheet_id)?.name ?? unit.datasheet_id}
                          </p>
                          <p class="text-xs text-gray-500">
                            Qty: {unit.quantity} · {unit.points} pts
                          </p>
                        </div>

                        <button
                          type="button"
                          class="rounded bg-red-600 px-3 py-1 text-white text-sm cursor-pointer hover:bg-red-700"
                          onclick={() => deleteUnit(unit.id)}
                        >
                          Remove
                        </button>
                      </article>
                    {/each}
                  </div>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <p class="text-gray-500">Army not found.</p>
  {/if}
</div>