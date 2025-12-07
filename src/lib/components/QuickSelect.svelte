<script lang="ts">
	interface Props {
		options: number[];
		value: number;
		onchange: (value: number) => void;
		label?: string;
	}

	let { options, value, onchange, label }: Props = $props();
</script>

<div>
	{#if label}
		<label class="block text-zinc-400 text-sm mb-2">{label}</label>
	{/if}
	<div class="flex gap-2 flex-wrap">
		{#each options as option}
			<button
				onclick={() => onchange(option)}
				class="flex-1 min-w-[3rem] py-2 rounded-lg text-lg font-medium transition-colors {value === option
					? 'bg-emerald-500 text-white'
					: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
			>
				{option}
			</button>
		{/each}
	</div>
</div>
