<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { formatDate, formatSessionCategories } from '$lib/utils';

	const streak = $derived(workoutStore.streak);
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="mb-6 flex items-center justify-between">
		<img src="/fit.png" alt="FitLog" class="h-14" />
		<button
			onclick={() => authStore.signOut()}
			class="text-zinc-500 hover:text-zinc-300 text-sm"
		>
			Sign out
		</button>
	</header>

		<section class="mb-6">
			<div class="bg-gradient-to-br from-zinc-800 to-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 relative overflow-hidden">
				{#if streak.thisWeekCount >= streak.weeklyGoal}
					<div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
				{/if}

				<div class="relative">
					<div class="flex items-center justify-between mb-3">
						<p class="text-zinc-400 text-sm font-medium">This Week</p>
						{#if streak.currentWeeks > 0}
							<p class="text-emerald-400 text-sm">
								🔥 {streak.currentWeeks} week{streak.currentWeeks !== 1 ? 's' : ''} streak
							</p>
						{/if}
					</div>

					<div class="flex gap-2 mb-3">
						{#each Array(streak.weeklyGoal) as _, i}
							<div
								class="flex-1 h-3 rounded-full transition-all {i < streak.thisWeekCount
									? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
									: 'bg-zinc-700'}"
							></div>
						{/each}
					</div>

					<div class="flex items-center justify-between">
						<p class="text-zinc-300">
							<span class="text-2xl font-bold">{streak.thisWeekCount}</span>
							<span class="text-zinc-500">/ {streak.weeklyGoal} workouts</span>
						</p>
						<p class="text-zinc-500 text-sm">
							{#if streak.thisWeekCount >= streak.weeklyGoal}
								Goal reached! 💪
							{:else if streak.thisWeekCount === streak.weeklyGoal - 1}
								1 more to go!
							{:else}
								{streak.weeklyGoal - streak.thisWeekCount} more to hit goal
							{/if}
						</p>
					</div>

					{#if streak.currentWeeks > 0 && streak.currentWeeks === streak.longestWeeks && streak.currentWeeks >= 2}
						<div class="mt-3 pt-3 border-t border-zinc-700/50">
							<p class="text-emerald-400 text-sm font-medium text-center">
								🏆 Best streak ever!
							</p>
						</div>
					{/if}
				</div>
			</div>
		</section>

	<section class="mb-6">
		<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Last Workout</h2>
		{#if workoutStore.latest}
			<a href="/workout/{workoutStore.latest.id}" class="block bg-gradient-to-br from-zinc-800 to-zinc-800/70 rounded-xl p-4 border border-zinc-700/50 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
				<p class="text-lg font-medium">{formatSessionCategories(workoutStore.latest)}</p>
				<div class="flex items-center justify-between mt-2">
					<p class="text-zinc-400 text-sm">{formatDate(workoutStore.latest.date)}</p>
					<p class="text-zinc-500 text-sm">
						{workoutStore.latest.exercises.length} exercise{workoutStore.latest.exercises.length !== 1 ? 's' : ''} →
					</p>
				</div>
			</a>
		{:else}
			<div class="bg-gradient-to-br from-zinc-800 to-zinc-800/50 rounded-xl p-8 border border-zinc-700/50 text-center">
				<p class="text-4xl mb-3">💪</p>
				<p class="text-zinc-400 font-medium">No workouts yet</p>
				<p class="text-zinc-600 text-sm mt-1">Start your fitness journey today!</p>
			</div>
		{/if}
	</section>

	<a
		href="/workout/new"
		class="block w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
	>
		+ Start Workout
	</a>

	{#if workoutStore.recent.length > 1}
		<section class="mt-8">
			<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Recent History</h2>
			<div class="space-y-2">
				{#each workoutStore.recent.slice(1) as session, i}
					<a
						href="/workout/{session.id}"
						class="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 hover:bg-zinc-800 transition-all hover:translate-x-1"
						style="animation-delay: {i * 50}ms"
					>
						<span class="text-zinc-300">{formatSessionCategories(session)}</span>
						<span class="text-zinc-500 text-sm">{formatDate(session.date)}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<div class="flex gap-3 mt-6">
		{#if workoutStore.machines.length > 0}
			<a
				href="/progress"
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/30 hover:bg-zinc-800 transition-all"
			>
				<span class="text-xl">📈</span>
				<span class="text-zinc-300 text-sm">Progress</span>
			</a>
		{/if}
		<a
			href="/templates"
			class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/30 hover:bg-zinc-800 transition-all"
		>
			<span class="text-xl">📋</span>
			<span class="text-zinc-300 text-sm">Templates</span>
			{#if templatesStore.all.length > 0}
				<span class="text-zinc-500 text-xs">({templatesStore.all.length})</span>
			{/if}
		</a>
	</div>

	{#if workoutStore.totalWorkouts > 0}
		<p class="text-center text-zinc-600 text-sm mt-8">
			{workoutStore.totalWorkouts} total workout{workoutStore.totalWorkouts !== 1 ? 's' : ''} logged
		</p>
	{/if}

	{#if workoutStore.isDev}
		<div class="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 p-3">
			<div class="flex items-center justify-center gap-3 max-w-sm mx-auto">
				<span class="text-xs text-zinc-600 font-mono">DEV</span>
				<button
					onclick={() => workoutStore.loadMockData(3)}
					class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
				>
					Load 3 months data
				</button>
				<button
					onclick={() => workoutStore.loadMockData(1)}
					class="text-xs bg-blue-600/50 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
				>
					1 month
				</button>
				<button
					onclick={() => workoutStore.clearAllData()}
					class="text-xs bg-red-600/50 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors"
				>
					Clear all
				</button>
			</div>
		</div>
		<div class="h-16"></div>
	{/if}
</div>