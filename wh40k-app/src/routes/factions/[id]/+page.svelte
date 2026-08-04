<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<h1 class="text-2xl font-bold p-4">{data.faction.name}</h1>

<ul class="grid grid-cols-1 gap-2 p-4">
  {#each data.datasheets as sheet}
    <li class="border rounded p-3 hover:bg-gray-100">
      <a href={`/datasheets/${sheet.id}`}>{sheet.name}</a>
    </li>
  {/each}
</ul>