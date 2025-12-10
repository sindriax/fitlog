<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import {
		formatDate,
		getCategoryColor,
		getSessionCategoryCounts,
		generateId
	} from '$lib/utils';
	import type { Exercise, Feeling, Category } from '$lib/types';
	import { i18n, tm } from '$lib/i18n';
	import { presetMachines } from '$lib/presetMachines';

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core', 'cardio', 'sports'];

	const feelingOptions = $derived([
		{ value: 'too_easy' as Feeling, label: t('too_easy') },
		{ value: 'just_right' as Feeling, label: t('good') },
		{ value: 'too_hard' as Feeling, label: t('too_hard') }
	]);

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

	let showDeleteConfirm = $state(false);
	let showDeleteExerciseConfirm = $state<string | null>(null);
	let editingExerciseId = $state<string | null>(null);
	let showAddForm = $state(false);
	let editingDate = $state(false);
	let editDateValue = $state('');
	let showMachinePicker = $state(false);
	let machinePickerTab = $state<'recent' | 'all'>('recent');
	let selectedPickerCategory = $state<Category>('legs');
	let machineSearchQuery = $state('');

	let editMachine = $state('');
	let editCategory = $state<Category>('legs');
	let editWeight = $state<number | ''>('');
	let editSets = $state<number | ''>('');
	let editReps = $state<number | ''>('');
	let editFeeling = $state<Feeling>('just_right');
	let editNotes = $state('');
	let editCardioMinutes = $state<number | ''>(30);
	let editCardioSpeed = $state<number | ''>(5.5);
	let editCardioIncline = $state<number | ''>(0);
	let editCardioCalories = $state<number | ''>(200);

	const workout = $derived(workoutStore.all.find((w) => w.id === $page.params.id));

	const allMachines = $derived(Object.values(presetMachines).flat());

	const machineSearchResults = $derived(
		machineSearchQuery.trim().length >= 2
			? allMachines.filter(m =>
				tm(m.name).toLowerCase().includes(machineSearchQuery.toLowerCase()) ||
				m.name.toLowerCase().includes(machineSearchQuery.toLowerCase())
			)
			: []
	);

	function selectMachineFromPicker(name: string, cat: Category, defaultWeight?: number) {
		editMachine = name;
		editCategory = cat;

		const last = workoutStore.getLastExercise(name);
		if (last) {
			if ((cat === 'cardio' || cat === 'sports') && last.cardio) {
				editCardioMinutes = last.cardio.minutes;
				editCardioSpeed = last.cardio.speed;
				editCardioIncline = last.cardio.incline;
				editCardioCalories = last.cardio.calories;
			} else {
				editWeight = last.weight;
				editSets = last.sets;
				editReps = last.reps;
			}
		} else {
			if (cat === 'cardio') {
				editCardioMinutes = 30;
				editCardioSpeed = 5.5;
				editCardioIncline = 0;
				editCardioCalories = 200;
			} else if (cat === 'sports') {
				editCardioMinutes = 60;
			} else if (defaultWeight) {
				editWeight = defaultWeight;
			}
		}

		showMachinePicker = false;
		machineSearchQuery = '';
	}

	async function deleteWorkout() {
		if (!workout) return;
		await workoutStore.delete(workout.id);
		goto('/');
	}

	function startEditExercise(exercise: Exercise) {
		editingExerciseId = exercise.id;
		editMachine = exercise.machine;
		editCategory = exercise.category;
		editWeight = exercise.weight;
		editSets = exercise.sets;
		editReps = exercise.reps;
		editFeeling = exercise.feeling;
		editNotes = exercise.notes || '';
		if (exercise.cardio) {
			editCardioMinutes = exercise.cardio.minutes;
			editCardioSpeed = exercise.cardio.speed;
			editCardioIncline = exercise.cardio.incline;
			editCardioCalories = exercise.cardio.calories;
		} else {
			editCardioMinutes = 30;
			editCardioSpeed = 5.5;
			editCardioIncline = 0;
			editCardioCalories = 200;
		}
	}

	function cancelEdit() {
		editingExerciseId = null;
		resetForm();
	}

	function resetForm() {
		editMachine = '';
		editCategory = 'legs';
		editWeight = '';
		editSets = '';
		editReps = '';
		editFeeling = 'just_right';
		editNotes = '';
		editCardioMinutes = 30;
		editCardioSpeed = 5.5;
		editCardioIncline = 0;
		editCardioCalories = 200;
		showAddForm = false;
	}

	async function saveExercise() {
		if (!workout || !editMachine) return;

		const isCardioOrSports = editCategory === 'cardio' || editCategory === 'sports';
		if (editCategory === 'cardio') {
			if (!editCardioMinutes || !editCardioSpeed) return;
		} else if (editCategory === 'sports') {
			if (!editCardioMinutes) return;
		} else {
			if (!editWeight || !editSets || !editReps) return;
		}

		const updatedExercises = workout.exercises.map((e) =>
			e.id === editingExerciseId
				? {
						...e,
						machine: editMachine,
						category: editCategory,
						weight: isCardioOrSports ? 0 : Number(editWeight),
						sets: isCardioOrSports ? 0 : Number(editSets),
						reps: isCardioOrSports ? 0 : Number(editReps),
						feeling: editFeeling,
						notes: editNotes || undefined,
						...(isCardioOrSports && {
							cardio: {
								minutes: Number(editCardioMinutes),
								speed: Number(editCardioSpeed),
								incline: Number(editCardioIncline),
								calories: Number(editCardioCalories)
							}
						})
					}
				: e
		);

		await workoutStore.update({ ...workout, exercises: updatedExercises });
		editingExerciseId = null;
		resetForm();
		toastStore.show(t('changes_saved'), 'success');
	}

	function confirmDeleteExercise(exerciseId: string) {
		showDeleteExerciseConfirm = exerciseId;
	}

	async function deleteExercise() {
		if (!workout || !showDeleteExerciseConfirm) return;
		const updatedExercises = workout.exercises.filter((e) => e.id !== showDeleteExerciseConfirm);
		await workoutStore.update({ ...workout, exercises: updatedExercises });
		showDeleteExerciseConfirm = null;
		toastStore.show(t('exercise_deleted'), 'info');
	}

	async function addExercise() {
		if (!workout || !editMachine) return;

		const isCardioOrSports = editCategory === 'cardio' || editCategory === 'sports';
		if (editCategory === 'cardio') {
			if (!editCardioMinutes || !editCardioSpeed) return;
		} else if (editCategory === 'sports') {
			if (!editCardioMinutes) return;
		} else {
			if (!editWeight || !editSets || !editReps) return;
		}

		const newExercise: Exercise = {
			id: generateId(),
			machine: editMachine,
			category: editCategory,
			weight: isCardioOrSports ? 0 : Number(editWeight),
			sets: isCardioOrSports ? 0 : Number(editSets),
			reps: isCardioOrSports ? 0 : Number(editReps),
			feeling: editFeeling,
			notes: editNotes || undefined,
			...(isCardioOrSports && {
				cardio: {
					minutes: Number(editCardioMinutes),
					speed: Number(editCardioSpeed),
					incline: Number(editCardioIncline),
					calories: Number(editCardioCalories)
				}
			})
		};

		await workoutStore.update({ ...workout, exercises: [...workout.exercises, newExercise] });
		resetForm();
	}

	function getFeelingLabel(feeling: Feeling): string {
		return feelingOptions.find(f => f.value === feeling)?.label || 'Good';
	}

	function getFeelingColor(feeling: Feeling): { bg: string; text: string } {
		if (feeling === 'too_easy') return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
		if (feeling === 'too_hard') return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
		return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
	}

	function startEditDate() {
		if (workout) {
			editDateValue = workout.date;
			editingDate = true;
		}
	}

	async function saveDate() {
		if (!workout || !editDateValue) return;
		await workoutStore.update({ ...workout, date: editDateValue });
		editingDate = false;
		toastStore.show(t('changes_saved'), 'success');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<a href="/" class="text-zinc-500 hover:text-white transition-colors">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<h1 class="text-xl font-bold">{t('workout_details')}</h1>
		</div>
		{#if workout}
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="text-rose-400 hover:text-rose-300 text-sm transition-colors"
			>
				{t('delete')}
			</button>
		{/if}
	</header>

	{#if workout}
		{@const categoryCounts = getSessionCategoryCounts(workout)}
		<div class="mb-6">
			<div class="flex flex-wrap gap-2 mb-2">
				{#each categoryCounts as { category, count }}
					{@const colors = getCategoryColor(category)}
					<span class="px-2.5 py-1 rounded-md text-xs font-medium border {colors.bg} {colors.text} {colors.border}">
						{getCategoryTranslation(category)}{count > 1 ? ` ×${count}` : ''}
					</span>
				{/each}
			</div>
			{#if editingDate}
				<div class="flex items-center gap-2">
					<input
						type="date"
						bind:value={editDateValue}
						class="bg-zinc-800 border border-emerald-500 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
					/>
					<button
						onclick={saveDate}
						class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm rounded-lg transition-colors"
					>
						{t('save')}
					</button>
					<button
						onclick={() => (editingDate = false)}
						class="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg border border-zinc-700"
					>
						{t('cancel')}
					</button>
				</div>
			{:else}
				<div class="flex items-center gap-3">
					<button
						onclick={startEditDate}
						class="text-zinc-500 text-sm hover:text-zinc-300 transition-colors flex items-center gap-1.5"
					>
						{formatDate(workout.date)}
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>
					{#if workout.duration}
						<span class="text-zinc-600">·</span>
						<span class="text-zinc-500 text-sm flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							{workout.duration} min
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<section>
			<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
				{t('exercises')} ({workout.exercises.length})
			</h2>
			<div class="space-y-2">
				{#each workout.exercises as exercise}
					{@const catColors = getCategoryColor(exercise.category)}
					{@const feelColors = getFeelingColor(exercise.feeling)}
					{#if editingExerciseId === exercise.id}
						<div class="bg-zinc-900 rounded-xl p-4 border border-emerald-500/50">
							<button
								onclick={() => showMachinePicker = true}
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-left mb-3 hover:border-zinc-600 transition-colors flex items-center justify-between"
							>
								<span class={editMachine ? 'text-white' : 'text-zinc-500'}>
									{editMachine ? tm(editMachine) : t('select_machine')}
								</span>
								<span class="text-emerald-400 text-sm">{t('change_exercise')}</span>
							</button>
							<div class="flex flex-wrap gap-1.5 mb-3">
								{#each categories as cat}
									{@const colors = getCategoryColor(cat)}
									<button
										type="button"
										onclick={() => (editCategory = cat)}
										class="px-2.5 py-1 rounded text-xs transition-all border {editCategory === cat
											? `${colors.bg} ${colors.text} ${colors.border}`
											: 'bg-zinc-800 text-zinc-400 border-zinc-700'}"
									>
										{getCategoryTranslation(cat)}
									</button>
								{/each}
							</div>
							{#if editCategory === 'cardio'}
								<div class="grid grid-cols-2 gap-2 mb-3">
									<input
										type="number"
										bind:value={editCardioMinutes}
										placeholder={t('minutes')}
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
									/>
									<input
										type="number"
										step="0.1"
										bind:value={editCardioSpeed}
										placeholder={t('speed')}
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
									/>
									<input
										type="number"
										step="0.5"
										bind:value={editCardioIncline}
										placeholder={t('incline')}
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
									/>
									<input
										type="number"
										bind:value={editCardioCalories}
										placeholder={t('calories')}
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
									/>
								</div>
							{:else if editCategory === 'sports'}
								<div class="mb-3">
									<input
										type="number"
										bind:value={editCardioMinutes}
										placeholder={t('minutes')}
										class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
									/>
								</div>
							{:else}
								<div class="grid grid-cols-3 gap-2 mb-3">
									<input
										type="number"
										bind:value={editWeight}
										placeholder="kg"
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
									/>
									<input
										type="number"
										bind:value={editSets}
										placeholder="sets"
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
									/>
									<input
										type="number"
										bind:value={editReps}
										placeholder="reps"
										class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
									/>
								</div>
							{/if}
							<div class="grid grid-cols-3 gap-2 mb-3">
								{#each feelingOptions as f}
									{@const isSelected = editFeeling === f.value}
									{@const fColors = getFeelingColor(f.value)}
									<button
										type="button"
										onclick={() => (editFeeling = f.value)}
										class="py-2 px-2 rounded-lg text-xs font-medium transition-all border {isSelected
											? `${fColors.bg} ${fColors.text} border-current`
											: 'bg-zinc-800 text-zinc-400 border-zinc-700'}"
									>
										{f.label}
									</button>
								{/each}
							</div>
							<input
								type="text"
								bind:value={editNotes}
								placeholder="Notes (optional)"
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-emerald-500"
							/>
							<div class="flex gap-2">
								<button
									onclick={cancelEdit}
									class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm border border-zinc-700"
								>
									{t('cancel')}
								</button>
								<button
									onclick={saveExercise}
									class="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
								>
									{t('save')}
								</button>
							</div>
						</div>
					{:else}
						<div
							class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer"
							onclick={() => startEditExercise(exercise)}
							onkeydown={(e) => e.key === 'Enter' && startEditExercise(exercise)}
							role="button"
							tabindex="0"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<span class="px-2 py-0.5 rounded text-xs font-medium {catColors.bg} {catColors.text} {catColors.border} border">
											{getCategoryTranslation(exercise.category)}
										</span>
										<p class="font-medium text-white">{tm(exercise.machine)}</p>
									</div>
									<p class="text-zinc-400 text-sm">
										{#if exercise.category === 'cardio' && exercise.cardio}
											{exercise.cardio.minutes} min · {exercise.cardio.speed} km/h · {exercise.cardio.incline}% · {exercise.cardio.calories} cal
										{:else if exercise.category === 'sports' && exercise.cardio}
											{exercise.cardio.minutes} min
										{:else if exercise.category === 'cardio' || exercise.category === 'sports'}
											{exercise.sets} min
										{:else}
											{exercise.weight}kg · {exercise.sets} × {exercise.reps}
										{/if}
									</p>
									<div class="flex items-center gap-2 mt-2">
										<span class="px-2 py-0.5 rounded text-xs font-medium {feelColors.bg} {feelColors.text}">
											{getFeelingLabel(exercise.feeling)}
										</span>
										{#if exercise.notes}
											<span class="text-zinc-500 text-sm">· {exercise.notes}</span>
										{/if}
									</div>
								</div>
								<button
									onclick={(e) => { e.stopPropagation(); confirmDeleteExercise(exercise.id); }}
									class="text-zinc-600 hover:text-rose-400 transition-colors p-1"
									aria-label={t('delete')}
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<p class="text-zinc-600 text-xs mt-2">{t('tap_to_edit')}</p>
						</div>
					{/if}
				{/each}
			</div>

			{#if showAddForm}
				<div class="bg-zinc-900 rounded-xl p-4 border border-emerald-500/50 mt-3">
					<h3 class="font-medium mb-3 text-zinc-200">{t('add_exercise')}</h3>
					<button
						onclick={() => showMachinePicker = true}
						class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-left mb-3 hover:border-zinc-600 transition-colors flex items-center justify-between"
					>
						<span class={editMachine ? 'text-white' : 'text-zinc-500'}>
							{editMachine ? tm(editMachine) : t('select_machine')}
						</span>
						<svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<div class="flex flex-wrap gap-1.5 mb-3">
						{#each categories as cat}
							{@const colors = getCategoryColor(cat)}
							<button
								type="button"
								onclick={() => (editCategory = cat)}
								class="px-2.5 py-1 rounded text-xs transition-all border {editCategory === cat
									? `${colors.bg} ${colors.text} ${colors.border}`
									: 'bg-zinc-800 text-zinc-400 border-zinc-700'}"
							>
								{getCategoryTranslation(cat)}
							</button>
						{/each}
					</div>
					{#if editCategory === 'cardio'}
						<div class="grid grid-cols-2 gap-2 mb-3">
							<input
								type="number"
								bind:value={editCardioMinutes}
								placeholder={t('minutes')}
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
							/>
							<input
								type="number"
								step="0.1"
								bind:value={editCardioSpeed}
								placeholder={t('speed')}
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
							/>
							<input
								type="number"
								step="0.5"
								bind:value={editCardioIncline}
								placeholder={t('incline')}
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
							/>
							<input
								type="number"
								bind:value={editCardioCalories}
								placeholder={t('calories')}
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
							/>
						</div>
					{:else if editCategory === 'sports'}
						<div class="mb-3">
							<input
								type="number"
								bind:value={editCardioMinutes}
								placeholder={t('minutes')}
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
							/>
						</div>
					{:else}
						<div class="grid grid-cols-3 gap-2 mb-3">
							<input
								type="number"
								bind:value={editWeight}
								placeholder="kg"
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
							/>
							<input
								type="number"
								bind:value={editSets}
								placeholder="sets"
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
							/>
							<input
								type="number"
								bind:value={editReps}
								placeholder="reps"
								class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
							/>
						</div>
					{/if}
					<div class="grid grid-cols-3 gap-2 mb-3">
						{#each feelingOptions as f}
							{@const isSelected = editFeeling === f.value}
							{@const fColors = getFeelingColor(f.value)}
							<button
								type="button"
								onclick={() => (editFeeling = f.value)}
								class="py-2 px-2 rounded-lg text-xs font-medium transition-all border {isSelected
									? `${fColors.bg} ${fColors.text} border-current`
									: 'bg-zinc-800 text-zinc-400 border-zinc-700'}"
							>
								{f.label}
							</button>
						{/each}
					</div>
					<input
						type="text"
						bind:value={editNotes}
						placeholder="Notes (optional)"
						class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-emerald-500"
					/>
					<div class="flex gap-2">
						<button
							onclick={resetForm}
							class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm border border-zinc-700"
						>
							{t('cancel')}
						</button>
						<button
							onclick={addExercise}
							class="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
						>
							{t('add')}
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showAddForm = true)}
					class="w-full mt-3 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 text-sm transition-colors"
				>
					+ {t('add_exercise')}
				</button>
			{/if}
		</section>

		{#if showDeleteConfirm}
			<div class="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
				<div class="bg-zinc-900 rounded-xl p-6 max-w-sm w-full border border-zinc-800">
					<h3 class="text-lg font-semibold mb-2 text-white">{t('delete_workout')}</h3>
					<p class="text-zinc-400 text-sm mb-6">
						{t('delete_workout_warning')}
					</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showDeleteConfirm = false)}
							class="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-colors"
						>
							{t('cancel')}
						</button>
						<button
							onclick={deleteWorkout}
							class="flex-1 py-2.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-medium transition-colors"
						>
							{t('delete')}
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showDeleteExerciseConfirm}
			<div class="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
				<div class="bg-zinc-900 rounded-xl p-6 max-w-sm w-full border border-zinc-800">
					<h3 class="text-lg font-semibold mb-2 text-white">{t('delete_exercise')}</h3>
					<p class="text-zinc-400 text-sm mb-6">
						{t('delete_exercise_warning')}
					</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showDeleteExerciseConfirm = null)}
							class="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-colors"
						>
							{t('cancel')}
						</button>
						<button
							onclick={deleteExercise}
							class="flex-1 py-2.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-medium transition-colors"
						>
							{t('delete')}
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
			<p class="text-zinc-500">{t('workout_not_found')}</p>
			<a href="/" class="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block transition-colors">
				{t('back_to_home')}
			</a>
		</div>
	{/if}

	{#if showMachinePicker}
		<div class="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
			<div class="bg-zinc-900 rounded-t-2xl p-4 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border-t border-zinc-800">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-medium text-zinc-200">{t('select_machine')}</h2>
					<button
						onclick={() => { showMachinePicker = false; machineSearchQuery = ''; }}
						class="text-zinc-500 hover:text-zinc-300 p-1"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="relative mb-4">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						bind:value={machineSearchQuery}
						placeholder={t('search_machine')}
						class="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</div>

				{#if machineSearchResults.length > 0}
					<div class="grid grid-cols-2 gap-2 mb-4 overflow-y-auto">
						{#each machineSearchResults.slice(0, 10) as preset}
							{@const lastUsed = workoutStore.getLastExercise(preset.name)}
							{@const colors = getCategoryColor(preset.category)}
							<button
								onclick={() => selectMachineFromPicker(preset.name, preset.category, preset.defaultWeight)}
								class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-left transition-all"
							>
								<p class="text-white text-sm font-medium">{tm(preset.name)}</p>
								<p class="text-xs mt-0.5 {colors.text}">{getCategoryTranslation(preset.category)}</p>
								{#if lastUsed && preset.category !== 'cardio' && preset.category !== 'sports'}
									<p class="text-emerald-400 text-xs mt-0.5">{t('last_weight')}: {lastUsed.weight}kg</p>
								{/if}
							</button>
						{/each}
					</div>
				{:else if machineSearchQuery.trim().length >= 2}
					<p class="text-zinc-500 text-sm text-center mb-4">{t('no_results')}</p>
				{/if}

				<div class="flex gap-2 mb-4">
					<button
						onclick={() => machinePickerTab = 'recent'}
						class="flex-1 py-2 rounded-lg text-sm font-medium transition-all {machinePickerTab === 'recent'
							? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
							: 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
					>
						{t('recent_exercises')}
					</button>
					<button
						onclick={() => machinePickerTab = 'all'}
						class="flex-1 py-2 rounded-lg text-sm font-medium transition-all {machinePickerTab === 'all'
							? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
							: 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
					>
						{t('all_exercises')}
					</button>
				</div>

				<div class="flex-1 overflow-y-auto">
					{#if machinePickerTab === 'recent'}
						{#if workoutStore.recentMachines.length > 0}
							<div class="grid grid-cols-2 gap-2">
								{#each workoutStore.recentMachines as recent}
									{@const colors = getCategoryColor(recent.category)}
									<button
										onclick={() => selectMachineFromPicker(recent.machine, recent.category, recent.lastWeight)}
										class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-left transition-all"
									>
										<p class="text-white text-sm font-medium">{tm(recent.machine)}</p>
										<p class="text-xs mt-0.5 {colors.text}">{getCategoryTranslation(recent.category)}</p>
										{#if recent.category !== 'cardio' && recent.category !== 'sports'}
											<p class="text-emerald-400 text-xs mt-0.5">{t('last_weight')}: {recent.lastWeight}kg</p>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<div class="text-center py-6 text-zinc-500">
								<p class="text-sm mb-2">No recent exercises yet</p>
								<button
									onclick={() => machinePickerTab = 'all'}
									class="text-emerald-400 text-sm hover:underline"
								>
									Browse all exercises →
								</button>
							</div>
						{/if}
					{:else}
						<div class="flex gap-1.5 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
							{#each categories as cat}
								{@const colors = getCategoryColor(cat)}
								<button
									onclick={() => selectedPickerCategory = cat}
									class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border {selectedPickerCategory === cat
										? `${colors.bg} ${colors.text} ${colors.border}`
										: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}"
								>
									{getCategoryTranslation(cat)}
								</button>
							{/each}
						</div>

						<div class="grid grid-cols-2 gap-2">
							{#each presetMachines[selectedPickerCategory] as preset}
								{@const lastUsed = workoutStore.getLastExercise(preset.name)}
								<button
									onclick={() => selectMachineFromPicker(preset.name, preset.category, preset.defaultWeight)}
									class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-left transition-all"
								>
									<p class="text-white text-sm font-medium">{tm(preset.name)}</p>
									{#if lastUsed}
										{#if preset.category !== 'cardio' && preset.category !== 'sports'}
											<p class="text-emerald-400 text-xs mt-0.5">{t('last_weight')}: {lastUsed.weight}kg</p>
										{/if}
									{:else if preset.defaultWeight}
										<p class="text-zinc-500 text-xs mt-0.5">{preset.defaultWeight}kg</p>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
