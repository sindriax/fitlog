<script lang="ts">
	import type { WeekRecap } from '$lib/recap';
	import { i18n, t, tm } from '$lib/i18n';

	interface Props {
		recap: WeekRecap;
		goal: number;
		ondismiss: () => void;
	}

	let { recap, goal, ondismiss }: Props = $props();

	const locale = $derived(i18n.language === 'es' ? 'es-ES' : 'en-US');
	const stats = $derived([
		{ value: `${recap.sessions}/${goal}`, label: t('sessions') },
		{ value: Math.round(recap.volume).toLocaleString(locale), label: t('kg_lifted') },
		...(recap.bodyweightChange !== null
			? [{ value: `${recap.bodyweightChange > 0 ? '+' : ''}${recap.bodyweightChange}`, label: t('bodyweight') }]
			: [])
	]);
</script>

<section class="bg-zinc-900 rounded-2xl p-5 border border-emerald-500/30 mb-6">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('last_week')}</h2>
		<button onclick={ondismiss} class="text-zinc-500 hover:text-zinc-300 -m-1 p-1" aria-label={t('dismiss')}>✕</button>
	</div>

	<div class="grid gap-2 mb-1" style="grid-template-columns: repeat({stats.length}, minmax(0, 1fr))">
		{#each stats as stat (stat.label)}
			<div>
				<p class="text-2xl font-bold font-mono">{stat.value}</p>
				<p class="text-xs text-zinc-500">{stat.label}</p>
			</div>
		{/each}
	</div>

	{#if recap.records.length > 0}
		<p class="text-sm text-amber-400 mt-4">
			{recap.records.length} {recap.records.length === 1 ? t('record_one') : t('record_many')}:
			<span class="text-zinc-300">{recap.records.map((r) => tm(r)).join(', ')}</span>
		</p>
	{/if}
</section>
