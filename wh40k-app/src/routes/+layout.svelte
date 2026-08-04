<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { seedIfEmpty } from '$lib/db';
	import { pwaInfo } from 'virtual:pwa-info';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
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
	<main class="pb-16">
		{#key $page.url.pathname}
			<div in:fade={{ duration: 150 }}>
				{@render children()}
			</div>
		{/key}
	</main>
  	<BottomNav />
{:else}
	<p class="p-4">Chargement des données...</p>
{/if}

<footer class="text-xs text-gray-400 text-center p-2">
	Build: v0.0.3
</footer>