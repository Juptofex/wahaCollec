<script lang="ts">
  import { page } from '$app/stores';
  import { db } from '$lib/db';
  import type { PageData } from './$types';
  import AddToCollection from './components/AddToCollection.svelte';
  import { annotateCoreAbilityTags } from '$lib/coreWeaponAbilities';

  let { data }: { data: PageData } = $props();

  let swappableWeaponNames = $state<Set<string>>(new Set());
  let loadoutNames = $state<Set<string>>(new Set());
  let openAbilities = $state<Set<string>>(new Set());
  let coreAbilities = $derived.by(() =>
    data.abilities.filter((a) => a.name && a.type === "Core")
  );
  let factionAbilities = $derived.by(() =>
    data.abilities.filter((a) => a.name && a.type === "Faction")
  );
  let datasheetAbilities = $derived.by(() =>
    data.abilities.filter((a) => a.name && a.type !== "Core" && a.type !== "Faction")
  );

  function stripHtml(description: string) {
    return description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function toggleAbility(name: string) {
    const next = new Set(openAbilities);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    openAbilities = next;
  }

  $effect(() => {
    const raw = $page.url.searchParams.get('loadout');
    if (!raw) {
      loadoutNames = new Set();
      return;
    }
    try {
      const parsed: string[] = JSON.parse(raw);
      loadoutNames = new Set(parsed.map((n) => n.toLowerCase().trim()));
    } catch {
      loadoutNames = new Set();
    }
  });


  $effect(() => {
    const datasheetId = data.datasheet.id;
    db.datasheet_options
      .where('datasheet_id')
      .equals(datasheetId)
      .toArray()
      .then((options) => {
        const names = new Set<string>();
        for (const row of options) {
          if (row.button === '*') continue;
          const text = stripHtml(row.description);
          if (text.toLowerCase() === 'none') continue;

          Array.from(row.description.matchAll(/<li>(.*?)<\/li>/g)).forEach((m) => {
            names.add(stripHtml(m[1]).replace(/\*+\s*$/, '').trim().toLowerCase());
          });

          const match =
            text.match(/replaced with\s+(.+?)\.?\s*$/i) ??
            text.match(/equipped with\s+(.+?)\.?\s*$/i);
          if (match) {
            const label = match[1]
              .replace(/\s*\([^)]*\)\s*$/, '')
              .replace(/\*+\s*$/, '')
              .replace(/^1\s+/, '')
              .trim()
              .toLowerCase();
            if (label) names.add(label);
          }

          // NEW: also register the base weapon being replaced, so it can be hidden
          const replaceIdx = text.search(/\breplaced with\b/i);
          if (replaceIdx >= 0) {
            let subject = text
              .slice(0, replaceIdx)
              .replace(/^for every \d+ models? in this unit,?\s*/i, '')
              .replace(/^if this unit contains \d+ models?,?\s*/i, '');

            const baseMatch =
              subject.match(/have (?:their|its)\s+(.+?)\s*$/i) ??
              subject.match(/(?:’s|'s)\s+(.+?)\s*$/i);

            if (baseMatch) {
              const baseLabel = baseMatch[1]
                .replace(/\s*\bcan (each )?be\s*$/i, '')
                .trim()
                .toLowerCase();
              if (baseLabel) names.add(baseLabel);
            }
          }
        }
        swappableWeaponNames = names;
    });
  });

  function isVisible(weaponName: string) {
    if (loadoutNames.size === 0) return true;

    const name = weaponName.toLowerCase().trim();

    if (!swappableWeaponNames.has(name)) return true;

    return loadoutNames.has(name);
  }
</script>

<div class="p-4 max-w-3xl mx-auto">
  <div>
    <h1 class="text-2xl font-bold">{data.datasheet.name}</h1>
    <AddToCollection {data}/>
  </div>

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

  {#snippet abilityList(list: typeof data.abilities)}
    <div class="space-y-2">
      {#each list as a}
        <div class="border rounded">
          <button
            type="button"
            class="w-full flex items-center justify-between p-2 text-left"
            onclick={() => toggleAbility(a.name)}
            aria-expanded={openAbilities.has(a.name)}
          >
            <strong>{a.name} {a.parameter}</strong>
            <span class="text-gray-500 transition-transform {openAbilities.has(a.name) ? 'rotate-180' : ''}">
              ▾
            </span>
          </button>
          {#if openAbilities.has(a.name)}
            <p class="text-sm text-gray-700 px-2 pb-2">{@html annotateCoreAbilityTags(a.description)}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/snippet}

  {#if datasheetAbilities.length > 0}
    <h3 class="text-sm font-semibold text-gray-600 mt-4 mb-1">Capacités de la fiche</h3>
    {@render abilityList(datasheetAbilities)}
  {/if}

  {#if factionAbilities.length > 0}
    <h3 class="text-sm font-semibold text-gray-600 mt-4 mb-1">Capacités de faction</h3>
    {@render abilityList(factionAbilities)}
  {/if}

  {#if coreAbilities.length > 0}
    <h3 class="text-sm font-semibold text-gray-600 mt-4 mb-1">Capacités générales</h3>
    {@render abilityList(coreAbilities)}
  {/if}

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
        {#each data.wargear.filter((w) => isVisible(w.name)) as w}
          <tr class="border-b">
            <td class="p-2">
              {w.name}
              {#if w.description}
                <div class="text-xs text-gray-500 italic">{@html annotateCoreAbilityTags(w.description)}</div>
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

  {#if loadoutNames.size > 0}
    <p class="mt-2 text-xs text-gray-500">
      Showing this unit's equipped loadout.
      <a class="text-blue-600 underline" href={`/datasheets/${data.datasheet.id}`}>
        View full weapon profile
      </a>
    </p>
  {/if}

  <!-- MOTS-CLÉS -->
  <h2 class="text-lg font-semibold mt-6 mb-2">Mots-clés</h2>
  <div class="flex flex-wrap gap-1">
    {#each data.keywords as k}
      <span class="bg-gray-200 rounded px-2 py-0.5 text-xs">{k.keyword}</span>
    {/each}
  </div>
</div>