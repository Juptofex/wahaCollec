<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { seedIfEmpty } from '$lib/db';
	import '../app.css';

	let { children } = $props();
	let ready = $state(false);

	onMount(async () => {
		console.log('ONMOUNT TRIGGERED');
		await seedIfEmpty();
		console.log('SEED DONE');
		ready = true;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if ready}
	{@render children()}
{:else}
	<p class="p-4">Chargement des données...</p>
{/if}
