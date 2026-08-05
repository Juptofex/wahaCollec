<script lang="ts">
  let online = $state(true);

  $effect(() => {
    online = navigator.onLine;
    const update = () => (online = navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
</script>

{#if !online}
  <div class="bg-yellow-500 text-black text-xs text-center py-1">
    Mode hors-ligne — les données affichées sont celles déjà téléchargées
  </div>
{/if}