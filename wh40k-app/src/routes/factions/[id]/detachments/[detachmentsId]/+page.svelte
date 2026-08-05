<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="p-4 space-y-6 max-w-4xl mx-auto">
  <header class="rounded-2xl border bg-slate-900 text-white p-5 shadow-md">
    <p class="text-xs uppercase tracking-wide text-slate-400">{data.faction.name}</p>
    <h1 class="text-2xl font-bold mt-1">{data.detachment.name}</h1>
    {#if data.detachment.type}
      <p class="text-sm text-slate-300 mt-2">{data.detachment.type}</p>
    {/if}
  </header>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Detachment rule</h2>
    {#if data.detachment.legend}
      <div class="prose prose-sm max-w-none text-slate-700">
        {@html data.detachment.legend}
      </div>
    {:else}
      <p class="text-sm text-gray-500">No detachment rule text available.</p>
    {/if}
  </section>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Detachment abilities</h2>

    {#if data.abilities.length === 0}
      <p class="text-sm text-gray-500">No abilities found for this detachment.</p>
    {:else}
      <div class="grid gap-3">
        {#each data.abilities as ability}
          <article class="rounded-xl border bg-blue-50 p-4 space-y-2">
            <div>
              <h3 class="font-semibold text-blue-950">{ability.name}</h3>
              {#if ability.legend}
                <p class="text-xs text-blue-700 mt-1">{@html ability.legend}</p>
              {/if}
            </div>

            {#if ability.description}
              <div class="text-sm text-slate-700">
                {@html ability.description}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">General stratagems</h2>

    {#if data.generalStratagems.length === 0}
        <p class="text-sm text-gray-500">No general stratagems found for this faction.</p>
    {:else}
        <div class="grid gap-3">
        {#each data.generalStratagems as stratagem}
            <article class="rounded-xl border p-4 space-y-2">
            <div class="flex items-start justify-between gap-3">
                <div>
                <h3 class="font-semibold">{stratagem.name}</h3>
                {#if stratagem.type}
                    <p class="text-xs text-slate-500">{stratagem.type}</p>
                {/if}
                </div>

                {#if stratagem.cp_cost}
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {stratagem.cp_cost} CP
                </span>
                {/if}
            </div>

            {#if stratagem.turn || stratagem.phase}
                <div class="flex flex-wrap gap-2 text-xs text-slate-500">
                {#if stratagem.turn}<span>{stratagem.turn}</span>{/if}
                {#if stratagem.phase}<span>{stratagem.phase}</span>{/if}
                </div>
            {/if}

            {#if stratagem.legend}
                <p class="text-sm text-slate-600">{stratagem.legend}</p>
            {/if}

            {#if stratagem.description}
                <div class="text-sm text-slate-700">
                {@html stratagem.description}
                </div>
            {/if}
            </article>
        {/each}
        </div>
    {/if}
    </section>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Stratagems</h2>

    {#if data.stratagems.length === 0}
        <p class="text-sm text-gray-500">No stratagems found for this detachment.</p>
    {:else}
        <div class="grid gap-3">
        {#each data.stratagems as stratagem}
            <article class="rounded-xl border p-4 space-y-2">
            <div class="flex items-start justify-between gap-3">
                <div>
                <h3 class="font-semibold">{stratagem.name}</h3>
                {#if stratagem.type}
                    <p class="text-xs text-slate-500">{stratagem.type}</p>
                {/if}
                </div>

                {#if stratagem.cp_cost}
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {stratagem.cp_cost} CP
                </span>
                {/if}
            </div>

            <div class="flex flex-wrap gap-2 text-xs text-slate-500">
                {#if stratagem.turn}<span>{stratagem.turn}</span>{/if}
                {#if stratagem.phase}<span>{stratagem.phase}</span>{/if}
            </div>

            {#if stratagem.legend}
                <p class="text-sm text-slate-600">{stratagem.legend}</p>
            {/if}

            {#if stratagem.description}
                <div class="text-sm text-slate-700">
                {@html stratagem.description}
                </div>
            {/if}
            </article>
        {/each}
        </div>
    {/if}
    </section>

  <section class="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <h2 class="text-lg font-semibold">Enhancements</h2>

    {#if data.enhancements.length === 0}
      <p class="text-sm text-gray-500">No enhancements found for this detachment.</p>
    {:else}
      <div class="grid gap-3">
        {#each data.enhancements as enhancement}
          <article class="rounded-xl border p-4 space-y-2">
            <h3 class="font-semibold">{enhancement.name}</h3>
            {#if enhancement.legend}
              <div class="text-sm text-slate-700">
                {@html enhancement.legend}
              </div>
            {/if}
            {#if enhancement.cost}
              <p class="text-xs text-slate-500">Cost: {enhancement.cost}</p>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>