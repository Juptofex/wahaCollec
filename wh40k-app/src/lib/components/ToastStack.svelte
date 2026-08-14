<script lang="ts">
  import { toasts } from '$lib/toast';
  import { fade, fly } from 'svelte/transition';
</script>

<div class="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div
      in:fly={{ y: 10, duration: 150 }}
      out:fade={{ duration: 150 }}
      class="rounded-full bg-slate-900 text-white text-sm px-4 py-2 shadow-lg max-w-sm text-center"
    >
      {toast.message}
    </div>
  {/each}
</div>