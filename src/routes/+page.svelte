<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { formatDate, getSessionCategoryCounts, getCategoryColor, getCategoryLabel } from '$lib/utils';
	import { i18n } from '$lib/i18n';
	import dumbbellIcon from '$lib/assets/dumbbell.png';

	const streak = $derived(workoutStore.streak);
	const daysSinceLastWorkout = $derived(workoutStore.daysSinceLastWorkout);
	let showAllRecent = $state(false);

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));
	const recentWorkouts = $derived(workoutStore.recent.slice(1));
	const visibleWorkouts = $derived(showAllRecent ? recentWorkouts : recentWorkouts.slice(0, 4));
	const hasMoreWorkouts = $derived(recentWorkouts.length > 4);

	function getCategoryTranslation(category: string): string {
		const map: Record<string, Parameters<typeof i18n.t>[0]> = {
			legs: 'legs',
			back: 'back_category',
			chest: 'chest',
			shoulders: 'shoulders',
			arms: 'arms',
			core: 'core',
			cardio: 'cardio',
			sports: 'sports'
		};
		return t(map[category] || 'legs');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="mb-8 flex items-center justify-between">
		<a href="/" class="hover:opacity-80 transition-opacity">
			<img src="/fit.png" alt="FitLog" class="h-12" />
		</a>
		<a
			href="/settings"
			class="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-900"
			title={t('settings')}
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		</a>
	</header>

	<section class="mb-8">
		<div class="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
			<div class="flex items-center justify-between mb-4">
				<p class="text-zinc-400 text-sm font-bold tracking-widest uppercase">{t('this_week')}</p>
				{#if streak.currentWeeks > 0}
					<div class="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
						<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
						{streak.currentWeeks} {streak.currentWeeks === 1 ? t('week_streak') : t('weeks_streak')}
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
						{t('goal_reached')}
					{:else}
						{streak.weeklyGoal - streak.thisWeekCount} {t('more_to_go')}
					{/if}
				</p>
			</div>

			{#if streak.currentWeeks > 0 && streak.currentWeeks === streak.longestWeeks && streak.currentWeeks >= 2}
				<div class="mt-4 pt-4 border-t border-zinc-800">
					<p class="text-amber-400 text-sm font-medium text-center">
						{t('personal_best')}
					</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="mb-8">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('last_workout')}</h2>
			{#if daysSinceLastWorkout !== null && daysSinceLastWorkout > 0}
				<span class="text-xs {daysSinceLastWorkout >= 3 ? 'text-amber-400' : 'text-zinc-500'}">
					{daysSinceLastWorkout} {daysSinceLastWorkout === 1 ? t('day_ago') : t('days_ago')}
					{#if daysSinceLastWorkout >= 3}
						· {t('rest_day_reminder')}
					{/if}
				</span>
			{/if}
		</div>
		{#if workoutStore.latest}
			{@const categories = getSessionCategoryCounts(workoutStore.latest)}
			<div class="flex gap-2">
				<a href="/workout/{workoutStore.latest.id}" class="flex-1 bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-emerald-500/40 transition-all group">
					<div class="flex flex-wrap gap-2 mb-3">
						{#each categories as { category, count }}
							{@const colors = getCategoryColor(category)}
							<span class="px-2.5 py-1 rounded-md text-xs font-medium border {colors.bg} {colors.text} {colors.border}">
								{getCategoryTranslation(category)}{count > 1 ? ` ×${count}` : ''}
							</span>
						{/each}
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-zinc-400 text-sm">
							<span>{formatDate(workoutStore.latest.date)}</span>
							{#if workoutStore.latest.duration}
								<span class="text-zinc-600">·</span>
								<span class="flex items-center gap-1">
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{workoutStore.latest.duration} min
								</span>
							{/if}
						</div>
						<p class="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">
							{workoutStore.latest.exercises.length} {workoutStore.latest.exercises.length !== 1 ? t('exercises') : t('exercise')} →
						</p>
					</div>
				</a>
				<a
					href="/workout/new?repeat={workoutStore.latest.id}"
					class="flex flex-col items-center justify-center px-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all"
					title={t('repeat_workout')}
				>
					<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span class="text-xs text-zinc-500 mt-1">{t('repeat_workout')}</span>
				</a>
			</div>
		{:else}
			<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
				<img src={dumbbellIcon} alt="" class="w-12 h-12 mx-auto mb-3 opacity-40" />
				<p class="text-zinc-400 font-medium">{t('no_workouts_yet')}</p>
				<p class="text-zinc-600 text-sm mt-1">{t('start_journey')}</p>
			</div>
		{/if}
	</section>

	<a
		href="/workout/new"
		class="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-all active:scale-[0.98]"
	>
		{t('start_workout')}
	</a>

	<div class="flex gap-3 mt-6">
		{#if workoutStore.machines.length > 0}
			<a
				href="/progress"
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
			>
				<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
				<span class="text-zinc-300 text-sm">{t('progress')}</span>
			</a>
			<a
				href="/calendar"
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
			>
				<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<span class="text-zinc-300 text-sm">{t('calendar')}</span>
			</a>
		{/if}
		<a
			href="/templates"
			class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
		>
			<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			<span class="text-zinc-300 text-sm">{t('templates')}</span>
			{#if templatesStore.all.length > 0}
				<span class="text-zinc-500 text-xs">({templatesStore.all.length})</span>
			{/if}
		</a>
	</div>

	{#if recentWorkouts.length > 0}
		<section class="mt-8">
			<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('recent')}</h2>
			<div class="relative">
				<div class="space-y-2">
					{#each visibleWorkouts as session}
						{@const categories = getSessionCategoryCounts(session)}
						<a
							href="/workout/{session.id}"
							class="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-900 transition-all border border-transparent hover:border-emerald-500/30"
						>
							<div class="flex items-center gap-2">
								{#each categories.slice(0, 3) as { category }}
									{@const colors = getCategoryColor(category)}
									<span class="w-2.5 h-2.5 rounded-full border {colors.bg} {colors.border}"></span>
								{/each}
								<span class="text-zinc-300 text-sm ml-1">
									{categories.map(c => getCategoryTranslation(c.category)).join(' + ')}
								</span>
							</div>
							<div class="flex items-center gap-2 text-zinc-500 text-sm">
								{#if session.duration}
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{session.duration}m
									</span>
									<span class="text-zinc-700">·</span>
								{/if}
								<span>{formatDate(session.date)}</span>
							</div>
						</a>
					{/each}
				</div>

				{#if hasMoreWorkouts && !showAllRecent}
					<div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
				{/if}
			</div>

			{#if hasMoreWorkouts}
				<button
					onclick={() => showAllRecent = !showAllRecent}
					class="w-full mt-2 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1"
				>
					{showAllRecent ? t('see_less') : t('see_more')}
					<svg
						class="w-4 h-4 transition-transform {showAllRecent ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
			{/if}
		</section>
	{/if}

	{#if workoutStore.totalWorkouts > 0}
		<p class="text-center text-zinc-600 text-sm mt-8">
			{workoutStore.totalWorkouts} {workoutStore.totalWorkouts !== 1 ? t('workouts_logged') : t('workout_logged')}
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
