<script>
  import { db } from '$lib/db';
  import { liveQuery } from 'dexie';

  const factions = liveQuery(() => db.factions.toArray());
</script>

<h1 class="text-2xl font-bold p-4">Factions</h1>

<ul class="grid grid-cols-2 gap-2 p-4">
  {#each $factions ?? [] as faction}
    <li class="border rounded p-3 hover:bg-gray-100">
      <a href={`/factions/${faction.id}`}>{faction.name}</a>
    </li>
  {/each}
</ul>