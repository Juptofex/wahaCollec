<script lang="ts">
  import type { Stratagem } from '$lib/stratagems';

  let { stratagem }: { stratagem: Stratagem } = $props();
</script>

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

  {#if stratagem.legend}
    <p class="text-sm text-slate-600">{stratagem.legend}</p>
  {/if}

  {#if stratagem.description}
    <div class="text-sm text-slate-700">
      {@html stratagem.description}
    </div>
  {/if}
</article>