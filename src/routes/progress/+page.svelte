<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate } from '$lib/utils';

	type TimePeriod = 'week' | 'month' | 'all';

	let selectedMachine = $state<string | null>(null);
	let timePeriod = $state<TimePeriod>('all');

	const machines = $derived(workoutStore.machines);

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

	const timePeriods: { value: TimePeriod; label: string }[] = [
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' },
		{ value: 'all', label: 'All Time' }
	];
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
		<h1 class="text-xl font-semibold">Progress</h1>
	</header>

	{#if machines.length === 0}
		<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
			<p class="text-zinc-500">No workout data yet</p>
			<p class="text-zinc-600 text-sm mt-1">Complete some workouts to see your progress!</p>
		</div>
	{:else}
		<section class="mb-6">
			<div class="bg-gradient-to-br from-zinc-800 to-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
				<h2 class="text-sm font-medium text-zinc-400 mb-3">Overview</h2>
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-2xl font-bold text-emerald-400">{overallStats().thisWeek}</p>
						<p class="text-zinc-500 text-xs">This Week</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-zinc-300">{overallStats().thisMonth}</p>
						<p class="text-zinc-500 text-xs">This Month</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-zinc-300">{overallStats().totalWorkouts}</p>
						<p class="text-zinc-500 text-xs">All Time</p>
					</div>
				</div>
				<div class="mt-3 pt-3 border-t border-zinc-700/50 text-center text-zinc-500 text-sm">
					{overallStats().totalExercises} exercises · {overallStats().uniqueMachines} machines
				</div>
			</div>
		</section>

		<section class="mb-6">
			<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Select Machine</h2>
			<div class="flex flex-wrap gap-2">
				{#each machines as machine}
					<button
						onclick={() => (selectedMachine = machine)}
						class="py-2 px-4 rounded-lg text-sm transition-colors {selectedMachine === machine
							? 'bg-emerald-500 text-white'
							: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
					>
						{machine}
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
							class="flex-1 py-2 rounded-lg text-sm transition-colors {timePeriod === period.value
								? 'bg-zinc-700 text-white'
								: 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300'}"
						>
							{period.label}
						</button>
					{/each}
				</div>
			</section>

			{#if stats()}
				<section class="mb-6">
					<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
						<h3 class="font-medium mb-3">{selectedMachine}</h3>
						<div class="grid grid-cols-4 gap-3 text-center">
							<div>
								<p class="text-xl font-bold text-emerald-400">{stats()?.currentWeight}</p>
								<p class="text-zinc-500 text-xs">Current</p>
							</div>
							<div>
								<p class="text-xl font-bold {stats()!.weightChange >= 0 ? 'text-emerald-400' : 'text-red-400'}">
									{stats()!.weightChange >= 0 ? '+' : ''}{stats()?.weightChange}
								</p>
								<p class="text-zinc-500 text-xs">Change</p>
							</div>
							<div>
								<p class="text-xl font-bold text-yellow-400">{stats()?.maxWeight}</p>
								<p class="text-zinc-500 text-xs">Max</p>
							</div>
							<div>
								<p class="text-xl font-bold text-zinc-300">{stats()?.totalSessions}</p>
								<p class="text-zinc-500 text-xs">Sessions</p>
							</div>
						</div>
					</div>
				</section>
			{/if}

			{#if history().length > 0}
				<section class="mb-6">
					<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Weight Over Time</h2>
					<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
						<div class="overflow-x-auto">
							<div class="flex items-end gap-1 h-32" style="min-width: {Math.max(history().length * 20, 100)}px">
								{#each history() as entry}
									{@const barHeight = Math.max((entry.weight / maxWeight) * chartHeight, 8)}
									<div
										class="w-4 min-w-4 rounded-t transition-all {entry.feeling === 'too_easy'
											? 'bg-yellow-500'
											: entry.feeling === 'too_hard'
												? 'bg-red-500'
												: 'bg-emerald-500'}"
										style="height: {barHeight}px"
										title="{entry.weight}kg - {formatDate(entry.date)}"
									></div>
								{/each}
							</div>
						</div>
						<div class="flex justify-between mt-2 text-xs text-zinc-500">
							<span>{formatDate(history()[0].date)}</span>
							<span>{formatDate(history()[history().length - 1].date)}</span>
						</div>
						<div class="flex gap-4 mt-3 text-xs text-zinc-500 justify-center">
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded bg-emerald-500"></span> Just right
							</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded bg-yellow-500"></span> Too easy
							</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded bg-red-500"></span> Too hard
							</span>
						</div>
					</div>
				</section>

				<section>
					<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">History</h2>
					<div class="space-y-2">
						{#each [...history()].reverse() as entry}
							<div class="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center">
								<div>
									<p class="text-white">{entry.weight}kg · {entry.sets}×{entry.reps}</p>
									<p class="text-zinc-500 text-sm">{formatDate(entry.date)}</p>
								</div>
								<span class="text-lg">
									{entry.feeling === 'too_easy' ? '😴' : entry.feeling === 'too_hard' ? '😵' : '💪'}
								</span>
							</div>
						{/each}
					</div>
				</section>
			{:else}
				<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
					<p class="text-zinc-500">No data for this time period</p>
				</div>
			{/if}
		{:else if selectedMachine}
			<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
				<p class="text-zinc-500">No history for {selectedMachine}</p>
			</div>
		{/if}
	{/if}
</div>
