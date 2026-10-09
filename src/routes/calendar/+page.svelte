<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { i18n } from '$lib/i18n';
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
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

<div class="text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<h1 class="text-xl font-bold">{t('history')}</h1>
	</header>

	<!-- Month navigation -->
	<div class="flex items-center justify-between mb-6">
		<button
			onclick={previousMonth}
			class="p-2 text-zinc-400 hover:text-white transition-colors"
			aria-label="Previous month"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<button
			onclick={goToToday}
			class="text-lg font-medium first-letter:uppercase hover:text-emerald-400 transition-colors"
		>
			{monthName}
		</button>

		<button
			onclick={nextMonth}
			class="p-2 text-zinc-400 hover:text-white transition-colors"
			aria-label="Next month"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- Day labels -->
	<div class="grid grid-cols-7 gap-1 mb-2">
		{#each dayLabels as label}
			<div class="text-center text-xs text-zinc-500 font-medium py-2">
				{label}
			</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="grid grid-cols-7 gap-1">
		{#each calendarDays() as day}
			{#if day.date}
				{@const workout = workoutsByDate().get(day.dateString)}
				{@const hasWorkout = !!workout}
				{@const isSelected = selectedWorkout?.date === day.dateString}
				<button
					onclick={() => selectDay(day.dateString)}
					class="aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all relative
						{day.isToday ? 'ring-2 ring-emerald-500' : ''}
						{hasWorkout
							? isSelected
								? 'bg-emerald-500 text-black'
								: 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50'
							: 'text-zinc-400 hover:bg-zinc-800'}"
				>
					{day.date.getDate()}
					{#if hasWorkout && !isSelected}
						<span class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"></span>
					{/if}
				</button>
			{:else}
				<div class="aspect-square"></div>
			{/if}
		{/each}
	</div>

	<div class="mt-6 space-y-2">
		{#each listed as session (session.id)}
			<WorkoutCard {session} />
		{:else}
			<p class="text-center text-zinc-600 text-sm py-6">{t('no_workout_data')}</p>
		{/each}
	</div>
</div>
