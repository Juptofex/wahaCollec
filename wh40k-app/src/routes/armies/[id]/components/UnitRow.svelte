<script lang="ts">
  import type { ArmyUnit } from '$lib/types';

  let {
    unit,
    datasheetName,
    onDelete
  }: {
    unit: ArmyUnit;
    datasheetName: string;
    onDelete: (unitId: string) => void;
  } = $props();
</script>

<article class="rounded-xl border bg-slate-50 p-3 flex items-start justify-between gap-3">
  <div>
    <a
      class="font-medium"
      href={`/datasheets/${unit.datasheet_id}?loadout=${encodeURIComponent(JSON.stringify(unit.options?.map((o) => o.choice) ?? []))}`}
    >
      {datasheetName}
    </a>
    <p class="text-xs text-gray-500">Qty: {unit.quantity} · {unit.points} pts</p>

    {#if unit.options?.length}
      <div class="mt-2 flex flex-wrap gap-1.5">
        {#each unit.options as opt}
          <span
            class={opt.isDefault
              ? 'inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500'
              : 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700'}
            title={opt.description}
          >
            {opt.choice}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button type="button" class="cursor-pointer" onclick={() => onDelete(unit.id)}>
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="red" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z" />
    </svg>
  </button>
</article>