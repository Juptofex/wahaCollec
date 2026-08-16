<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { seedIfEmpty } from '$lib/db';
	import { pwaInfo } from 'virtual:pwa-info';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import ToastStack from '$lib/components/ToastStack.svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import '../app.css';


	let { children } = $props();
	let ready = $state(false);
	let seedError = $state(false);

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		try {
			await seedIfEmpty();
			ready = true;
		} catch {
			seedError = true;
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

<OfflineBanner />

{#if ready}
	<main class="pb-16">
		{#key $page.url.pathname}
			<div in:fade={{ duration: 150 }}>
				{@render children()}
			</div>
		{/key}
	</main>
  	<BottomNav />
{:else if seedError}
  <p class="p-4 text-red-600">
    Impossible de charger les données. Connecte-toi à internet une première fois pour synchroniser l'app.
  </p>
{:else}
  <p class="p-4">Chargement des données...</p>
{/if}

<ToastStack />

<footer class="text-xs text-gray-400 text-center p-2">
	Build: v0.3.3
</footer>