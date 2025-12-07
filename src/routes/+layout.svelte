<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

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
		<p class="text-zinc-500">Loading...</p>
	</div>
{:else}
	{@render children()}
{/if}
