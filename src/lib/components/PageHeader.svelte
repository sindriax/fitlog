<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		title: string;
		back?: string | (() => void);
		children?: Snippet;
	}

	let { title, back, children }: Props = $props();
</script>

<header class="flex items-end justify-between gap-3 mb-8">
	<div class="flex items-center gap-2 min-w-0">
		{#if typeof back === 'string'}
			<a href={back} class="-ml-1 p-1 text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
		{:else if back}
			<button onclick={back} class="-ml-1 p-1 text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
		<h1 class="font-display text-5xl font-extrabold tracking-tight leading-none truncate">{title}</h1>
	</div>
	{@render children?.()}
</header>
