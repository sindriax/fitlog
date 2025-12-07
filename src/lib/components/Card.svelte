<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'default' | 'gradient' | 'subtle';
		class?: string;
	}

	let { children, variant = 'default', class: className = '' }: Props = $props();

	const variants = {
		default: 'bg-zinc-800 border-zinc-700',
		gradient: 'bg-gradient-to-br from-zinc-800 to-zinc-800/50 border-zinc-700/50',
		subtle: 'bg-zinc-800/50 border-zinc-700/50'
	};
</script>

<div class="rounded-xl p-4 border {variants[variant]} {className}">
	{@render children()}
</div>
