<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import { getDetachments, getModelCosts } from '$lib/gameData';

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

  type UnitOptionSelection = {
    line: string;
    description: string;
    choice: string;
    isDefault: boolean;
  };

  type ArmyUnit = {
    id: string;
    army_id: string;
    detachment_id: string;
    datasheet_id: string;
    quantity: number;
    points: number;
    options?: UnitOptionSelection[];
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

  type DatasheetOption = {
    datasheet_id: string;
    line: string;
    description: string;
    button?: string;
  };

  type PageData = {
    armyId: string;
  };

  type OptionGroup = {
    key: string;
    prompt: string; 
    choices: string[];
    defaultLabel: string;
  };

  let { data }: { data: PageData } = $props();

  let army = $state<Army | null>(null);
  let factions = $state<Faction[]>([]);
  let detachmentCatalog = $state<DetachmentCatalog[]>([]);
  let armyDetachments = $state<Array<ArmyDetachment & { units: ArmyUnit[] }>>([]);
  let datasheets = $state<Datasheet[]>([]);
  let modelCosts = $state<DatasheetModelCost[]>([]);
  let datasheetOptions = $state<DatasheetOption[]>([]);

  let loading = $state(true);
  let savingArmy = $state(false);
  let savingDetachment = $state(false);
  let error = $state('');

  let selectedFactionId = $state('');
  let selectedDetachmentId = $state('');
  let selectedDatasheetByDetachment = $state<Record<string, string>>({});
  let selectedQuantityByDetachment = $state<Record<string, number>>({});

  async function loadPageData() {
    const [armyRecord, factionList, detachmentList, armyDetachmentRows, armyUnitRows, costList, optionList] =
      await Promise.all([
        db.armies.get(data.armyId),
        db.factions.toArray(),
        getDetachments(),
        db.army_detachments.where('army_id').equals(data.armyId).toArray(),
        db.army_units.where('army_id').equals(data.armyId).toArray(),
        getModelCosts(),
        db.datasheet_options.toArray()
      ]);

    if (!armyRecord) {
      throw new Error('Army not found');
    }

    const factionIds = [...new Set(armyDetachmentRows.map((d) => d.faction_id))];
    const datasheetList = factionIds.length
      ? await db.datasheets.where('faction_id').anyOf(factionIds).toArray()
      : [];

    army = armyRecord;
    factions = factionList;
    detachmentCatalog = detachmentList;
    datasheets = datasheetList;
    modelCosts = costList;
    datasheetOptions = optionList;
    armyDetachments = armyDetachmentRows.map((detachment) => ({
      ...detachment,
      units: armyUnitRows.filter((unit) => unit.detachment_id === detachment.id)
    }));

    selectedDatasheetByDetachment = Object.fromEntries(
      armyDetachmentRows.map((detachment) => [detachment.id, ''])
    );
    selectedQuantityByDetachment = Object.fromEntries(
      armyDetachmentRows.map((detachment) => [detachment.id, 1])
    );

    if (!selectedFactionId) {
      selectedFactionId = armyRecord.faction_id ?? factionList[0]?.id ?? '';
    }
  }

  function parseModelCount(description: string) {
    const matches = description.match(/\d+/g);
    if (!matches) return 0;
    return matches.map(Number).reduce((total, value) => total + value, 0);
  }

  function stripHtml(description: string) {
    return description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function extractDefaultLabel(rawDescription: string): string {
    const beforeList = rawDescription.split(/<ul/i)[0];
    const text = stripHtml(beforeList);

    const isEquipOnly = /\bequipped with\b/i.test(text) && !/\breplaced with\b/i.test(text);
    if (isEquipOnly) return 'None';

    const idx = text.search(/\breplaced with\b/i);
    if (idx < 0) return 'Standard';

    let subject = text.slice(0, idx);
    subject = subject
      .replace(/^for every \d+ models? in this unit,?\s*/i, '')
      .replace(/^if this unit contains \d+ models?,?\s*/i, '');

    let match = subject.match(/have (?:their|its)\s+(.+?)\s*$/i);

    if (!match) {
      match = subject.match(/(?:’s|'s)\s+(.+?)\s*$/i);
    }

    if (!match) return 'Standard';

    const label = match[1].replace(/\s*\bcan (each )?be\s*$/i, '').trim();
    if (!label) return 'Standard';
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function extractChoiceLabel(rawDescription: string) {
    const text = stripHtml(rawDescription);
    const match =
      text.match(/replaced with\s+(.+?)\.?\s*$/i) ??
      text.match(/equipped with\s+(.+?)\.?\s*$/i);
    if (!match) return text;
    const label = match[1]
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\*+\s*$/, '')
      .replace(/^1\s+/, '')
      .trim();
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : text;
  }

  function getStem(rawDescription: string) {
    const beforeList = rawDescription.split(/<ul/i)[0];
    const text = stripHtml(beforeList);
    const idx = text.search(/\b(replaced with|equipped with)\b/i);
    const stem = idx >= 0 ? text.slice(0, idx) : text;
    return stem
      .replace(/\s*\b(can each be|can be|can)\s*$/i, '')
      .trim();
  }

  function getQuantityOptions(datasheetId: string) {
    return modelCosts
      .filter((item) => item.datasheet_id === datasheetId)
      .map((item) => ({
        quantity: parseModelCount(item.description),
        cost: Number(item.cost)
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.quantity - b.quantity);
  }

  function getOptionRows(datasheetId: string) {
    return datasheetOptions
      .filter(
        (item) =>
          item.datasheet_id === datasheetId &&
          item.button !== '*' &&
          stripHtml(item.description).toLowerCase() !== 'none'
      )
      .map((item) => ({
        ...item,
        choices: Array.from(item.description.matchAll(/<li>(.*?)<\/li>/g)).map((match) =>
          stripHtml(match[1]).replace(/\*+\s*$/, '').trim()
        )
      }));
  }

  function getOptionGroups(datasheetId: string): OptionGroup[] {
  const rows = datasheetOptions.filter(
    (item) =>
      item.datasheet_id === datasheetId &&
      item.button !== '*' &&
      stripHtml(item.description).toLowerCase() !== 'none'
  );

  const groups = new Map<string, { prompt: string; choices: Set<string>; defaultLabel: string }>();

    for (const row of rows) {
      const stem = getStem(row.description);
      const key = stem.toLowerCase();

      const listChoices = Array.from(row.description.matchAll(/<li>(.*?)<\/li>/g)).map((m) =>
        stripHtml(m[1]).replace(/\*+\s*$/, '').trim()
      );
      const choices = listChoices.length > 0 ? listChoices : [extractChoiceLabel(row.description)];

      if (!groups.has(key)) {
        groups.set(key, {
          prompt: stem,
          choices: new Set(),
          defaultLabel: extractDefaultLabel(row.description)
        });
      }
      const group = groups.get(key)!;
      for (const c of choices) group.choices.add(c);
    }

    return Array.from(groups.entries()).map(([key, { prompt, choices, defaultLabel }]) => ({
      key,
      prompt,
      choices: Array.from(choices),
      defaultLabel
    }));
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
      0
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

      const factionAlreadyLoaded = datasheets.some((sheet) => sheet.faction_id === selectedFactionId);
      if (!factionAlreadyLoaded) {
        const newDatasheets = await db.datasheets.where('faction_id').equals(selectedFactionId).toArray();
        datasheets = [...datasheets, ...newDatasheets];
      }

      armyDetachments = [...armyDetachments, { ...detachment, units: [] }];
      selectedDatasheetByDetachment = { ...selectedDatasheetByDetachment, [detachment.id]: '' };
      selectedQuantityByDetachment = { ...selectedQuantityByDetachment, [detachment.id]: 1 };
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

    const optionSelections = getOptionGroups(datasheetId).map((group) => {
      const raw = String(formData.get(`option_${group.key}`) ?? '__default__');
      const isDefault = raw === '__default__' || raw === '';
      return {
        line: group.key,
        description: group.prompt,
        choice: isDefault ? group.defaultLabel : raw,
        isDefault
      };
    });

    try {
      const newUnit: ArmyUnit = {
        id: crypto.randomUUID(),
        army_id: data.armyId,
        detachment_id: detachment.id,
        datasheet_id: datasheetId,
        quantity,
        points,
        options: optionSelections
      };

      await db.army_units.add(newUnit);

      armyDetachments = armyDetachments.map((d) =>
        d.id === detachment.id ? { ...d, units: [...d.units, newUnit] } : d
      );

      form.reset();
      selectedDatasheetByDetachment = { ...selectedDatasheetByDetachment, [detachment.id]: '' };
      selectedQuantityByDetachment = { ...selectedQuantityByDetachment, [detachment.id]: 1 };
    } catch (e) {
      console.error(e);
      error = 'Impossible d’ajouter l’unité.';
    }
  }

  async function deleteUnit(unitId: string) {
    try {
      await db.army_units.delete(unitId);

      armyDetachments = armyDetachments.map((d) => ({
        ...d,
        units: d.units.filter((unit) => unit.id !== unitId)
      }));
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

      armyDetachments = armyDetachments.filter((d) => d.id !== detachment.id);
      const nextDatasheetState = { ...selectedDatasheetByDetachment };
      const nextQuantityState = { ...selectedQuantityByDetachment };
      delete nextDatasheetState[detachment.id];
      delete nextQuantityState[detachment.id];
      selectedDatasheetByDetachment = nextDatasheetState;
      selectedQuantityByDetachment = nextQuantityState;
    } catch (e) {
      console.error(e);
      error = 'Impossible de supprimer le détachement.';
    }
  }

  function updateDetachmentDatasheet(detachmentId: string, datasheetId: string) {
    selectedDatasheetByDetachment = { ...selectedDatasheetByDetachment, [detachmentId]: datasheetId };
    const firstQuantity = getQuantityOptions(datasheetId)[0]?.quantity ?? 1;
    selectedQuantityByDetachment = { ...selectedQuantityByDetachment, [detachmentId]: firstQuantity };
  }

  function updateDetachmentQuantity(detachmentId: string, quantity: number) {
    selectedQuantityByDetachment = { ...selectedQuantityByDetachment, [detachmentId]: quantity };
  }

  function extractOptionLabel(description: string) {
    const text = stripHtml(description);

    const match =
      text.match(/replaced with\s+(.+?)\.?\s*$/i) ??
      text.match(/equipped with\s+(.+?)\.?\s*$/i);

    if (!match) return text;

    let label = match[1]
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\*+\s*$/, '') 
      .replace(/^1\s+/, '') 
      .trim();

    if (!label) return text;
    return label.charAt(0).toUpperCase() + label.slice(1);
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
                  <a
                    href={`/factions/${factions.find((item) => item.id === detachment.faction_id)?.id}/detachments/${detachment.detachment_id}`}
                  >
                    <p class="text-lg font-semibold">{detachment.name}</p>
                  </a>
                  <p>{getDetachmentPoints(detachment.id)} pts</p>
                </div>

                <button
                  type="button"
                  class="rounded bg-red-600 px-3 py-1 text-white text-sm cursor-pointer hover:bg-red-700"
                  onclick={() => deleteDetachment(detachment)}
                >
                  Remove
                </button>
              </div>

              <form class="space-y-3" onsubmit={(event) => addUnit(detachment, event)}>
                <div class="grid gap-3 md:grid-cols-[2fr_80px_auto]">
                  <label class="block">
                    <span class="block text-sm font-medium mb-1">Unit</span>
                    <select
                      name="datasheet_id"
                      class="w-full rounded border px-3 py-2"
                      value={selectedDatasheetByDetachment[detachment.id] ?? ''}
                      onchange={(event) =>
                        updateDetachmentDatasheet(
                          detachment.id,
                          (event.currentTarget as HTMLSelectElement).value
                        )}
                    >
                      <option value="">Choose a unit</option>
                      {#each datasheets.filter((sheet) => sheet.faction_id === detachment.faction_id) as sheet}
                        <option value={sheet.id}>{sheet.name}</option>
                      {/each}
                    </select>
                  </label>

                  <label class="block">
                    <span class="block text-sm font-medium mb-1">Qty</span>
                    <select
                      name="quantity"
                      class="w-full rounded border px-3 py-2"
                      value={selectedQuantityByDetachment[detachment.id] ?? 1}
                      disabled={!selectedDatasheetByDetachment[detachment.id]}
                      onchange={(event) =>
                        updateDetachmentQuantity(
                          detachment.id,
                          Number((event.currentTarget as HTMLSelectElement).value)
                        )}
                    >
                      {#each getQuantityOptions(selectedDatasheetByDetachment[detachment.id] ?? '') as option}
                        <option value={option.quantity}>{option.quantity}</option>
                      {/each}
                    </select>
                  </label>

                  <label class="block">
                    <span class="block text-sm font-medium mb-1">{getUnitCost(selectedDatasheetByDetachment[detachment.id] ?? '', selectedQuantityByDetachment[detachment.id] ?? 1)} pts</span>
                    <button
                      type="submit"
                      class="self-end rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700"
                    >
                      Add unit
                    </button>
                  </label>
                  
                </div>

                {#if selectedDatasheetByDetachment[detachment.id]}
                  <div class="space-y-3">
                    {#each getOptionGroups(selectedDatasheetByDetachment[detachment.id]) as group}
                      <label class="block">
                        <span class="block text-sm font-medium mb-1">{group.prompt}</span>
                        <select name={`option_${group.key}`} class="w-full rounded border px-3 py-2">
                          <option value="__default__">{group.defaultLabel} (default)</option>
                          {#each group.choices as choice}
                            <option value={choice}>{choice}</option>
                          {/each}
                        </select>
                      </label>
                    {/each}
                  </div>
                {/if}
              </form>

              <div class="space-y-2">
                {#if detachment.units.length === 0}
                  <p class="text-sm text-gray-500">No units added yet.</p>
                {:else}
                  <div class="grid gap-2">
                    {#each detachment.units as unit}
                      <article class="rounded-xl border bg-slate-50 p-3 flex items-start justify-between gap-3">
                        <div>
                          <a 
                            class="font-medium" 
                            href={`/datasheets/${unit.datasheet_id}?loadout=${encodeURIComponent(JSON.stringify(unit.options?.map((o) => o.choice) ?? []))}`}
                          >
                            {datasheets.find((sheet) => sheet.id === unit.datasheet_id)?.name ?? unit.datasheet_id}
                          </a>
                          <p class="text-xs text-gray-500">
                            Qty: {unit.quantity} · {unit.points} pts
                          </p>

                          {#if unit.options?.length}
                            <div class="mt-2 flex flex-wrap gap-1.5">
                              {#each unit.options as opt}
                                <span
                                  class={opt.isDefault
                                    ? 'inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500'
                                    : 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700'}
                                  title={opt.description}
                                >
                                  {opt.choice}
                                </span>
                              {/each}
                            </div>
                          {/if}
                        </div>

                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <button
                          type="button"
                          class="cursor-pointer"
                          onclick={() => deleteUnit(unit.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none" />
                            <path fill="red" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z" />
                          </svg>
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