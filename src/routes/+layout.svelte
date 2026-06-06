<script lang="ts">
	import '../app.css';
	import dumbbellIcon from '$lib/assets/dumbbell.png';
	import { browser } from '$app/environment';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	$effect(() => {
		if (browser && navigator.storage?.persist) {
			navigator.storage.persist();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={dumbbellIcon} />
</svelte:head>

{@render children()}

<Toast />
