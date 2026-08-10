<script lang="ts">
  import { onMount } from 'svelte';
  import { getDetachments, getModelCosts } from '$lib/gameData';
  import type { Army, Faction, ArmyDetachment, ArmyUnit, Datasheet, DatasheetOption, DatasheetModelCost, DetachmentCatalog, PageData } from '$lib/types';
  import { loadArmyBundle, loadDatasheetsByFaction, saveArmy, addDetachment as addDetachmentRecord, removeDetachment } from '$lib/armyRepository';
  import ArmyHeader from './components/ArmyHeader.svelte';
  import FactionSelector from './components/FactionSelector.svelte';
  import AddDetachmentForm from './components/AddDetachmentForm.svelte';
  import DetachmentCard from './components/DetachmentCard.svelte';

  let { data }: { data: PageData } = $props();

  let army = $state<Army | null>(null);
  let factions = $state<Faction[]>([]);
  let detachmentCatalog = $state<DetachmentCatalog[]>([]);
  let armyDetachments = $state<Array<ArmyDetachment & { units: ArmyUnit[] }>>([]);
  let datasheets = $state<Datasheet[]>([]);
  let modelCosts = $state<DatasheetModelCost[]>([]);
  let datasheetOptions = $state<DatasheetOption[]>([]);

  let loading = $state(true);
  let savingArmy = $state(false);
  let savingDetachment = $state(false);
  let error = $state('');
  let selectedFactionId = $state('');

  async function loadPageData() {
    const [{ army: armyRecord, factions: factionList, armyDetachments: armyDetachmentRows,
             armyUnits: armyUnitRows, datasheetOptions: optionList },
           detachmentList, costList] = await Promise.all([
      loadArmyBundle(data.armyId),
      getDetachments(),
      getModelCosts()
    ]);

    const factionIds = [...new Set(armyDetachmentRows.map((d) => d.faction_id))];
    const datasheetList = await loadDatasheetsByFaction(factionIds);

    army = armyRecord;
    factions = factionList;
    detachmentCatalog = detachmentList;
    datasheets = datasheetList;
    modelCosts = costList;
    datasheetOptions = optionList;
    armyDetachments = armyDetachmentRows.map((detachment) => ({
      ...detachment,
      units: armyUnitRows.filter((unit) => unit.detachment_id === detachment.id)
    }));

    if (!selectedFactionId) {
      selectedFactionId = armyRecord.faction_id ?? factionList[0]?.id ?? '';
    }
  }

  function getArmyPoints() {
    return armyDetachments.reduce(
      (total, d) => total + d.units.reduce((sum, unit) => sum + unit.points, 0),
      0
    );
  }

  async function saveArmyFaction(factionId: string) {
    if (!army) return;
    savingArmy = true;
    error = '';
    try {
      const updatedArmy: Army = { ...army, faction_id: factionId, updated_at: Date.now() };
      army = updatedArmy;
      await saveArmy(updatedArmy);
    } catch (e) {
      console.error(e);
      error = 'Impossible de sauvegarder la faction de l’armée.';
    } finally {
      savingArmy = false;
    }
  }

  async function handleAddDetachment(factionId: string, detachmentId: string) {
    error = '';
    const selected = detachmentCatalog.find((item) => item.id === detachmentId);
    if (!selected) return;

    savingDetachment = true;
    try {
      const detachment: ArmyDetachment = {
        id: crypto.randomUUID(),
        army_id: data.armyId,
        detachment_id: selected.id,
        name: selected.name,
        faction_id: factionId
      };
      await addDetachmentRecord(detachment);

      const factionAlreadyLoaded = datasheets.some((sheet) => sheet.faction_id === factionId);
      if (!factionAlreadyLoaded) {
        const newDatasheets = await loadDatasheetsByFaction([factionId]);
        datasheets = [...datasheets, ...newDatasheets];
      }

      armyDetachments = [...armyDetachments, { ...detachment, units: [] }];
    } catch (e) {
      console.error(e);
      error = 'Impossible d’ajouter le détachement.';
    } finally {
      savingDetachment = false;
    }
  }

  async function handleDeleteDetachment(detachment: ArmyDetachment) {
    const confirmed = confirm(`Supprimer le détachement "${detachment.name}" ?`);
    if (!confirmed) return;
    try {
      await removeDetachment(detachment.id);
      armyDetachments = armyDetachments.filter((d) => d.id !== detachment.id);
    } catch (e) {
      console.error(e);
      error = 'Impossible de supprimer le détachement.';
    }
  }

  function handleUnitsChanged(detachmentId: string, units: ArmyUnit[]) {
    armyDetachments = armyDetachments.map((d) => (d.id === detachmentId ? { ...d, units } : d));
  }

  onMount(async () => {
    loading = true;
    try {
      await loadPageData();
    } catch (e) {
      console.error(e);
      error = 'Impossible de charger l’armée.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4 max-w-5xl mx-auto space-y-6">
  {#if loading}
    <p class="text-gray-500">Chargement...</p>
  {:else if army}
    <ArmyHeader {army} points={getArmyPoints()} />

    {#if error}
      <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
    {/if}

    <FactionSelector {factions} bind:selectedFactionId saving={savingArmy} onSave={saveArmyFaction} />

    <AddDetachmentForm
      {factions}
      {detachmentCatalog}
      bind:selectedFactionId
      saving={savingDetachment}
      onAdd={handleAddDetachment}
    />

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Detachments in this army</h2>

      {#if armyDetachments.length === 0}
        <p class="text-gray-500">No detachments added yet.</p>
      {:else}
        <div class="grid gap-4">
          {#each armyDetachments as detachment (detachment.id)}
            <DetachmentCard
              {detachment}
              factionName={factions.find((f) => f.id === detachment.faction_id)?.name}
              {datasheets}
              {modelCosts}
              {datasheetOptions}
              onUnitsChanged={handleUnitsChanged}
              onRemove={handleDeleteDetachment}
            />
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <p class="text-gray-500">Army not found.</p>
  {/if}
</div>