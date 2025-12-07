<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import {
		formatDate,
		getCategoryEmoji,
		getCategoryLabel,
		formatSessionCategories,
		generateId
	} from '$lib/utils';
	import type { Exercise, Feeling, Category } from '$lib/types';

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core'];
	const feelingOptions: { value: Feeling; label: string; emoji: string }[] = [
		{ value: 'too_easy', label: 'Too easy', emoji: '😴' },
		{ value: 'just_right', label: 'Just right', emoji: '💪' },
		{ value: 'too_hard', label: 'Too hard', emoji: '😵' }
	];
	const feelings: Record<Feeling, { label: string; emoji: string }> = {
		too_easy: { label: 'Too easy', emoji: '😴' },
		just_right: { label: 'Just right', emoji: '💪' },
		too_hard: { label: 'Too hard', emoji: '😵' }
	};

	let showDeleteConfirm = $state(false);
	let editingExerciseId = $state<string | null>(null);
	let showAddForm = $state(false);

	let editMachine = $state('');
	let editCategory = $state<Category>('legs');
	let editWeight = $state<number | ''>('');
	let editSets = $state<number | ''>('');
	let editReps = $state<number | ''>('');
	let editFeeling = $state<Feeling>('just_right');
	let editNotes = $state('');

	const workout = $derived(workoutStore.all.find((w) => w.id === $page.params.id));

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
		showAddForm = false;
	}

	async function saveExercise() {
		if (!workout || !editMachine || !editWeight || !editSets || !editReps) return;

		const updatedExercises = workout.exercises.map((e) =>
			e.id === editingExerciseId
				? {
						...e,
						machine: editMachine,
						category: editCategory,
						weight: Number(editWeight),
						sets: Number(editSets),
						reps: Number(editReps),
						feeling: editFeeling,
						notes: editNotes || undefined
					}
				: e
		);

		await workoutStore.update({ ...workout, exercises: updatedExercises });
		editingExerciseId = null;
		resetForm();
	}

	async function deleteExercise(exerciseId: string) {
		if (!workout) return;
		const updatedExercises = workout.exercises.filter((e) => e.id !== exerciseId);
		await workoutStore.update({ ...workout, exercises: updatedExercises });
	}

	async function addExercise() {
		if (!workout || !editMachine || !editWeight || !editSets || !editReps) return;

		const newExercise: Exercise = {
			id: generateId(),
			machine: editMachine,
			category: editCategory,
			weight: Number(editWeight),
			sets: Number(editSets),
			reps: Number(editReps),
			feeling: editFeeling,
			notes: editNotes || undefined
		};

		await workoutStore.update({ ...workout, exercises: [...workout.exercises, newExercise] });
		resetForm();
	}
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
			<h1 class="text-xl font-semibold">Workout Details</h1>
		</div>
		{#if workout}
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="text-red-400 hover:text-red-300 text-sm"
			>
				Delete
			</button>
		{/if}
	</header>

	{#if workout}
		<div class="mb-6">
			<p class="text-lg">{formatSessionCategories(workout)}</p>
			<p class="text-zinc-400 text-sm mt-1">{formatDate(workout.date)}</p>
		</div>

		<section>
			<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
				Exercises ({workout.exercises.length})
			</h2>
			<div class="space-y-3">
				{#each workout.exercises as exercise}
					{#if editingExerciseId === exercise.id}
					<div class="bg-zinc-800 rounded-xl p-4 border border-emerald-500">
							<input
								type="text"
								bind:value={editMachine}
								placeholder="Machine name"
								class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white mb-3"
							/>
							<div class="grid grid-cols-3 gap-2 mb-3">
								{#each categories as cat}
									<button
										type="button"
										onclick={() => (editCategory = cat)}
										class="py-1.5 px-2 rounded-lg text-xs transition-colors {editCategory === cat
											? 'bg-emerald-500 text-white'
											: 'bg-zinc-700 text-zinc-300'}"
									>
										{getCategoryEmoji(cat)} {getCategoryLabel(cat)}
									</button>
								{/each}
							</div>
							<div class="grid grid-cols-3 gap-2 mb-3">
								<input
									type="number"
									bind:value={editWeight}
									placeholder="kg"
									class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
								/>
								<input
									type="number"
									bind:value={editSets}
									placeholder="sets"
									class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
								/>
								<input
									type="number"
									bind:value={editReps}
									placeholder="reps"
									class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
								/>
							</div>
							<div class="grid grid-cols-3 gap-2 mb-3">
								{#each feelingOptions as f}
									<button
										type="button"
										onclick={() => (editFeeling = f.value)}
										class="py-1.5 px-2 rounded-lg text-xs transition-colors {editFeeling === f.value
											? 'bg-emerald-500 text-white'
											: 'bg-zinc-700 text-zinc-300'}"
									>
										{f.emoji}
									</button>
								{/each}
							</div>
							<input
								type="text"
								bind:value={editNotes}
								placeholder="Notes (optional)"
								class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm mb-3"
							/>
							<div class="flex gap-2">
								<button
									onclick={cancelEdit}
									class="flex-1 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm"
								>
									Cancel
								</button>
								<button
									onclick={saveExercise}
									class="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm"
								>
									Save
								</button>
							</div>
						</div>
					{:else}
						<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
							<div class="flex items-start justify-between">
								<div class="flex-1" onclick={() => startEditExercise(exercise)} role="button" tabindex="0">
									<p class="font-medium">
										{getCategoryEmoji(exercise.category)} {exercise.machine}
									</p>
									<p class="text-zinc-400 text-sm mt-1">
										{exercise.weight}kg · {exercise.sets} sets × {exercise.reps} reps
									</p>
									<p class="text-zinc-500 text-sm mt-2">
										{feelings[exercise.feeling].emoji} {feelings[exercise.feeling].label}
									</p>
									{#if exercise.notes}
										<p class="text-zinc-500 text-sm mt-2 italic">"{exercise.notes}"</p>
									{/if}
								</div>
								<button
									onclick={() => deleteExercise(exercise.id)}
									class="text-zinc-500 hover:text-red-400 text-xs ml-2"
								>
									✕
								</button>
							</div>
							<p class="text-zinc-600 text-xs mt-2">Tap to edit</p>
						</div>
					{/if}
				{/each}
			</div>

			{#if showAddForm}
				<div class="bg-zinc-800 rounded-xl p-4 border border-emerald-500 mt-3">
					<h3 class="font-medium mb-3">Add Exercise</h3>
					<input
						type="text"
						bind:value={editMachine}
						placeholder="Machine name"
						class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white mb-3"
					/>
					<div class="grid grid-cols-3 gap-2 mb-3">
						{#each categories as cat}
							<button
								type="button"
								onclick={() => (editCategory = cat)}
								class="py-1.5 px-2 rounded-lg text-xs transition-colors {editCategory === cat
									? 'bg-emerald-500 text-white'
									: 'bg-zinc-700 text-zinc-300'}"
							>
								{getCategoryEmoji(cat)} {getCategoryLabel(cat)}
							</button>
						{/each}
					</div>
					<div class="grid grid-cols-3 gap-2 mb-3">
						<input
							type="number"
							bind:value={editWeight}
							placeholder="kg"
							class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
						/>
						<input
							type="number"
							bind:value={editSets}
							placeholder="sets"
							class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
						/>
						<input
							type="number"
							bind:value={editReps}
							placeholder="reps"
							class="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm"
						/>
					</div>
					<div class="grid grid-cols-3 gap-2 mb-3">
						{#each feelingOptions as f}
							<button
								type="button"
								onclick={() => (editFeeling = f.value)}
								class="py-1.5 px-2 rounded-lg text-xs transition-colors {editFeeling === f.value
									? 'bg-emerald-500 text-white'
									: 'bg-zinc-700 text-zinc-300'}"
							>
								{f.emoji}
							</button>
						{/each}
					</div>
					<input
						type="text"
						bind:value={editNotes}
						placeholder="Notes (optional)"
						class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm mb-3"
					/>
					<div class="flex gap-2">
						<button
							onclick={resetForm}
							class="flex-1 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm"
						>
							Cancel
						</button>
						<button
							onclick={addExercise}
							class="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm"
						>
							Add
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showAddForm = true)}
					class="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 text-sm"
				>
					+ Add Exercise
				</button>
			{/if}
		</section>

		{#if showDeleteConfirm}
			<div class="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
				<div class="bg-zinc-800 rounded-xl p-6 max-w-sm w-full border border-zinc-700">
					<h3 class="text-lg font-semibold mb-2">Delete Workout?</h3>
					<p class="text-zinc-400 text-sm mb-6">
						This will permanently delete this workout and all its exercises. This cannot be undone.
					</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showDeleteConfirm = false)}
							class="flex-1 py-2 px-4 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
						>
							Cancel
						</button>
						<button
							onclick={deleteWorkout}
							class="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
			<p class="text-zinc-500">Workout not found</p>
			<a href="/" class="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
				← Back to home
			</a>
		</div>
	{/if}
</div>
