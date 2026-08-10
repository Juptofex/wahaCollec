<script lang="ts">
  import type { Stratagem } from '$lib/stratagems';
  import { groupStratagemsByTurnAndPhase } from '$lib/stratagems';
  import StratagemCard from './StratagemCard.svelte';

  let {
    stratagems,
    emptyMessage
  }: {
    stratagems: Stratagem[];
    emptyMessage: string;
  } = $props();

  const turnGroups = $derived(groupStratagemsByTurnAndPhase(stratagems));
</script>

{#if stratagems.length === 0}
  <p class="text-sm text-gray-500">{emptyMessage}</p>
{:else}
  <div class="space-y-6">
    {#each turnGroups as turnGroup (turnGroup.turn)}
      <div class="space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wide text-slate-700">{turnGroup.turn}</h3>

        {#each turnGroup.phaseGroups as phaseGroup (phaseGroup.phase)}
          <div class="space-y-2 pl-3 border-l-2 border-slate-100">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">{phaseGroup.phase}</h4>
            <div class="grid gap-3">
              {#each phaseGroup.stratagems as stratagem (stratagem.name)}
                <StratagemCard {stratagem} />
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/if}