<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate, getCategoryEmoji, getCategoryLabel } from '$lib/utils';
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-emerald-400">FitLog</h1>
		<p class="text-zinc-400 mt-1">Track your gym progress</p>
	</header>

	<section class="mb-6">
		<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Last Workout</h2>
		{#if workoutStore.latest}
			<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
				<div class="flex items-center gap-3">
					<span class="text-3xl">{getCategoryEmoji(workoutStore.latest.category)}</span>
					<div>
						<p class="text-xl font-semibold">{getCategoryLabel(workoutStore.latest.category)}</p>
						<p class="text-zinc-400 text-sm">{formatDate(workoutStore.latest.date)}</p>
					</div>
				</div>
				<p class="text-zinc-500 text-sm mt-3">
					{workoutStore.latest.exercises.length} exercise{workoutStore.latest.exercises.length !== 1 ? 's' : ''}
				</p>
			</div>
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
						<div class="flex items-center gap-3">
							<span>{getCategoryEmoji(session.category)}</span>
							<span class="text-zinc-300">{getCategoryLabel(session.category)}</span>
						</div>
						<span class="text-zinc-500 text-sm">{formatDate(session.date)}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>