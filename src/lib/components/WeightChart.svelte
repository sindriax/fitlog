<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { parseDateKey } from '$lib/dates';

	interface Props {
		points: { date: string; weight: number }[];
	}

	let { points }: Props = $props();

	const width = 320;
	const height = 150;
	const pad = { top: 28, right: 16, bottom: 12, left: 36 };

	let selected = $state<number | null>(null);
	const active = $derived(selected ?? points.length - 1);

	const domain = $derived.by(() => {
		const weights = points.map((p) => p.weight);
		const min = Math.min(...weights);
		const max = Math.max(...weights);
		const spread = max - min || Math.max(1, max * 0.1);
		return { min: Math.max(0, min - spread * 0.15), max: max + spread * 0.15, low: min, high: max };
	});

	// Spaced by date so uneven gaps between sessions stay visible.
	const days = $derived(points.map((p) => parseDateKey(p.date).getTime() / 86400000));
	const x = (i: number) => {
		const span = days[days.length - 1] - days[0];
		const t = span > 0 ? (days[i] - days[0]) / span : points.length === 1 ? 0.5 : i / (points.length - 1);
		return pad.left + t * (width - pad.left - pad.right);
	};
	const y = (w: number) => pad.top + (1 - (w - domain.min) / (domain.max - domain.min)) * (height - pad.top - pad.bottom);

	const line = $derived(points.map((p, i) => `${x(i)},${y(p.weight)}`).join(' '));
	const area = $derived(
		`${x(0)},${height - pad.bottom} ${line} ${x(points.length - 1)},${height - pad.bottom}`
	);
</script>

<svg viewBox="0 0 {width} {height}" class="w-full h-auto select-none" role="img" aria-label="{points.at(-1)?.weight} kg">
	{#each [...new Set([domain.low, domain.high])] as tick (tick)}
		<line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} class="stroke-zinc-800" stroke-width="1" />
		<text x={pad.left - 6} y={y(tick)} dy="0.32em" text-anchor="end" class="fill-zinc-500 text-[10px]">{tick}</text>
	{/each}

	{#if points.length > 1}
		<polygon points={area} class="fill-emerald-400/10" />
		<polyline points={line} fill="none" class="stroke-emerald-400" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
	{/if}

	{#each points as point, i (i)}
		<circle cx={x(i)} cy={y(point.weight)} r={i === active ? 5 : 4} class="fill-emerald-400 stroke-zinc-900" stroke-width="2" />
	{/each}

	{#if points[active]}
		{@const p = points[active]}
		{@const px = Math.min(Math.max(x(active), pad.left + 24), width - pad.right - 24)}
		<line x1={x(active)} x2={x(active)} y1={pad.top - 4} y2={height - pad.bottom} class="stroke-zinc-700" stroke-width="1" />
		<text x={px} y={12} text-anchor="middle" class="fill-white text-[14px] font-display font-extrabold">{p.weight} kg</text>
		<text x={px} y={24} text-anchor="middle" class="fill-zinc-500 text-[9px]">{formatDate(p.date)}</text>
	{/if}

	{#each points as point, i (i)}
		<circle
			cx={x(i)}
			cy={y(point.weight)}
			r="14"
			fill="transparent"
			role="button"
			tabindex="0"
			aria-label="{point.weight} kg, {formatDate(point.date)}"
			onpointerenter={() => (selected = i)}
			onclick={() => (selected = i)}
			onfocus={() => (selected = i)}
			onkeydown={(e) => e.key === 'Enter' && (selected = i)}
		/>
	{/each}
</svg>
