<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<h1 class="text-2xl font-bold p-4">{data.faction.name}</h1>

<div class="p-4 space-y-6">
  <header class="rounded-2xl border bg-slate-900 text-white p-5 shadow-md">
    <h1 class="text-2xl font-bold">{data.faction.name}</h1>
    <p class="text-sm text-slate-300 mt-1">Detachments et datasheets de la faction</p>
  </header>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Detachments</h2>

    <div class="grid gap-4">
      {#each data.detachments as detachment}
        <a
          class="rounded-xl border bg-blue-50 p-4 hover:bg-blue-100 transition block"
          href={`/factions/${data.faction.id}/detachments/${detachment.id}`}
        >
          <p class="font-semibold text-blue-950">{detachment.name}</p>
        </a>
      {/each}
    </div>
  </section>

  <hr class="border-slate-200" />

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Datasheets</h2>
    <div class="grid gap-2">
      {#each data.datasheets as sheet}
        <a class="rounded-xl border p-3 hover:bg-slate-50" href={`/datasheets/${sheet.id}`}>
          {sheet.name}
        </a>
      {/each}
    </div>
  </section>
</div>