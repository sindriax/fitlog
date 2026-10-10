<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate } from '$lib/utils';
	import { addDays, todayKey, weekStartKey } from '$lib/dates';
	import { t, tm } from '$lib/i18n';
	import WeightChart from '$lib/components/WeightChart.svelte';
	import BodyweightCard from '$lib/components/BodyweightCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Sparkline from '$lib/components/Sparkline.svelte';
	import { isTimed } from '$lib/progression';
	import { slide } from 'svelte/transition';

	type Period = 'month' | 'quarter' | 'all';

	const today = todayKey();

	// Strength machines, most recently trained first.
	const machines = $derived.by(() => {
		const seen = new Map<string, string>();
		for (const w of workoutStore.all) {
			for (const e of w.exercises) {
				if (!isTimed(e) && !seen.has(e.machine.toLowerCase())) seen.set(e.machine.toLowerCase(), e.machine);
			}
		}
		return [...seen.values()].map((machine) => {
			const history = workoutStore.getMachineHistory(machine);
			const first = history[0];
			const last = history[history.length - 1];
			return { machine, history, last, change: last.weight - first.weight };
		});
	});

	let openMachine = $state<string | null>(null);
	let period = $state<Period>('all');

	const periods: { value: Period; label: 'month' | 'last_3_months' | 'all_time' }[] = [
		{ value: 'month', label: 'month' },
		{ value: 'quarter', label: 'last_3_months' },
		{ value: 'all', label: 'all_time' }
	];

	function since(p: Period): string {
		if (p === 'month') return addDays(today, -31);
		if (p === 'quarter') return addDays(today, -92);
		return '0000-00-00';
	}

	const overview = $derived({
		week: workoutStore.all.filter((w) => w.date >= weekStartKey(today)).length,
		month: workoutStore.all.filter((w) => w.date >= addDays(today, -30)).length,
		total: workoutStore.all.length
	});

	const formatChange = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n * 10) / 10}`;
</script>

<div class="text-white px-6 pt-8 pb-6">
	<PageHeader title={t('progress')} />

	<div class="grid grid-cols-3 gap-2 mb-10">
		{#each [[overview.week, 'this_week'], [overview.month, 'last_30_days'], [overview.total, 'all_time']] as const as [value, label] (label)}
			<div>
				<p class="font-display text-5xl font-extrabold leading-none {label === 'this_week' ? 'text-emerald-400' : ''}">{value}</p>
				<p class="text-xs text-zinc-500 mt-1">{t(label)}</p>
			</div>
		{/each}
	</div>

	<BodyweightCard />

	<section>
		<h2 class="text-sm font-semibold text-zinc-400 mb-1 first-letter:uppercase">{t('machines')}</h2>

		{#if machines.length === 0}
			<p class="py-6 text-zinc-500">{t('complete_workouts_to_see')}</p>
		{:else}
			<ul class="divide-y divide-zinc-900">
				{#each machines as m (m.machine)}
					{@const open = openMachine === m.machine}
					{@const visible = m.history.filter((h) => h.date >= since(period))}
					<li>
						<button
							onclick={() => (openMachine = open ? null : m.machine)}
							aria-expanded={open}
							class="w-full flex items-center gap-4 py-4 text-left"
						>
							<div class="flex-1 min-w-0">
								<p class="font-semibold leading-tight line-clamp-2">{tm(m.machine)}</p>
								<p class="text-xs text-zinc-500">
									{m.history.length} {t('sessions').toLowerCase()} · {formatDate(m.last.date)}
								</p>
							</div>
							<Sparkline values={m.history.map((h) => h.weight)} />
							<div class="w-20 text-right">
								<p class="font-display text-3xl font-extrabold leading-none">{m.last.weight}<span class="text-base text-zinc-500 ml-0.5">kg</span></p>
								<p class="text-xs {m.change > 0 ? 'text-emerald-400' : m.change < 0 ? 'text-rose-400' : 'text-zinc-600'}">
									{m.change === 0 ? '=' : `${formatChange(m.change)} kg`}
								</p>
							</div>
						</button>

						{#if open}
							<div transition:slide={{ duration: 220 }} class="pb-5">
								<div class="grid grid-cols-3 gap-1 rounded-full bg-zinc-900 p-1 mb-4">
									{#each periods as p (p.value)}
										<button
											onclick={() => (period = p.value)}
											aria-pressed={period === p.value}
											class="py-2 rounded-full text-sm font-semibold transition-colors {period === p.value
												? 'bg-zinc-700 text-white'
												: 'text-zinc-500 hover:text-zinc-300'}"
										>
											{t(p.label)}
										</button>
									{/each}
								</div>

								{#if visible.length > 0}
									<div class="rounded-3xl bg-zinc-900 p-4 mb-4">
										<WeightChart points={visible} />
									</div>
									<ul class="space-y-1">
										{#each [...visible].reverse() as entry, i (entry.date + i)}
											<li class="flex items-center justify-between text-sm py-1.5">
												<span class="text-zinc-500">{formatDate(entry.date)}</span>
												<span class="flex items-center gap-3">
													<span class="font-semibold">{entry.sets}×{entry.reps} · {entry.weight} kg</span>
													<span
														class="text-xs {entry.next === 'up'
															? 'text-amber-400'
															: entry.next === 'down'
																? 'text-rose-400'
																: 'text-zinc-600'}"
													>
														{t(entry.next as 'up' | 'stay' | 'down')}
													</span>
												</span>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="text-sm text-zinc-500">{t('no_data_period')}</p>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
