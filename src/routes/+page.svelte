<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { draftStore } from '$lib/stores/draft.svelte';
	import { t } from '$lib/i18n';
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import { prefsStore } from '$lib/stores/prefs.svelte';
	import { addDays, daysBetween, todayKey, weekStartKey } from '$lib/dates';
	import { weekRecap } from '$lib/recap';
	import { bodyweightStore } from '$lib/stores/bodyweight.svelte';
	import WeekRecap from '$lib/components/WeekRecap.svelte';
	import dumbbellIcon from '$lib/assets/dumbbell.png';

	const streak = $derived(workoutStore.streak);
	const daysSinceLastWorkout = $derived(workoutStore.daysSinceLastWorkout);
	const recentWorkouts = $derived(workoutStore.recent.slice(0, 5));
	let confirmDiscard = $state(false);

	const installed =
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	const thisWeek = weekStartKey(todayKey());
	const recap = $derived(weekRecap(workoutStore.all, bodyweightStore.all, addDays(thisWeek, -7)));
	const showRecap = $derived(recap.sessions > 0 && prefsStore.current.recapSeenWeek !== thisWeek);

	const showInstallTip = $derived(!installed && !prefsStore.current.installTipDismissed);
	const lastBackup = $derived(prefsStore.current.lastBackupAt);
	const showBackupReminder = $derived(
		!showInstallTip && workoutStore.totalWorkouts >= 5 && (!lastBackup || daysBetween(lastBackup, todayKey()) > 30)
	);

	const draft = $derived(draftStore.current?.exercises.length ? draftStore.current : null);

	function discardDraft() {
		if (!confirmDiscard) {
			confirmDiscard = true;
			return;
		}
		draftStore.clear();
		confirmDiscard = false;
	}
</script>

<div class="text-white p-6">
	<header class="mb-6">
		<img src="/fit.png" alt="FitLog" class="h-12" />
	</header>

	{#if showInstallTip || showBackupReminder}
		<div class="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-sm">
			<p class="flex-1 text-zinc-300">
				{showInstallTip ? t('install_tip') : lastBackup ? t('backup_reminder') : t('backup_never')}
				<a href="/settings" class="text-emerald-400 font-medium whitespace-nowrap">
					{showInstallTip ? t('how') : t('back_up_now')} →
				</a>
			</p>
			{#if showInstallTip}
				<button
					onclick={() => prefsStore.set('installTipDismissed', true)}
					class="text-zinc-500 hover:text-zinc-300 -m-1 p-1"
					aria-label={t('dismiss')}>✕</button
				>
			{/if}
		</div>
	{/if}

	{#if showRecap}
		<WeekRecap {recap} goal={prefsStore.current.weeklyGoal} ondismiss={() => prefsStore.set('recapSeenWeek', thisWeek)} />
	{/if}

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
			<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('start')}</h2>
			<a href="/templates" class="text-xs text-zinc-500 hover:text-zinc-300">
				{t('templates')} ({templatesStore.all.length}) →
			</a>
		</div>
	{#if draft}
		<a
			href="/workout/new"
			class="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-all active:scale-[0.98]"
		>
			{t('continue')} · {draft.exercises.length} {draft.exercises.length !== 1 ? t('exercises') : t('exercise')}
		</a>
		<div class="flex items-center justify-between mt-2 text-sm">
			<span class="text-zinc-500">{t('workout_in_progress')}</span>
			<button onclick={discardDraft} class="{confirmDiscard ? 'text-rose-400' : 'text-zinc-500'} hover:text-rose-400 transition-colors">
				{confirmDiscard ? t('tap_again_to_discard') : t('discard')}
			</button>
		</div>
	{:else if templatesStore.all.length > 0}
		<div class="grid grid-cols-2 gap-3">
			{#each templatesStore.all as routine (routine.id)}
				<a
					href="/workout/new?template={routine.id}"
					class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl p-4 transition-all active:scale-[0.98]"
				>
					<p class="font-bold text-lg truncate">{routine.name}</p>
					<p class="text-sm opacity-70">
						{routine.exercises.length} {routine.exercises.length !== 1 ? t('exercises') : t('exercise')}
					</p>
				</a>
			{/each}
		</div>
		<a
			href="/workout/new"
			class="block w-full mt-3 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-center transition-colors"
		>
			{t('empty_workout')}
		</a>
	{:else}
		<a
			href="/workout/new"
			class="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-all active:scale-[0.98]"
		>
			{t('start_workout')}
		</a>
	{/if}
	</section>

	<section>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('recent')}</h2>
			{#if daysSinceLastWorkout !== null && daysSinceLastWorkout >= 3}
				<span class="text-xs text-amber-400">
					{daysSinceLastWorkout} {t('days_ago')} · {t('rest_day_reminder')}
				</span>
			{:else if recentWorkouts.length > 0}
				<a href="/calendar" class="text-xs text-zinc-500 hover:text-zinc-300">{t('see_all')} →</a>
			{/if}
		</div>

		{#if recentWorkouts.length > 0}
			<div class="space-y-2">
				{#each recentWorkouts as session (session.id)}
					<WorkoutCard {session} />
				{/each}
			</div>
		{:else}
			<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
				<img src={dumbbellIcon} alt="" class="w-12 h-12 mx-auto mb-3 opacity-40" />
				<p class="text-zinc-400 font-medium">{t('no_workouts_yet')}</p>
				<p class="text-zinc-600 text-sm mt-1">{t('start_journey')}</p>
			</div>
		{/if}
	</section>
</div>
