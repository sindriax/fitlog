<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { formatDate, getSessionCategoryCounts, getCategoryColor, getCategoryLabel } from '$lib/utils';

	const streak = $derived(workoutStore.streak);
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="mb-8 flex items-center justify-between">
		<img src="/fit.png" alt="FitLog" class="h-12" />
		<button
			onclick={() => authStore.signOut()}
			class="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
		>
			Sign out
		</button>
	</header>

	<section class="mb-8">
		<div class="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
			<div class="flex items-center justify-between mb-4">
				<p class="text-zinc-400 text-sm font-medium tracking-wide uppercase">This Week</p>
				{#if streak.currentWeeks > 0}
					<div class="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
						<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
						{streak.currentWeeks} week streak
					</div>
				{/if}
			</div>

			<div class="flex gap-2 mb-4">
				{#each Array(streak.weeklyGoal) as _, i}
					<div
						class="flex-1 h-2 rounded-full transition-all duration-500 {i < streak.thisWeekCount
							? 'bg-emerald-500'
							: 'bg-zinc-800'}"
					></div>
				{/each}
			</div>

			<div class="flex items-end justify-between">
				<div>
					<span class="text-3xl font-bold text-white">{streak.thisWeekCount}</span>
					<span class="text-zinc-500 text-lg ml-1">/ {streak.weeklyGoal}</span>
				</div>
				<p class="text-zinc-500 text-sm">
					{#if streak.thisWeekCount >= streak.weeklyGoal}
						Goal reached
					{:else}
						{streak.weeklyGoal - streak.thisWeekCount} more to go
					{/if}
				</p>
			</div>

			{#if streak.currentWeeks > 0 && streak.currentWeeks === streak.longestWeeks && streak.currentWeeks >= 2}
				<div class="mt-4 pt-4 border-t border-zinc-800">
					<p class="text-amber-400 text-sm font-medium text-center">
						Personal best streak
					</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Last Workout</h2>
		{#if workoutStore.latest}
			{@const categories = getSessionCategoryCounts(workoutStore.latest)}
			<a href="/workout/{workoutStore.latest.id}" class="block bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all group">
				<div class="flex flex-wrap gap-2 mb-3">
					{#each categories as { category, count }}
						{@const colors = getCategoryColor(category)}
						<span class="px-2.5 py-1 rounded-md text-xs font-medium border {colors.bg} {colors.text} {colors.border}">
							{getCategoryLabel(category)}{count > 1 ? ` ×${count}` : ''}
						</span>
					{/each}
				</div>
				<div class="flex items-center justify-between">
					<p class="text-zinc-400 text-sm">{formatDate(workoutStore.latest.date)}</p>
					<p class="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">
						{workoutStore.latest.exercises.length} exercise{workoutStore.latest.exercises.length !== 1 ? 's' : ''} →
					</p>
				</div>
			</a>
		{:else}
			<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
				<div class="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
					<svg class="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
				</div>
				<p class="text-zinc-400 font-medium">No workouts yet</p>
				<p class="text-zinc-600 text-sm mt-1">Start your fitness journey today</p>
			</div>
		{/if}
	</section>

	<a
		href="/workout/new"
		class="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-all active:scale-[0.98]"
	>
		Start Workout
	</a>

	{#if workoutStore.recent.length > 1}
		<section class="mt-8">
			<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Recent</h2>
			<div class="space-y-2">
				{#each workoutStore.recent.slice(1) as session}
					{@const categories = getSessionCategoryCounts(session)}
					<a
						href="/workout/{session.id}"
						class="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800"
					>
						<div class="flex items-center gap-2">
							{#each categories.slice(0, 3) as { category }}
								{@const colors = getCategoryColor(category)}
								<span class="w-2 h-2 rounded-full {colors.bg.replace('/20', '')}"></span>
							{/each}
							<span class="text-zinc-300 text-sm ml-1">
								{categories.map(c => getCategoryLabel(c.category)).join(' + ')}
							</span>
						</div>
						<span class="text-zinc-500 text-sm">{formatDate(session.date)}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<div class="flex gap-3 mt-8">
		{#if workoutStore.machines.length > 0}
			<a
				href="/progress"
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
			>
				<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
				<span class="text-zinc-300 text-sm">Progress</span>
			</a>
		{/if}
		<a
			href="/templates"
			class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
		>
			<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<span class="text-zinc-300 text-sm">Templates</span>
			{#if templatesStore.all.length > 0}
				<span class="text-zinc-500 text-xs">({templatesStore.all.length})</span>
			{/if}
		</a>
	</div>

	{#if workoutStore.totalWorkouts > 0}
		<p class="text-center text-zinc-600 text-sm mt-8">
			{workoutStore.totalWorkouts} workout{workoutStore.totalWorkouts !== 1 ? 's' : ''} logged
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
					Load 3 months
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
					Clear
				</button>
			</div>
		</div>
		<div class="h-16"></div>
	{/if}
</div>
