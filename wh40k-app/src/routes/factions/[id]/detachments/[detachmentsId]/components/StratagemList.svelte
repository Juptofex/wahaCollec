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
  <div class="space-y-3">
    {#each turnGroups as turnGroup (turnGroup.turn)}
      <details class="group rounded-lg border border-slate-200" open>
        <summary
          class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-700 select-none marker:content-none"
        >
          <span>{turnGroup.turn}</span>
          <span class="flex items-center gap-2 text-xs font-normal normal-case text-slate-400">
            {turnGroup.phaseGroups.reduce((n, p) => n + p.stratagems.length, 0)} strat{turnGroup.phaseGroups.reduce((n, p) => n + p.stratagems.length, 0) === 1 ? '' : 's'}
            <svg
              class="h-4 w-4 transition-transform group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <div class="space-y-2 px-3 pb-3 pt-1">
          {#each turnGroup.phaseGroups as phaseGroup (phaseGroup.phase)}
            <details class="group/phase rounded border border-slate-100 bg-slate-50/50">
              <summary
                class="flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 select-none marker:content-none"
              >
                <span>{phaseGroup.phase}</span>
                <span class="flex items-center gap-2 text-slate-400">
                  {phaseGroup.stratagems.length}
                  <svg
                    class="h-3.5 w-3.5 transition-transform group-open/phase:rotate-180"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>

              <div class="grid gap-3 p-2 pt-1">
                {#each phaseGroup.stratagems as stratagem (stratagem.name)}
                  <StratagemCard {stratagem} />
                {/each}
              </div>
            </details>
          {/each}
        </div>
      </details>
    {/each}
  </div>
{/if}