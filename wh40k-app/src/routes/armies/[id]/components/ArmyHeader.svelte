<script lang="ts">
  import type { Army } from '$lib/types';

  let {
    army,
    points
  }: {
    army: Army;
    points: number;
  } = $props();
</script>

<header class="rounded-2xl border bg-slate-900 text-white p-5 shadow-md">
  <p class="text-xs uppercase tracking-wide text-slate-400">Army builder</p>
  <h1 class="text-2xl font-bold mt-1">{army.name}</h1>
  <p class="text-sm text-slate-300 mt-2">
    {points} / {army.points_limit ? `${army.points_limit} pts` : 'Pas de limite de points'}
  </p>
</header>