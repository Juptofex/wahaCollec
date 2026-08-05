<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';

  type Army = {
    id: string;
    name: string;
    faction_id?: string;
    points_limit?: number;
    created_at: number;
    updated_at: number;
  };

  type Faction = {
    id: string;
    name: string;
    link: string;
  };

  let armies = $state<Army[]>([]);
  let factions = $state<Faction[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');

  let name = $state('');
  let pointsLimit = $state('');

  async function loadArmies() {
    const [armyRows, factionRows] = await Promise.all([
      db.armies.orderBy('created_at').reverse().toArray(),
      db.factions.toArray()
    ]);

    armies = armyRows;
    factions = factionRows;
  }

  async function createArmy() {
    error = '';

    const trimmedName = name.trim();
    if (!trimmedName) {
      error = 'Le nom de l’armée est obligatoire.';
      return;
    }

    saving = true;
    try {
      const now = Date.now();
      const army: Army = {
        id: crypto.randomUUID(),
        name: trimmedName,
        points_limit: pointsLimit ? Number(pointsLimit) : undefined,
        created_at: now,
        updated_at: now
      };

      await db.armies.put(army);

      name = '';
      pointsLimit = '';
      await loadArmies();
    } catch (e) {
      console.error(e);
      error = "Impossible d'enregistrer l'armée.";
    } finally {
      saving = false;
    }
  }

  async function deleteArmy(army: Army) {
    const confirmed = confirm(`Supprimer l'armée "${army.name}" ?`);
    if (!confirmed) return;

    try {
      await db.armies.delete(army.id);
      await loadArmies();
    } catch (e) {
      console.error(e);
      error = "Impossible de supprimer l'armée.";
    }
  }

  onMount(async () => {
    loading = true;
    try {
      await loadArmies();
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4 max-w-2xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Mon Armée</h1>
    <p class="text-gray-500 mt-2">Crée et sauvegarde tes listes directement sur le téléphone.</p>
  </div>

  <form class="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
    <div>
      <label class="block text-sm font-medium mb-1" for="name">Nom de l’armée</label>
      <input
        id="name"
        class="w-full rounded border px-3 py-2"
        bind:value={name}
        placeholder="Space Marines - 2000 pts"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1" for="points">Limite de points</label>
      <input
        id="points"
        type="number"
        min="0"
        class="w-full rounded border px-3 py-2"
        bind:value={pointsLimit}
        placeholder="2000"
      />
    </div>

    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}

    <button
      type="button"
      onclick={createArmy}
      class="rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={saving}
    >
      {saving ? 'Enregistrement...' : 'Créer l’armée'}
    </button>
  </form>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Armées enregistrées</h2>

    {#if loading && armies.length === 0}
      <p class="text-gray-500">Chargement...</p>
    {:else if armies.length === 0}
      <p class="text-gray-500">Aucune armée créée pour l’instant.</p>
    {:else}
      <div class="space-y-2">
        {#each armies as army}
          <article class="rounded-lg border bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <a href={`/armies/${army.id}`} class="block flex-1 rounded-md hover:bg-slate-50">
                <h3 class="font-semibold text-slate-900">{army.name}</h3>
                <p class="text-xs uppercase tracking-wide text-slate-400">
                  {factions.find((faction) => faction.id === army.faction_id)?.name ?? 'No faction selected'}
                </p>
                <p class="text-sm text-gray-500">
                  {army.points_limit ? `${army.points_limit} pts` : 'Pas de limite de points'}
                </p>
              </a>

              <button
                type="button"
                class="rounded bg-red-600 px-3 py-1 text-white text-sm cursor-pointer hover:bg-red-700"
                onclick={() => deleteArmy(army)}
              >
                Supprimer
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>