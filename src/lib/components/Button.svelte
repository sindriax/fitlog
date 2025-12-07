<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		class?: string;
		onclick?: () => void;
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();

	const variants = {
		primary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25',
		secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300',
		ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300',
		danger: 'bg-red-600/50 hover:bg-red-500 text-white'
	};

	const sizes = {
		sm: 'py-1.5 px-3 text-sm rounded-lg',
		md: 'py-2 px-4 rounded-lg',
		lg: 'py-4 px-6 text-lg font-semibold rounded-xl'
	};
</script>

<button
	{onclick}
	{disabled}
	class="transition-all {variants[variant]} {sizes[size]} {className} disabled:opacity-50 disabled:cursor-not-allowed"
>
	{@render children()}
</button>
