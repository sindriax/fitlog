<script lang="ts">
	import '../app.css';
	import dumbbellIcon from '$lib/assets/dumbbell.png';
	import { browser } from '$app/environment';
	import Toast from '$lib/components/Toast.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import { page } from '$app/stores';
	import { registerSW } from 'virtual:pwa-register';
	import { syncStore } from '$lib/stores/sync.svelte';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { bodyweightStore } from '$lib/stores/bodyweight.svelte';
	import { setupStore } from '$lib/stores/setups.svelte';
	import { prefsStore } from '$lib/stores/prefs.svelte';

	let { children } = $props();

	const showTabs = $derived(!/^\/(workout|import)/.test($page.url.pathname));

	$effect(() => {
		if (browser && navigator.storage?.persist) {
			navigator.storage.persist();
		}
		registerSW({ immediate: true });

		syncStore.init();
		const resync = () => document.visibilityState === 'visible' && syncStore.sync();
		window.addEventListener('online', resync);
		document.addEventListener('visibilitychange', resync);
		return () => {
			window.removeEventListener('online', resync);
			document.removeEventListener('visibilitychange', resync);
		};
	});

	// Push local edits shortly after they happen.
	$effect(() => {
		void [workoutStore.all, templatesStore.all, bodyweightStore.all, setupStore.all, prefsStore.current];
		const timer = setTimeout(() => syncStore.hasLocalChanges() && syncStore.sync(), 2000);
		return () => clearTimeout(timer);
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
