<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

{#if toastStore.all.length > 0}
	<div class="fixed bottom-6 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
		{#each toastStore.all as toast (toast.id)}
			<div
				class="pointer-events-auto mx-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200
					{toast.type === 'success' ? 'bg-emerald-500 text-white' : ''}
					{toast.type === 'error' ? 'bg-rose-500 text-white' : ''}
					{toast.type === 'info' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : ''}"
			>
				{#if toast.type === 'success'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				{:else if toast.type === 'error'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				{/if}
				<span class="text-sm font-medium">{toast.message}</span>
			</div>
		{/each}
	</div>
{/if}
