<script lang="ts">
	import '../app.css';
	import dumbbellIcon from '$lib/assets/dumbbell.png';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	$effect(() => {
		const isLoginPage = $page.url.pathname === '/login';
		if (!authStore.isLoading && !authStore.isLoggedIn && !isLoginPage) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={dumbbellIcon} />
</svelte:head>

{#if authStore.isLoading}
	<div class="min-h-screen bg-zinc-950 flex items-center justify-center">
		<div class="text-center">
			<img src={dumbbellIcon} alt="" class="w-12 h-12 mx-auto mb-3 animate-lift" />
			<p class="text-zinc-500">Loading...</p>
		</div>
	</div>
{:else}
	<div in:fade={{ duration: 200 }}>
		{@render children()}
	</div>
{/if}

<Toast />
