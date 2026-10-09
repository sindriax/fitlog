<script lang="ts">
	import '../app.css';
	import dumbbellIcon from '$lib/assets/dumbbell.png';
	import { browser } from '$app/environment';
	import Toast from '$lib/components/Toast.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import { page } from '$app/stores';
	import { registerSW } from 'virtual:pwa-register';

	let { children } = $props();

	const showTabs = $derived(!/^\/(workout|import)/.test($page.url.pathname));

	$effect(() => {
		if (browser && navigator.storage?.persist) {
			navigator.storage.persist();
		}
		registerSW({ immediate: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={dumbbellIcon} />
</svelte:head>

<div style="padding-top: env(safe-area-inset-top)" class="max-w-lg mx-auto {showTabs ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}">
	{@render children()}
</div>

{#if showTabs}
	<TabBar />
{/if}

<Toast />
