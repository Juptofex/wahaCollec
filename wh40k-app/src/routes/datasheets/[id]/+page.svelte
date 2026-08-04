<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="p-4 max-w-3xl mx-auto">
  <h1 class="text-2xl font-bold">{data.datasheet.name}</h1>

  <!-- PROFILS -->
  <h2 class="text-lg font-semibold mt-6 mb-2">Profils</h2>
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="border-b bg-gray-100">
          <th class="text-left p-2">Nom</th>
          <th class="p-2">M</th>
          <th class="p-2">T</th>
          <th class="p-2">Sv</th>
          <th class="p-2">Inv</th>
          <th class="p-2">W</th>
          <th class="p-2">Ld</th>
          <th class="p-2">OC</th>
        </tr>
      </thead>
      <tbody>
        {#each data.models as m}
          <tr class="border-b">
            <td class="p-2">{m.name}</td>
            <td class="p-2 text-center">{m.M}</td>
            <td class="p-2 text-center">{m.T}</td>
            <td class="p-2 text-center">{m.Sv}</td>
            <td class="p-2 text-center">{m.inv_sv}</td>
            <td class="p-2 text-center">{m.W}</td>
            <td class="p-2 text-center">{m.Ld}</td>
            <td class="p-2 text-center">{m.OC}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- CAPACITÉS -->
  <h2 class="text-lg font-semibold mt-6 mb-2">Capacités</h2>
  <div class="space-y-2">
    {#each data.abilities.filter(a => a.name) as a}
      <div class="border rounded p-2">
        <strong>{a.name}</strong>
        <p class="text-sm text-gray-700">{@html a.description}</p>
      </div>
    {/each}
  </div>

  <!-- ARMES -->
  <h2 class="text-lg font-semibold mt-6 mb-2">Armes</h2>
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="border-b bg-gray-100">
          <th class="text-left p-2">Nom</th>
          <th class="p-2">Portée</th>
          <th class="p-2">A</th>
          <th class="p-2">BS/WS</th>
          <th class="p-2">S</th>
          <th class="p-2">AP</th>
          <th class="p-2">D</th>
        </tr>
      </thead>
      <tbody>
        {#each data.wargear as w}
          <tr class="border-b">
            <td class="p-2">
              {w.name}
              {#if w.description}
                <div class="text-xs text-gray-500 italic">{w.description}</div>
              {/if}
            </td>
            <td class="p-2 text-center">{w.range === 'Melee' ? 'Mêlée' : `${w.range}"`}</td>
            <td class="p-2 text-center">{w.A}</td>
            <td class="p-2 text-center">{w.BS_WS}+</td>
            <td class="p-2 text-center">{w.S}</td>
            <td class="p-2 text-center">{w.AP}</td>
            <td class="p-2 text-center">{w.D}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- MOTS-CLÉS -->
  <h2 class="text-lg font-semibold mt-6 mb-2">Mots-clés</h2>
  <div class="flex flex-wrap gap-1">
    {#each data.keywords as k}
      <span class="bg-gray-200 rounded px-2 py-0.5 text-xs">{k.keyword}</span>
    {/each}
  </div>
</div>