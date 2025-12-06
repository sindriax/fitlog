<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate } from '$lib/utils';

	let selectedMachine = $state<string | null>(null);

	const machines = $derived(workoutStore.machines);
	const history = $derived(selectedMachine ? workoutStore.getMachineHistory(selectedMachine) : []);

	const stats = $derived(() => {
		if (history.length < 2) return null;
		const first = history[0];
		const last = history[history.length - 1];
		const weightChange = last.weight - first.weight;
		const percentChange = ((weightChange / first.weight) * 100).toFixed(0);
		return {
			startWeight: first.weight,
			currentWeight: last.weight,
			weightChange,
			percentChange,
			totalSessions: history.length
		};
	});

	const maxWeight = $derived(history.length > 0 ? Math.max(...history.map((h) => h.weight)) : 0);
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<!-- Header -->
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

		{#if selectedMachine && history.length > 0}
			<!-- Stats Summary -->
			{#if stats()}
				<section class="mb-6">
					<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
						<h3 class="font-medium mb-3">{selectedMachine}</h3>
						<div class="grid grid-cols-3 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-emerald-400">{stats()?.currentWeight}kg</p>
								<p class="text-zinc-500 text-xs">Current</p>
							</div>
							<div>
								<p class="text-2xl font-bold {stats()!.weightChange >= 0 ? 'text-emerald-400' : 'text-red-400'}">
									{stats()!.weightChange >= 0 ? '+' : ''}{stats()?.weightChange}kg
								</p>
								<p class="text-zinc-500 text-xs">Change</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-zinc-300">{stats()?.totalSessions}</p>
								<p class="text-zinc-500 text-xs">Sessions</p>
							</div>
						</div>
					</div>
				</section>
			{/if}

			<section class="mb-6">
				<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Weight Over Time</h2>
				<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
					<div class="flex items-end gap-1 h-32">
						{#each history as entry, i}
							<div class="flex-1 flex flex-col items-center">
								<div
									class="w-full rounded-t transition-all {entry.feeling === 'too_easy'
										? 'bg-yellow-500'
										: entry.feeling === 'too_hard'
											? 'bg-red-500'
											: 'bg-emerald-500'}"
									style="height: {(entry.weight / maxWeight) * 100}%"
									title="{entry.weight}kg - {formatDate(entry.date)}"
								></div>
							</div>
						{/each}
					</div>
					<div class="flex justify-between mt-2 text-xs text-zinc-500">
						<span>{history.length > 0 ? formatDate(history[0].date) : ''}</span>
						<span>{history.length > 0 ? formatDate(history[history.length - 1].date) : ''}</span>
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
					{#each [...history].reverse() as entry}
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
		{:else if selectedMachine}
			<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
				<p class="text-zinc-500">No history for {selectedMachine}</p>
			</div>
		{/if}
	{/if}
</div>
