<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
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
	<link rel="icon" href={favicon} />
</svelte:head>

{#if authStore.isLoading}
	<div class="min-h-screen bg-zinc-900 flex items-center justify-center">
		<div class="text-center">
			<div class="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
			<p class="text-zinc-500">Loading...</p>
		</div>
	</div>
{:else}
	<div in:fade={{ duration: 200 }}>
		{@render children()}
	</div>
{/if}

<Toast />
