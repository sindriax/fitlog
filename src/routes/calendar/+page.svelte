<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { i18n } from '$lib/i18n';
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import type { WorkoutSession } from '$lib/types';
	import { todayKey, toDateKey } from '$lib/dates';

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	// Current month being viewed
	let currentDate = $state(new Date());
	let selectedWorkout = $state<WorkoutSession | null>(null);

	const listed = $derived.by(() => {
		if (selectedWorkout) return workoutStore.all.filter((w) => w.date === selectedWorkout!.date);
		const month = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
		return workoutStore.all.filter((w) => w.date.startsWith(month));
	});

	const currentYear = $derived(currentDate.getFullYear());
	const currentMonth = $derived(currentDate.getMonth());

	// Get month name
	const monthName = $derived(
		currentDate.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })
	);

	// Day labels
	const dayLabels = $derived([
		t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')
	]);

	// Get workouts indexed by date for quick lookup
	const workoutsByDate = $derived(() => {
		const map = new Map<string, WorkoutSession>();
		for (const workout of workoutStore.all) {
			map.set(workout.date, workout);
		}
		return map;
	});

	// Generate calendar days for current month
	const calendarDays = $derived(() => {
		const firstDay = new Date(currentYear, currentMonth, 1);
		const lastDay = new Date(currentYear, currentMonth + 1, 0);

		// Get the day of week for the first day (0 = Sunday, convert to Monday-based)
		let startDayOfWeek = firstDay.getDay();
		startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0

		const days: { date: Date | null; dateString: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

		// Add empty slots for days before the first of the month
		for (let i = 0; i < startDayOfWeek; i++) {
			days.push({ date: null, dateString: '', isCurrentMonth: false, isToday: false });
		}

		const today = todayKey();

		// Add days of the month
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(currentYear, currentMonth, day);
			const dateString = toDateKey(date);
			days.push({
				date,
				dateString,
				isCurrentMonth: true,
				isToday: dateString === today
			});
		}

		return days;
	});

	function previousMonth() {
		currentDate = new Date(currentYear, currentMonth - 1, 1);
		selectedWorkout = null;
	}

	function nextMonth() {
		currentDate = new Date(currentYear, currentMonth + 1, 1);
		selectedWorkout = null;
	}

	function goToToday() {
		currentDate = new Date();
		selectedWorkout = null;
	}

	function selectDay(dateString: string) {
		const workout = workoutsByDate().get(dateString);
		if (workout) {
			selectedWorkout = selectedWorkout?.date === dateString ? null : workout;
		}
	}
</script>

<div class="text-white px-6 pt-8 pb-6">
	<PageHeader title={t('history')} />

	<div class="flex items-center justify-between mb-4">
		<button
			onclick={previousMonth}
			class="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
			aria-label={t('previous_month')}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<button onclick={goToToday} class="font-display text-3xl font-extrabold uppercase hover:text-emerald-300 transition-colors">
			{monthName}
		</button>

		<button
			onclick={nextMonth}
			class="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
			aria-label={t('next_month')}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<div class="grid grid-cols-7 gap-1.5 mb-1.5">
		{#each dayLabels as label}
			<div class="text-center text-xs text-zinc-600 font-semibold py-1">{label}</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 gap-1.5">
		{#each calendarDays() as day}
			{#if day.date}
				{@const workout = workoutsByDate().get(day.dateString)}
				{@const isSelected = selectedWorkout?.date === day.dateString}
				<button
					onclick={() => selectDay(day.dateString)}
					aria-pressed={isSelected}
					aria-label="{day.dateString}{workout ? `, ${workout.title ?? ''}` : ''}"
					class="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all
						{day.isToday && !workout ? 'ring-2 ring-emerald-400/70' : ''}
						{workout
							? isSelected
								? 'bg-emerald-300 text-zinc-950 scale-105'
								: 'bg-emerald-400 text-zinc-950 shadow-[0_0_14px_-4px] shadow-emerald-400/60'
							: 'text-zinc-500 hover:bg-zinc-900'}"
				>
					<span class="text-sm font-semibold leading-none">{day.date.getDate()}</span>
					{#if workout?.title}
						<span class="font-display text-xs font-extrabold uppercase leading-none mt-0.5">{workout.title.slice(0, 1)}</span>
					{/if}
				</button>
			{:else}
				<div class="aspect-square"></div>
			{/if}
		{/each}
	</div>

	<div class="mt-8 divide-y divide-zinc-900">
		{#each listed as session (session.id)}
			<WorkoutCard {session} />
		{:else}
			<p class="text-center text-zinc-600 text-sm py-6">{t('no_workout_data')}</p>
		{/each}
	</div>
</div>
