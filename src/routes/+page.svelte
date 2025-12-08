<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { formatDate, getSessionCategoryCounts, getCategoryColor, getCategoryLabel } from '$lib/utils';
	import { i18n } from '$lib/i18n';

	const streak = $derived(workoutStore.streak);

	// Reactive translations
	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	function getCategoryTranslation(category: string): string {
		const map: Record<string, Parameters<typeof i18n.t>[0]> = {
			legs: 'legs',
			back: 'back_category',
			chest: 'chest',
			shoulders: 'shoulders',
			arms: 'arms',
			core: 'core',
			cardio: 'cardio'
		};
		return t(map[category] || 'legs');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="mb-8 flex items-center justify-between">
		<img src="/fit.png" alt="FitLog" class="h-12" />
		<div class="flex items-center gap-3">
			<a
				href="/import"
				class="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
				title={t('import_data')}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
				</svg>
			</a>
			<button
				onclick={() => i18n.toggle()}
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-sm"
				title={i18n.language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
			>
				<span class="text-base">{i18n.language === 'en' ? '🇬🇧' : '🇪🇸'}</span>
				<span class="text-zinc-400 uppercase text-xs font-medium">{i18n.language}</span>
			</button>
			<button
				onclick={() => authStore.signOut()}
				class="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
			>
				{t('sign_out')}
			</button>
		</div>
	</header>

	<section class="mb-8">
		<div class="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
			<div class="flex items-center justify-between mb-4">
				<p class="text-zinc-400 text-sm font-medium tracking-wide uppercase">{t('this_week')}</p>
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
		<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t('last_workout')}</h2>
		{#if workoutStore.latest}
			{@const categories = getSessionCategoryCounts(workoutStore.latest)}
			<a href="/workout/{workoutStore.latest.id}" class="block bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all group">
				<div class="flex flex-wrap gap-2 mb-3">
					{#each categories as { category, count }}
						{@const colors = getCategoryColor(category)}
						<span class="px-2.5 py-1 rounded-md text-xs font-medium border {colors.bg} {colors.text} {colors.border}">
							{getCategoryTranslation(category)}{count > 1 ? ` ×${count}` : ''}
						</span>
					{/each}
				</div>
				<div class="flex items-center justify-between">
					<p class="text-zinc-400 text-sm">{formatDate(workoutStore.latest.date)}</p>
					<p class="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">
						{workoutStore.latest.exercises.length} {workoutStore.latest.exercises.length !== 1 ? t('exercises') : t('exercise')} →
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

	{#if workoutStore.recent.length > 1}
		<section class="mt-8">
			<h2 class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t('recent')}</h2>
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
								{categories.map(c => getCategoryTranslation(c.category)).join(' + ')}
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
				<span class="text-zinc-300 text-sm">{t('progress')}</span>
			</a>
			<a
				href="/calendar"
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
			>
				<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<span class="text-zinc-300 text-sm">{t('calendar')}</span>
			</a>
		{/if}
		<a
			href="/templates"
			class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
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
