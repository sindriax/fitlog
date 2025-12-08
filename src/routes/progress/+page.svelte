<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate } from '$lib/utils';
	import { i18n, tm } from '$lib/i18n';

	type TimePeriod = 'week' | 'month' | 'all';

	let selectedMachine = $state<string | null>(null);
	let timePeriod = $state<TimePeriod>('all');

	const machines = $derived(workoutStore.machines);
	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	const timePeriods = $derived([
		{ value: 'week' as TimePeriod, label: t('week') },
		{ value: 'month' as TimePeriod, label: t('month') },
		{ value: 'all' as TimePeriod, label: t('all_time') }
	]);

	const getDateThreshold = (period: TimePeriod): string => {
		const now = new Date();
		if (period === 'week') {
			now.setDate(now.getDate() - 7);
		} else if (period === 'month') {
			now.setMonth(now.getMonth() - 1);
		} else {
			return '1970-01-01';
		}
		return now.toISOString().split('T')[0];
	};

	const fullHistory = $derived(selectedMachine ? workoutStore.getMachineHistory(selectedMachine) : []);

	const history = $derived(() => {
		const threshold = getDateThreshold(timePeriod);
		return fullHistory.filter((h) => h.date >= threshold);
	});

	const stats = $derived(() => {
		const h = history();
		if (h.length < 1) return null;
		const first = h[0];
		const last = h[h.length - 1];
		const weightChange = h.length > 1 ? last.weight - first.weight : 0;
		const maxWeight = Math.max(...h.map((e) => e.weight));
		const avgWeight = h.reduce((sum, e) => sum + e.weight, 0) / h.length;
		return {
			startWeight: first.weight,
			currentWeight: last.weight,
			weightChange,
			maxWeight,
			avgWeight: avgWeight.toFixed(1),
			totalSessions: h.length
		};
	});

	const overallStats = $derived(() => {
		const allWorkouts = workoutStore.all;
		const totalExercises = allWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
		const thisWeek = allWorkouts.filter((w) => w.date >= getDateThreshold('week')).length;
		const thisMonth = allWorkouts.filter((w) => w.date >= getDateThreshold('month')).length;
		return {
			totalWorkouts: allWorkouts.length,
			totalExercises,
			thisWeek,
			thisMonth,
			uniqueMachines: machines.length
		};
	});

	const maxWeight = $derived(history().length > 0 ? Math.max(...history().map((h) => h.weight)) : 0);
	const chartHeight = 128;

	function getFeelingColor(feeling: string): string {
		if (feeling === 'too_easy') return 'bg-amber-500';
		if (feeling === 'too_hard') return 'bg-rose-500';
		return 'bg-emerald-500';
	}

	function getFeelingLabel(feeling: string): string {
		if (feeling === 'too_easy') return t('too_easy');
		if (feeling === 'too_hard') return t('too_hard');
		return t('good');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">{t('progress')}</h1>
	</header>

	{#if machines.length === 0}
		<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
			<div class="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
				<svg class="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			</div>
			<p class="text-zinc-400 font-medium">{t('no_workout_data')}</p>
			<p class="text-zinc-600 text-sm mt-1">{t('complete_workouts_to_see')}</p>
		</div>
	{:else}
		<section class="mb-6">
			<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
				<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">{t('overview')}</h2>
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-2xl font-bold text-emerald-400">{overallStats().thisWeek}</p>
						<p class="text-zinc-500 text-xs mt-1">{t('this_week')}</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-zinc-300">{overallStats().thisMonth}</p>
						<p class="text-zinc-500 text-xs mt-1">{t('this_month')}</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-zinc-300">{overallStats().totalWorkouts}</p>
						<p class="text-zinc-500 text-xs mt-1">{t('all_time')}</p>
					</div>
				</div>
				<div class="mt-4 pt-4 border-t border-zinc-800 text-center text-zinc-500 text-sm">
					{overallStats().totalExercises} {t('exercises')} · {overallStats().uniqueMachines} {t('machines')}
				</div>
			</div>
		</section>

		<section class="mb-6">
			<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t('select_machine')}</h2>
			<div class="flex flex-wrap gap-2">
				{#each machines as machine}
					<button
						onclick={() => (selectedMachine = machine)}
						class="py-2 px-4 rounded-lg text-sm transition-all border {selectedMachine === machine
							? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
							: 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'}"
					>
						{tm(machine)}
					</button>
				{/each}
			</div>
		</section>

		{#if selectedMachine && fullHistory.length > 0}
			<section class="mb-4">
				<div class="flex gap-2">
					{#each timePeriods as period}
						<button
							onclick={() => (timePeriod = period.value)}
							class="flex-1 py-2 rounded-lg text-sm transition-all border {timePeriod === period.value
								? 'bg-zinc-800 text-white border-zinc-700'
								: 'bg-zinc-900/50 text-zinc-500 border-transparent hover:text-zinc-400'}"
						>
							{period.label}
						</button>
					{/each}
				</div>
			</section>

			{#if stats()}
				<section class="mb-6">
					<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
						<h3 class="font-medium mb-4 text-zinc-200">{tm(selectedMachine)}</h3>
						<div class="grid grid-cols-4 gap-3 text-center">
							<div>
								<p class="text-xl font-bold text-emerald-400">{stats()?.currentWeight}</p>
								<p class="text-zinc-500 text-xs mt-1">{t('current')}</p>
							</div>
							<div>
								<p class="text-xl font-bold {stats()!.weightChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
									{stats()!.weightChange >= 0 ? '+' : ''}{stats()?.weightChange}
								</p>
								<p class="text-zinc-500 text-xs mt-1">{t('change')}</p>
							</div>
							<div>
								<p class="text-xl font-bold text-amber-400">{stats()?.maxWeight}</p>
								<p class="text-zinc-500 text-xs mt-1">{t('max')}</p>
							</div>
							<div>
								<p class="text-xl font-bold text-zinc-300">{stats()?.totalSessions}</p>
								<p class="text-zinc-500 text-xs mt-1">{t('sessions')}</p>
							</div>
						</div>
					</div>
				</section>
			{/if}

			{#if history().length > 0}
				<section class="mb-6">
					<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t('weight_over_time')}</h2>
					<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
						<div class="overflow-x-auto">
							<div class="flex items-end gap-1 h-32" style="min-width: {Math.max(history().length * 20, 100)}px">
								{#each history() as entry}
									{@const barHeight = Math.max((entry.weight / maxWeight) * chartHeight, 8)}
									<div
										class="w-4 min-w-4 rounded-t transition-all {getFeelingColor(entry.feeling)}"
										style="height: {barHeight}px"
										title="{entry.weight}kg - {formatDate(entry.date)}"
									></div>
								{/each}
							</div>
						</div>
						<div class="flex justify-between mt-3 text-xs text-zinc-500">
							<span>{formatDate(history()[0].date)}</span>
							<span>{formatDate(history()[history().length - 1].date)}</span>
						</div>
						<div class="flex gap-4 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500 justify-center">
							<span class="flex items-center gap-1.5">
								<span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> {t('good')}
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-2.5 h-2.5 rounded bg-amber-500"></span> {t('too_easy')}
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-2.5 h-2.5 rounded bg-rose-500"></span> {t('too_hard')}
							</span>
						</div>
					</div>
				</section>

				<section>
					<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t('history')}</h2>
					<div class="space-y-2">
						{#each [...history()].reverse() as entry}
							<div class="bg-zinc-900/50 rounded-lg p-3 flex justify-between items-center border border-zinc-800/50">
								<div>
									<p class="text-white font-medium">{entry.weight}kg · {entry.sets}×{entry.reps}</p>
									<p class="text-zinc-500 text-sm">{formatDate(entry.date)}</p>
								</div>
								<span class="px-2 py-1 rounded text-xs font-medium {entry.feeling === 'too_easy' ? 'bg-amber-500/20 text-amber-400' : entry.feeling === 'too_hard' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}">
									{getFeelingLabel(entry.feeling)}
								</span>
							</div>
						{/each}
					</div>
				</section>
			{:else}
				<div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
					<p class="text-zinc-500">{t('no_data_period')}</p>
				</div>
			{/if}
		{:else if selectedMachine}
			<div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
				<p class="text-zinc-500">{t('no_history_for')} {tm(selectedMachine)}</p>
			</div>
		{/if}
	{/if}
</div>
