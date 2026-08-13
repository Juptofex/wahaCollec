<script lang="ts">
    import { db } from '$lib/db';
    import type { Datasheet } from '$lib/types';


    let { data }: { data: { datasheet: Datasheet } } = $props();

    async function addToCollection() {
        const existing = await db.faction_collections
            .where('faction_id')
            .equals(data.datasheet.faction_id)
            .first();
        
        if (!existing) {
            const id = crypto.randomUUID();

            await db.faction_collections.add({
                id: id,
                faction_id: data.datasheet.faction_id,
            });

            addUnit(id);
        } else {
            addUnit(existing.id);
        }
    }

    async function addUnit(factionCollectionId: string) {

        const existingUnit = await db.collection_units
            .where('factionCollection_id')
            .equals(factionCollectionId)
            .and((unit) => unit.datasheet_id === data.datasheet.id)
            .first();

        if (existingUnit) {
            await db.collection_units.update(existingUnit.id, {
                quantity: existingUnit.quantity + 1,
            });
            return;
        } else {
            await db.collection_units.add({
                id: crypto.randomUUID(),
                factionCollection_id: factionCollectionId,
                datasheet_id: data.datasheet.id,
                quantity: 1,
            });
        }
    }

</script>

<div>
    <button
        type="button"
        class="fixed top-4 right-4 rounded bg-blue-600 px-4 py-2 text-white cursor-pointer transition hover:bg-blue-700 disabled:opacity-50 z-10"
        onclick={() => addToCollection()}
    >
        Add to collection
    </button>
</div>