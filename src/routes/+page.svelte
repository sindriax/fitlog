<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate, formatSessionCategories } from '$lib/utils';
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-emerald-400">FitLog</h1>
		<p class="text-zinc-400 mt-1">Track your gym progress</p>
	</header>

	<section class="mb-6">
		<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Last Workout</h2>
		{#if workoutStore.latest}
			<a href="/workout/{workoutStore.latest.id}" class="block bg-zinc-800 rounded-xl p-4 border border-zinc-700 hover:border-zinc-600 transition-colors">
				<p class="text-lg">{formatSessionCategories(workoutStore.latest)}</p>
				<p class="text-zinc-400 text-sm mt-1">{formatDate(workoutStore.latest.date)}</p>
				<p class="text-zinc-500 text-sm mt-2">
					{workoutStore.latest.exercises.length} exercise{workoutStore.latest.exercises.length !== 1 ? 's' : ''}
				</p>
			</a>
		{:else}
			<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
				<p class="text-zinc-500">No workouts yet</p>
				<p class="text-zinc-600 text-sm mt-1">Start your first one!</p>
			</div>
		{/if}
	</section>

	<a
		href="/workout/new"
		class="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-colors"
	>
		+ Start Workout
	</a>

	{#if workoutStore.recent.length > 1}
		<section class="mt-8">
			<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Recent History</h2>
			<div class="space-y-2">
				{#each workoutStore.recent.slice(1) as session}
					<a
						href="/workout/{session.id}"
						class="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 hover:bg-zinc-800 transition-colors"
					>
						<span class="text-zinc-300">{formatSessionCategories(session)}</span>
						<span class="text-zinc-500 text-sm">{formatDate(session.date)}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if workoutStore.machines.length > 0}
		<a
			href="/progress"
			class="block mt-6 py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-center transition-colors"
		>
			<span class="text-zinc-300">📈 View Progress</span>
			<span class="text-zinc-500 text-sm ml-2">({workoutStore.machines.length} machines)</span>
		</a>
	{/if}
</div>