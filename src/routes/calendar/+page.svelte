<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { i18n, tm } from '$lib/i18n';
	import { getCategoryColor, getSessionCategoryCounts } from '$lib/utils';
	import type { WorkoutSession } from '$lib/types';

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	// Current month being viewed
	let currentDate = $state(new Date());
	let selectedWorkout = $state<WorkoutSession | null>(null);

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

		const today = new Date().toISOString().split('T')[0];

		// Add days of the month
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(currentYear, currentMonth, day);
			const dateString = date.toISOString().split('T')[0];
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

<div class="min-h-screen bg-black text-white p-4 pb-24">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">{t('calendar')}</h1>
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
			class="text-lg font-medium capitalize hover:text-emerald-400 transition-colors"
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

	<!-- Selected workout preview -->
	{#if selectedWorkout}
		{@const categories = getSessionCategoryCounts(selectedWorkout)}
		<div class="mt-6 bg-zinc-900 rounded-xl p-4 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
			<div class="flex items-center justify-between mb-3">
				<h3 class="font-medium text-emerald-400">
					{new Date(selectedWorkout.date).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
						weekday: 'long',
						month: 'short',
						day: 'numeric'
					})}
				</h3>
				<a
					href="/workout/{selectedWorkout.id}"
					class="text-sm text-zinc-400 hover:text-white transition-colors"
				>
					View details →
				</a>
			</div>

			<!-- Category pills -->
			<div class="flex flex-wrap gap-2 mb-3">
				{#each categories as { category, count }}
					{@const colors = getCategoryColor(category)}
					<span class="px-2 py-1 rounded text-xs {colors.bg} {colors.text} border {colors.border}">
						{count} {category}
					</span>
				{/each}
			</div>

			<!-- Exercise list -->
			<div class="space-y-1.5">
				{#each selectedWorkout.exercises.slice(0, 5) as exercise}
					{@const colors = getCategoryColor(exercise.category)}
					<div class="flex items-center justify-between text-sm">
						<span class="text-zinc-300">{tm(exercise.machine)}</span>
						<span class="{colors.text} text-xs">
							{#if exercise.category === 'cardio' || exercise.category === 'sports'}
								{exercise.cardio?.minutes ?? 0} min
							{:else}
								{exercise.weight}kg × {exercise.sets}×{exercise.reps}
							{/if}
						</span>
					</div>
				{/each}
				{#if selectedWorkout.exercises.length > 5}
					<p class="text-xs text-zinc-500 pt-1">
						+{selectedWorkout.exercises.length - 5} more
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
