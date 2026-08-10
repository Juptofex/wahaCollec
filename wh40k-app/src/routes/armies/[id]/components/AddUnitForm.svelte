<script lang="ts">
  import type { Datasheet, DatasheetModelCost, DatasheetOption } from '$lib/types';
  import { getQuantityOptions, getOptionGroups, getUnitCost } from '$lib/datasheetParsing';

  let {
    factionDatasheets,
    modelCosts,
    datasheetOptions,
    onSubmit
  }: {
    factionDatasheets: Datasheet[];
    modelCosts: DatasheetModelCost[];
    datasheetOptions: DatasheetOption[];
    onSubmit: (formData: FormData) => void;
  } = $props();

  let selectedDatasheetId = $state('');
  let selectedQuantity = $state(1);

  function updateDatasheet(id: string) {
    selectedDatasheetId = id;
    selectedQuantity = getQuantityOptions(modelCosts, id)[0]?.quantity ?? 1;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget as HTMLFormElement));
    (event.currentTarget as HTMLFormElement).reset();
    selectedDatasheetId = '';
    selectedQuantity = 1;
  }
</script>

<form class="space-y-3" onsubmit={handleSubmit}>
  <div class="grid gap-3 md:grid-cols-[2fr_80px_auto]">
    <label class="block">
      <span class="block text-sm font-medium mb-1">Unit</span>
      <select
        name="datasheet_id"
        class="w-full rounded border px-3 py-2"
        value={selectedDatasheetId}
        onchange={(e) => updateDatasheet((e.currentTarget as HTMLSelectElement).value)}
      >
        <option value="">Choose a unit</option>
        {#each factionDatasheets as sheet}
          <option value={sheet.id}>{sheet.name}</option>
        {/each}
      </select>
    </label>

    <label class="block">
      <span class="block text-sm font-medium mb-1">Qty</span>
      <select
        name="quantity"
        class="w-full rounded border px-3 py-2"
        value={selectedQuantity}
        disabled={!selectedDatasheetId}
        onchange={(e) => (selectedQuantity = Number((e.currentTarget as HTMLSelectElement).value))}
      >
        {#each getQuantityOptions(modelCosts, selectedDatasheetId) as option}
          <option value={option.quantity}>{option.quantity}</option>
        {/each}
      </select>
    </label>

    <label class="block">
      <span class="block text-sm font-medium mb-1">
        {getUnitCost(modelCosts, selectedDatasheetId, selectedQuantity)} pts
      </span>
      <button type="submit" class="self-end rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700">
        Add unit
      </button>
    </label>
  </div>

  {#if selectedDatasheetId}
    <div class="space-y-3">
      {#each getOptionGroups(datasheetOptions, selectedDatasheetId) as group}
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