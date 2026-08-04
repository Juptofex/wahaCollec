<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { seedIfEmpty } from '$lib/db';
	import { pwaInfo } from 'virtual:pwa-info';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import '../app.css';

	const { updateServiceWorker } = useRegisterSW({
		onRegisteredSW(swUrl, registration) {
			console.log('Service worker enregistré:', swUrl);
		},
		onRegisterError(error) {
			console.error('Erreur d\'enregistrement SW:', error);
		}
	});

	let { children } = $props();
	let ready = $state(false);

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		await seedIfEmpty();
		ready = true;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

{#if ready}
	{@render children()}
{:else}
	<p class="p-4">Chargement des données...</p>
{/if}