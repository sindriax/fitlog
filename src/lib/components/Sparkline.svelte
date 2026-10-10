<script lang="ts">
	let { values }: { values: number[] } = $props();

	const width = 72;
	const height = 28;

	const points = $derived.by(() => {
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		return values.map((v, i) => [
			values.length === 1 ? width / 2 : 2 + (i / (values.length - 1)) * (width - 4),
			max === min ? height / 2 : height - 3 - ((v - min) / span) * (height - 6)
		]);
	});
</script>

<svg viewBox="0 0 {width} {height}" class="w-[72px] h-7 shrink-0" aria-hidden="true">
	{#if points.length > 1}
		<polyline
			points={points.map((p) => p.join(',')).join(' ')}
			fill="none"
			class="stroke-emerald-400/70"
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
	{/if}
	{#if points.length > 0}
		{@const last = points[points.length - 1]}
		<circle cx={last[0]} cy={last[1]} r="3" class="fill-emerald-400" />
	{/if}
</svg>
