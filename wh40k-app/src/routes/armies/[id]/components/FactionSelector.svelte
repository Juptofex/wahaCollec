<script lang="ts">
  import type { Faction } from '$lib/types';

  let {
    factions,
    selectedFactionId = $bindable(),
    saving,
    onSave
  }: {
    factions: Faction[];
    selectedFactionId: string;
    saving: boolean;
    onSave: (factionId: string) => void;
  } = $props();
</script>

<section class="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
  <div class="flex items-center justify-between gap-3">
    <h2 class="text-lg font-semibold">Army faction</h2>
    {#if saving}
      <span class="text-xs text-gray-500">Saving...</span>
    {/if}
  </div>

  <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
    <label class="block">
      <span class="block text-sm font-medium mb-1">Faction</span>
      <select
        class="w-full rounded border px-3 py-2"
        bind:value={selectedFactionId}
        onchange={() => onSave(selectedFactionId)}
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