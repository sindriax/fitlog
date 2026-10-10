<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { draftStore } from '$lib/stores/draft.svelte';
	import { i18n, t } from '$lib/i18n';
	import { prefsStore } from '$lib/stores/prefs.svelte';
	import { addDays, daysBetween, parseDateKey, todayKey, weekStartKey } from '$lib/dates';
	import { formatDate, getSessionCategoryCounts } from '$lib/utils';
	import { weekRecap } from '$lib/recap';
	import { bodyweightStore } from '$lib/stores/bodyweight.svelte';
	import { getCategoryTranslation } from '$lib/i18n';
	import WeekRecap from '$lib/components/WeekRecap.svelte';

	const today = todayKey();
	const thisWeek = weekStartKey(today);

	const streak = $derived(workoutStore.streak);
	const daysSinceLastWorkout = $derived(workoutStore.daysSinceLastWorkout);
	const recentWorkouts = $derived(workoutStore.recent.slice(0, 5));
	let confirmDiscard = $state(false);

	const installed =
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	const recap = $derived(weekRecap(workoutStore.all, bodyweightStore.all, addDays(thisWeek, -7)));
	const showRecap = $derived(recap.sessions > 0 && prefsStore.current.recapSeenWeek !== thisWeek);

	const showInstallTip = $derived(!installed && !prefsStore.current.installTipDismissed);
	const lastBackup = $derived(prefsStore.current.lastBackupAt);
	const showBackupReminder = $derived(
		!showInstallTip && workoutStore.totalWorkouts >= 5 && (!lastBackup || daysBetween(lastBackup, today) > 30)
	);

	const draft = $derived(draftStore.current?.exercises.length ? draftStore.current : null);
	const draftDone = $derived(draft?.exercises.filter((e) => e.done).length ?? 0);

	const locale = $derived(i18n.language === 'es' ? 'es-ES' : 'en-US');
	const dateLine = $derived(
		parseDateKey(today).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
	);

	const week = $derived.by(() => {
		const trained = new Set(workoutStore.all.map((w) => w.date));
		return [...t('day_letters')].map((letter, i) => {
			const date = addDays(thisWeek, i);
			return { letter, date, trained: trained.has(date), isToday: date === today, future: date > today };
		});
	});

	function relative(date: string): string {
		const n = daysBetween(date, today);
		if (n <= 1) return formatDate(date);
		return t('n_days_ago').replace('{n}', String(n));
	}

	function lastDone(name: string): string | null {
		return workoutStore.all.find((w) => w.title === name)?.date ?? null;
	}

	function title(session: (typeof recentWorkouts)[number]): string {
		return (
			session.title ??
			getSessionCategoryCounts(session)
				.map((c) => getCategoryTranslation(c.category))
				.join(' + ')
		);
	}

	function discardDraft() {
		if (!confirmDiscard) {
			confirmDiscard = true;
			return;
		}
		draftStore.clear();
		confirmDiscard = false;
	}
</script>

<div class="text-white px-6 pt-8 pb-6">
	<header class="flex items-end justify-between mb-8">
		<div>
			<p class="text-sm text-zinc-500 first-letter:uppercase">{dateLine}</p>
			<h1 class="font-display text-5xl font-extrabold tracking-tight leading-none mt-1">
				Fit<span class="text-emerald-400">Log</span>
			</h1>
		</div>
		{#if streak.currentWeeks > 0}
			<div class="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
				<span class="font-bold">{streak.currentWeeks}</span>
				{streak.currentWeeks === 1 ? t('week_streak') : t('weeks_streak')}
			</div>
		{/if}
	</header>

	{#if showInstallTip || showBackupReminder}
		<div class="flex items-start gap-3 bg-emerald-400/10 rounded-2xl p-4 mb-8 text-sm">
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

	<section class="mb-10" aria-label={t('this_week')}>
		<div class="flex items-baseline justify-between mb-4">
			<p class="font-display font-extrabold leading-none">
				<span class="text-6xl {streak.thisWeekCount >= streak.weeklyGoal ? 'text-emerald-400' : 'text-white'}">
					{streak.thisWeekCount}
				</span>
				<span class="text-3xl text-zinc-600">/{streak.weeklyGoal}</span>
				<span class="ml-1 font-sans text-base font-medium text-zinc-400">{t('workouts_word')}</span>
			</p>
			<p class="text-sm {streak.thisWeekCount >= streak.weeklyGoal ? 'text-emerald-400' : 'text-zinc-500'}">
				{streak.thisWeekCount >= streak.weeklyGoal
					? t('goal_reached')
					: `${streak.weeklyGoal - streak.thisWeekCount} ${t('more_to_go')}`}
			</p>
		</div>
		<ol class="grid grid-cols-7 gap-2">
			{#each week as day (day.date)}
				<li
					class="aspect-square rounded-full flex items-center justify-center text-sm font-semibold transition-colors {day.trained
						? 'bg-emerald-400 text-zinc-950 shadow-[0_0_16px_-2px] shadow-emerald-400/50'
						: day.isToday
							? 'ring-2 ring-emerald-400/70 text-white'
							: day.future
								? 'bg-zinc-900/60 text-zinc-700'
								: 'bg-zinc-900 text-zinc-500'}"
					aria-label="{formatDate(day.date)}{day.trained ? ' ✓' : ''}"
				>
					{day.letter}
				</li>
			{/each}
		</ol>
	</section>

	<section class="mb-10">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-zinc-400">{t('start')}</h2>
			<a href="/templates" class="text-sm text-zinc-500 hover:text-zinc-300">{t('templates')} →</a>
		</div>

		{#if draft}
			<a
				href="/workout/new"
				class="relative block overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
			>
				<span class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/25 blur-2xl"></span>
				<p class="text-sm font-semibold opacity-70">{t('workout_in_progress')}</p>
				<p class="font-display text-4xl font-extrabold uppercase leading-none mt-1">{draft.title ?? t('continue')}</p>
				<p class="mt-3 text-sm font-medium">
					{t('done_count').replace('{done}', String(draftDone)).replace('{total}', String(draft.exercises.length))} →
				</p>
			</a>
			<button
				onclick={discardDraft}
				class="mt-3 text-sm {confirmDiscard ? 'text-rose-400' : 'text-zinc-500'} hover:text-rose-400 transition-colors"
			>
				{confirmDiscard ? t('tap_again_to_discard') : t('discard')}
			</button>
		{:else}
			<div class="grid gap-3 {templatesStore.all.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}">
				{#each templatesStore.all as routine (routine.id)}
					{@const last = lastDone(routine.name)}
					<a
						href="/workout/new?template={routine.id}"
						class="relative flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-transform"
					>
						<span class="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/25 blur-2xl"></span>
						<p class="relative font-display text-3xl font-extrabold uppercase leading-none break-words">{routine.name}</p>
						<div class="relative text-xs font-medium">
							<p>{routine.exercises.length} {routine.exercises.length !== 1 ? t('exercises') : t('exercise')}</p>
							<p class="opacity-70">{last ? `${t('last_done')}: ${relative(last).toLowerCase()}` : t('never_done')}</p>
						</div>
					</a>
				{/each}
			</div>
			<a
				href="/workout/new"
				class="mt-3 flex items-center justify-center gap-2 rounded-2xl py-4 transition-colors {templatesStore.all.length === 0
					? 'bg-emerald-400 text-zinc-950 font-semibold hover:bg-emerald-300'
					: 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}"
			>
				<span class="text-xl leading-none">+</span>
				{templatesStore.all.length === 0 ? t('start_workout') : t('empty_workout')}
			</a>
		{/if}
	</section>

	<section>
		<div class="flex items-center justify-between mb-1">
			<h2 class="text-sm font-semibold text-zinc-400">{t('recent')}</h2>
			{#if daysSinceLastWorkout !== null && daysSinceLastWorkout >= 3}
				<span class="text-sm text-amber-400">{t('rest_day_reminder')}</span>
			{:else if recentWorkouts.length > 0}
				<a href="/calendar" class="text-sm text-zinc-500 hover:text-zinc-300">{t('see_all')} →</a>
			{/if}
		</div>

		{#if recentWorkouts.length > 0}
			<ul class="divide-y divide-zinc-900">
				{#each recentWorkouts as session (session.id)}
					<li>
						<a href="/workout/{session.id}" class="flex items-center justify-between gap-3 py-4 group">
							<div class="min-w-0">
								<p class="font-semibold truncate group-hover:text-emerald-300 transition-colors">{title(session)}</p>
								<p class="text-sm text-zinc-500">
									{session.exercises.length} {session.exercises.length !== 1 ? t('exercises') : t('exercise')}
									{#if session.duration}· {session.duration} min{/if}
								</p>
							</div>
							<span class="text-sm text-zinc-500 shrink-0 first-letter:uppercase">{relative(session.date)}</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="py-6 text-zinc-500">{t('no_workouts_yet')}. {t('start_journey')}.</p>
		{/if}
	</section>
</div>
