<script lang="ts">
  import type { Faction, DetachmentCatalog } from '$lib/types';

  let {
    factions,
    detachmentCatalog,
    selectedFactionId = $bindable(),
    saving,
    onAdd
  }: {
    factions: Faction[];
    detachmentCatalog: DetachmentCatalog[];
    selectedFactionId: string;
    saving: boolean;
    onAdd: (factionId: string, detachmentId: string) => void;
  } = $props();

  let selectedDetachmentId = $state('');

  const availableDetachments = $derived(
    detachmentCatalog.filter((item) => item.faction_id === selectedFactionId)
  );

  $effect(() => {
    if (!availableDetachments.length) {
      selectedDetachmentId = '';
      return;
    }
    if (!availableDetachments.some((item) => item.id === selectedDetachmentId)) {
      selectedDetachmentId = availableDetachments[0].id;
    }
  });

  function handleAdd() {
    if (!selectedDetachmentId) return;
    onAdd(selectedFactionId, selectedDetachmentId);
  }
</script>

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
        {#each availableDetachments as detachment}
          <option value={detachment.id}>{detachment.name}</option>
        {/each}
      </select>
    </label>
  </div>

  <button
    type="button"
    class="rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-50"
    onclick={handleAdd}
    disabled={saving || !selectedDetachmentId}
  >
    {saving ? 'Adding...' : 'Add detachment'}
  </button>
</section>