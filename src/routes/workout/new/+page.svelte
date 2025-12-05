<script lang="ts">
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import type { Exercise, Category, Feeling } from '$lib/types';
	import { generateId, getTodayDateString, getCategoryEmoji, getCategoryLabel } from '$lib/utils';

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core'];
	const feelings: { value: Feeling; label: string; emoji: string }[] = [
		{ value: 'too_easy', label: 'Too easy', emoji: '😴' },
		{ value: 'just_right', label: 'Just right', emoji: '💪' },
		{ value: 'too_hard', label: 'Too hard', emoji: '😵' }
	];

	let exercises = $state<Exercise[]>([]);
	let showForm = $state(false);

	let machine = $state('');
	let category = $state<Category>('legs');
	let weight = $state<number | ''>('');
	let sets = $state<number | ''>('');
	let reps = $state<number | ''>('');
	let feeling = $state<Feeling>('just_right');
	let notes = $state('');

	function resetForm() {
		machine = '';
		weight = '';
		sets = '';
		reps = '';
		feeling = 'just_right';
		notes = '';
		showForm = false;
	}

	function addExercise() {
		if (!machine || !weight || !sets || !reps) return;

		const exercise: Exercise = {
			id: generateId(),
			machine,
			category,
			weight: Number(weight),
			sets: Number(sets),
			reps: Number(reps),
			feeling,
			notes: notes || undefined
		};

		exercises = [...exercises, exercise];
		resetForm();
	}

	function removeExercise(id: string) {
		exercises = exercises.filter((e) => e.id !== id);
	}

	function finishWorkout() {
		if (exercises.length === 0) return;

		workoutStore.add({
			id: generateId(),
			date: getTodayDateString(),
			exercises
		});

		goto('/');
	}

	function getFeelingEmoji(f: Feeling): string {
		return feelings.find((x) => x.value === f)?.emoji ?? '';
	}
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<!-- Header -->
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
		<h1 class="text-xl font-semibold">New Workout</h1>
	</header>

	<!-- Date -->
	<p class="text-zinc-400 text-sm mb-6">Today</p>

	<!-- Exercise List -->
	{#if exercises.length > 0}
		<div class="space-y-3 mb-6">
			{#each exercises as exercise}
				<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
					<div class="flex items-start justify-between">
						<div>
							<p class="font-medium">
								{getCategoryEmoji(exercise.category)} {exercise.machine}
							</p>
							<p class="text-zinc-400 text-sm mt-1">
								{exercise.weight}kg · {exercise.sets}×{exercise.reps} · {getFeelingEmoji(exercise.feeling)}
							</p>
							{#if exercise.notes}
								<p class="text-zinc-500 text-sm mt-1">{exercise.notes}</p>
							{/if}
						</div>
						<button
							onclick={() => removeExercise(exercise.id)}
							class="text-zinc-500 hover:text-red-400 text-sm"
						>
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else if !showForm}
		<div class="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 text-center mb-6">
			<p class="text-zinc-500">No exercises yet</p>
		</div>
	{/if}

	<!-- Add Exercise Form -->
	{#if showForm}
		<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700 mb-6">
			<h2 class="font-medium mb-4">Add Exercise</h2>

			<div class="mb-4">
				<label class="block text-zinc-400 text-sm mb-1">Machine / Exercise</label>
				<input
					type="text"
					bind:value={machine}
					placeholder="e.g., Leg Press"
					class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
				/>
			</div>

			<div class="mb-4">
				<label class="block text-zinc-400 text-sm mb-2">Body Part</label>
				<div class="grid grid-cols-3 gap-2">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => (category = cat)}
							class="py-2 px-3 rounded-lg text-sm transition-colors {category === cat
								? 'bg-emerald-500 text-white'
								: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
						>
							{getCategoryEmoji(cat)} {getCategoryLabel(cat)}
						</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3 mb-4">
				<div>
					<label class="block text-zinc-400 text-sm mb-1">Weight (kg)</label>
					<input
						type="number"
						bind:value={weight}
						placeholder="0"
						class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label class="block text-zinc-400 text-sm mb-1">Sets</label>
					<input
						type="number"
						bind:value={sets}
						placeholder="0"
						class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label class="block text-zinc-400 text-sm mb-1">Reps</label>
					<input
						type="number"
						bind:value={reps}
						placeholder="0"
						class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-zinc-400 text-sm mb-2">How did it feel?</label>
				<div class="grid grid-cols-3 gap-2">
					{#each feelings as f}
						<button
							type="button"
							onclick={() => (feeling = f.value)}
							class="py-2 px-3 rounded-lg text-sm transition-colors {feeling === f.value
								? 'bg-emerald-500 text-white'
								: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
						>
							{f.emoji} {f.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-zinc-400 text-sm mb-1">Notes (optional)</label>
				<input
					type="text"
					bind:value={notes}
					placeholder="e.g., increase weight next time"
					class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
				/>
			</div>

			<div class="flex gap-3">
				<button
					onclick={resetForm}
					class="flex-1 py-2 px-4 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={addExercise}
					disabled={!machine || !weight || !sets || !reps}
					class="flex-1 py-2 px-4 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Add
				</button>
			</div>
		</div>
	{:else}
		<button
			onclick={() => (showForm = true)}
			class="w-full py-3 px-4 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors mb-4"
		>
			+ Add Exercise
		</button>
	{/if}

	<button
		onclick={finishWorkout}
		disabled={exercises.length === 0}
		class="w-full py-4 px-6 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
	>
		✓ Finish Workout
	</button>
</div>
