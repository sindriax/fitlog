<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { formatDate, generateId, getSessionCategoryCounts } from '$lib/utils';
	import { isTimed, summarize, weightStep } from '$lib/progression';
	import type { Category, Exercise } from '$lib/types';
	import { t, tm, getCategoryTranslation } from '$lib/i18n';
	import MachinePicker from '$lib/components/MachinePicker.svelte';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';

	const workout = $derived(workoutStore.all.find((w) => w.id === $page.params.id));

	let exercises = $state<Exercise[]>([]);
	let loadedId = '';
	let expandedId = $state<string | null>(null);
	let showPicker = $state(false);
	let editingDate = $state(false);
	let confirmDelete = $state(false);
	let confirmRemoveId = $state<string | null>(null);
	let showSaveRoutine = $state(false);
	let routineName = $state('');

	$effect(() => {
		if (workout && workout.id !== loadedId) {
			loadedId = workout.id;
			exercises = structuredClone($state.snapshot(workout.exercises));
		}
	});

	$effect(() => {
		const snapshot = $state.snapshot(exercises);
		if (!workout || workout.id !== loadedId) return;
		if (JSON.stringify(snapshot) !== JSON.stringify(workout.exercises)) {
			workoutStore.update({ ...workout, exercises: snapshot });
		}
	});

	const title = $derived(
		workout?.title ??
			(workout ? getSessionCategoryCounts(workout).map((c) => getCategoryTranslation(c.category)).join(' + ') : '')
	);

	function stepFor(machine: string): number {
		return weightStep(workoutStore.getMachineHistory(machine).map((h) => h.weight));
	}

	function toggle(id: string) {
		expandedId = expandedId === id ? null : id;
		confirmRemoveId = null;
	}

	function removeExercise(id: string) {
		if (confirmRemoveId !== id) {
			confirmRemoveId = id;
			return;
		}
		exercises = exercises.filter((e) => e.id !== id);
		expandedId = null;
		toastStore.show(t('exercise_deleted'), 'info');
	}

	function addMachine(machine: string, category: Category, defaultWeight?: number) {
		const last = workoutStore.getLastExercise(machine);
		const exercise: Exercise = {
			id: generateId(),
			machine,
			category,
			weight: last?.weight ?? defaultWeight ?? 20,
			sets: last?.sets ?? 3,
			reps: last?.reps ?? 10,
			next: 'stay'
		};
		if (isTimed(exercise)) {
			exercise.weight = exercise.sets = exercise.reps = 0;
			exercise.cardio = last?.cardio ? { ...last.cardio } : { minutes: 30, speed: 0, incline: 0, calories: 0 };
		}
		exercises = [...exercises, exercise];
		expandedId = exercise.id;
		showPicker = false;
	}

	function changeDate(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		if (workout && value) workoutStore.update({ ...workout, date: value });
		editingDate = false;
	}

	function deleteWorkout() {
		if (!confirmDelete) {
			confirmDelete = true;
			return;
		}
		if (!workout) return;
		workoutStore.delete(workout.id);
		toastStore.show(t('workout_deleted'), 'info');
		goto('/');
	}

	function saveRoutine() {
		if (!routineName.trim() || exercises.length === 0) return;
		templatesStore.add(routineName.trim(), exercises);
		if (workout && !workout.title) workoutStore.update({ ...workout, title: routineName.trim() });
		showSaveRoutine = false;
		toastStore.show(t('template_saved'), 'success');
	}
</script>

<div class="text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<button onclick={() => history.back()} class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		{#if workout}
			<div class="min-w-0">
				<h1 class="text-xl font-bold truncate">{title}</h1>
				<div class="flex items-center gap-2 text-sm text-zinc-500">
					{#if editingDate}
						<input
							type="date"
							value={workout.date}
							onchange={changeDate}
							onblur={() => (editingDate = false)}
							class="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-white"
						/>
					{:else}
						<button onclick={() => (editingDate = true)} class="hover:text-zinc-300 underline decoration-dotted underline-offset-4">
							{formatDate(workout.date)}
						</button>
					{/if}
					{#if workout.duration}<span>· {workout.duration} min</span>{/if}
				</div>
			</div>
		{/if}
	</header>

	{#if workout}
		<div class="space-y-2 mb-4">
			{#each exercises as exercise, index (exercise.id)}
				{@const expanded = expandedId === exercise.id}
				<div class="bg-zinc-900 rounded-xl border {expanded ? 'border-zinc-700' : 'border-zinc-800'}">
					<button class="w-full text-left p-4 flex items-center justify-between gap-3" onclick={() => toggle(exercise.id)}>
						<div class="min-w-0">
							<p class="font-medium truncate">{tm(exercise.machine)}</p>
							<p class="text-lg font-semibold font-mono">{summarize(exercise)}</p>
							{#if exercise.notes && !expanded}
								<p class="text-xs text-zinc-500 truncate">{exercise.notes}</p>
							{/if}
						</div>
						<span
							class="shrink-0 text-xs font-medium px-2 py-1 rounded {exercise.next === 'up'
								? 'bg-amber-500/20 text-amber-400'
								: exercise.next === 'down'
									? 'bg-rose-500/20 text-rose-400'
									: 'bg-emerald-500/10 text-emerald-400'}"
						>
							{t(exercise.next)}
						</span>
					</button>

					{#if expanded}
						<div class="px-4 pb-4 pt-4 border-t border-zinc-800 space-y-4">
							<ExerciseEditor bind:exercise={exercises[index]} step={stepFor(exercise.machine)} />
							<div class="flex items-center justify-between">
								<button
									onclick={() => removeExercise(exercise.id)}
									class="text-sm {confirmRemoveId === exercise.id ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'}"
								>
									{confirmRemoveId === exercise.id ? t('tap_again_to_delete') : t('remove')}
								</button>
								<button onclick={() => toggle(exercise.id)} class="px-5 py-2.5 rounded-lg font-medium bg-emerald-500 text-zinc-950">
									{t('done')}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if showPicker}
			<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-4">
				<MachinePicker onselect={addMachine} oncancel={() => (showPicker = false)} />
			</div>
		{:else}
			<button
				onclick={() => (showPicker = true)}
				class="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors mb-4"
			>
				+ {t('add_exercise')}
			</button>
		{/if}

		{#if showSaveRoutine}
			<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-4">
				<input
					bind:value={routineName}
					placeholder={t('template_name_placeholder')}
					aria-label={t('save_as_template')}
					class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 mb-3"
				/>
				<div class="flex gap-3">
					<button onclick={() => (showSaveRoutine = false)} class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300">
						{t('cancel')}
					</button>
					<button
						onclick={saveRoutine}
						disabled={!routineName.trim()}
						class="flex-1 py-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-medium disabled:opacity-50"
					>
						{t('save')}
					</button>
				</div>
			</div>
		{:else}
			<button
				onclick={() => {
					routineName = workout.title ?? '';
					showSaveRoutine = true;
				}}
				class="w-full py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors mb-4"
			>
				{t('save_as_template')}
			</button>
		{/if}

		<button
			onclick={deleteWorkout}
			class="w-full py-3 text-sm transition-colors {confirmDelete ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}"
		>
			{confirmDelete ? t('tap_again_to_delete') : t('delete_workout')}
		</button>
	{:else}
		<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
			<p class="text-zinc-500">{t('workout_not_found')}</p>
			<a href="/" class="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block transition-colors">
				{t('back_to_home')}
			</a>
		</div>
	{/if}
</div>
