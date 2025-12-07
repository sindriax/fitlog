<script lang="ts">
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import type { Exercise, Category, Feeling } from '$lib/types';
	import { generateId, getTodayDateString, getCategoryEmoji, getCategoryLabel } from '$lib/utils';
	import { presetMachines, commonReps, commonSets } from '$lib/presetMachines';

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core'];
	const feelings: { value: Feeling; label: string; emoji: string }[] = [
		{ value: 'too_easy', label: 'Too easy', emoji: '😴' },
		{ value: 'just_right', label: 'Just right', emoji: '💪' },
		{ value: 'too_hard', label: 'Too hard', emoji: '😵' }
	];

	let exercises = $state<Exercise[]>([]);
	let showForm = $state(false);
	let showMachinePicker = $state(false);
	let showCustomInput = $state(false);

	// Form state
	let machine = $state('');
	let category = $state<Category>('legs');
	let weight = $state<number>(20);
	let sets = $state<number>(3);
	let reps = $state<number>(10);
	let feeling = $state<Feeling>('just_right');
	let notes = $state('');

	// For browsing presets
	let selectedCategory = $state<Category>('legs');

	const lastExercise = $derived(machine ? workoutStore.getLastExercise(machine) : null);

	function selectMachine(name: string, cat: Category, defaultWeight: number) {
		machine = name;
		category = cat;

		// Check if we have history for this machine
		const last = workoutStore.getLastExercise(name);
		if (last) {
			weight = last.weight;
			sets = last.sets;
			reps = last.reps;
			// Suggest increase if it was too easy
			if (last.feeling === 'too_easy') {
				weight = last.weight + 2.5;
			}
		} else {
			weight = defaultWeight;
			sets = 3;
			reps = 10;
		}

		showMachinePicker = false;
		showCustomInput = false;
	}

	function adjustWeight(delta: number) {
		weight = Math.max(0, weight + delta);
	}

	function resetForm() {
		machine = '';
		weight = 20;
		sets = 3;
		reps = 10;
		feeling = 'just_right';
		notes = '';
		showForm = false;
		showMachinePicker = false;
		showCustomInput = false;
	}

	function addExercise() {
		if (!machine) return;

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

	async function finishWorkout() {
		if (exercises.length === 0) return;

		await workoutStore.add({
			id: generateId(),
			date: getTodayDateString(),
			exercises
		});

		goto('/');
	}

	function getFeelingEmoji(f: Feeling): string {
		return feelings.find((x) => x.value === f)?.emoji ?? '';
	}

	function openForm() {
		showForm = true;
		showMachinePicker = true;
	}
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6 pb-24">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
		<h1 class="text-xl font-semibold">New Workout</h1>
	</header>

	<p class="text-zinc-400 text-sm mb-6">Today</p>

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

	{#if showForm}
		<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700 mb-6">
			{#if showMachinePicker}
				<h2 class="font-medium mb-4">Pick a Machine</h2>

				<div class="flex gap-1 mb-4 overflow-x-auto pb-2">
					{#each categories as cat}
						<button
							onclick={() => (selectedCategory = cat)}
							class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors {selectedCategory === cat
								? 'bg-emerald-500 text-white'
								: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
						>
							{getCategoryEmoji(cat)} {getCategoryLabel(cat)}
						</button>
					{/each}
				</div>

				<div class="grid grid-cols-2 gap-2 mb-4">
					{#each presetMachines[selectedCategory] as preset}
						<button
							onclick={() => selectMachine(preset.name, preset.category, preset.defaultWeight)}
							class="py-3 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-left transition-colors"
						>
							<p class="text-white text-sm font-medium">{preset.name}</p>
							{#if workoutStore.getLastExercise(preset.name)}
								<p class="text-emerald-400 text-xs mt-0.5">
									Last: {workoutStore.getLastExercise(preset.name)?.weight}kg
								</p>
							{:else}
								<p class="text-zinc-500 text-xs mt-0.5">{preset.defaultWeight}kg</p>
							{/if}
						</button>
					{/each}
				</div>

				{#if showCustomInput}
					<div class="mb-4">
						<input
							type="text"
							bind:value={machine}
							placeholder="Type machine name..."
							class="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
						/>
						<div class="grid grid-cols-3 gap-2 mt-2">
							{#each categories as cat}
								<button
									type="button"
									onclick={() => (category = cat)}
									class="py-1.5 px-2 rounded-lg text-xs transition-colors {category === cat
										? 'bg-emerald-500 text-white'
										: 'bg-zinc-700 text-zinc-300'}"
								>
									{getCategoryEmoji(cat)}
								</button>
							{/each}
						</div>
						<button
							onclick={() => { showMachinePicker = false; showCustomInput = false; }}
							disabled={!machine}
							class="w-full mt-2 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50"
						>
							Continue
						</button>
					</div>
				{:else}
					<button
						onclick={() => (showCustomInput = true)}
						class="w-full py-2 text-zinc-400 hover:text-zinc-300 text-sm"
					>
						+ Custom machine
					</button>
				{/if}

				<button
					onclick={resetForm}
					class="w-full py-2 text-zinc-500 hover:text-zinc-400 text-sm mt-2"
				>
					Cancel
				</button>

			{:else}
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-medium">{getCategoryEmoji(category)} {machine}</h2>
					<button
						onclick={() => (showMachinePicker = true)}
						class="text-zinc-400 text-sm hover:text-zinc-300"
					>
						Change
					</button>
				</div>

				{#if lastExercise}
					<p class="text-zinc-500 text-xs mb-4 -mt-2">
						Last: {lastExercise.weight}kg, {lastExercise.sets}×{lastExercise.reps}
						{#if lastExercise.feeling === 'too_easy'}
							<span class="text-yellow-500">→ try more!</span>
						{:else if lastExercise.feeling === 'too_hard'}
							<span class="text-red-400">→ maybe less</span>
						{/if}
					</p>
				{/if}

				<div class="mb-5">
					<label class="block text-zinc-400 text-sm mb-2">Weight (kg)</label>
					<div class="flex items-center justify-center gap-3">
						<button
							onclick={() => adjustWeight(-5)}
							class="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 text-xl font-bold"
						>
							-5
						</button>
						<button
							onclick={() => adjustWeight(-2.5)}
							class="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-lg"
						>
							-
						</button>
						<div class="w-24 text-center">
							<span class="text-3xl font-bold">{weight}</span>
							<span class="text-zinc-500 text-sm">kg</span>
						</div>
						<button
							onclick={() => adjustWeight(2.5)}
							class="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-lg"
						>
							+
						</button>
						<button
							onclick={() => adjustWeight(5)}
							class="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 text-xl font-bold"
						>
							+5
						</button>
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-400 text-sm mb-2">Sets</label>
					<div class="flex gap-2">
						{#each commonSets as s}
							<button
								onclick={() => (sets = s)}
								class="flex-1 py-2 rounded-lg text-lg font-medium transition-colors {sets === s
									? 'bg-emerald-500 text-white'
									: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
							>
								{s}
							</button>
						{/each}
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-400 text-sm mb-2">Reps</label>
					<div class="flex gap-2 flex-wrap">
						{#each commonReps as r}
							<button
								onclick={() => (reps = r)}
								class="flex-1 min-w-[3rem] py-2 rounded-lg text-lg font-medium transition-colors {reps === r
									? 'bg-emerald-500 text-white'
									: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"
							>
								{r}
							</button>
						{/each}
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-400 text-sm mb-2">How did it feel?</label>
					<div class="grid grid-cols-3 gap-2">
						{#each feelings as f}
							<button
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

				<details class="mb-4">
					<summary class="text-zinc-400 text-sm cursor-pointer hover:text-zinc-300">
						+ Add notes
					</summary>
					<input
						type="text"
						bind:value={notes}
						placeholder="e.g., felt strong today"
						class="w-full mt-2 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</details>

				<div class="flex gap-3">
					<button
						onclick={resetForm}
						class="flex-1 py-3 px-4 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={addExercise}
						class="flex-1 py-3 px-4 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
					>
						Add Exercise
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<button
			onclick={openForm}
			class="w-full py-3 px-4 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors mb-4"
		>
			+ Add Exercise
		</button>
	{/if}

	{#if exercises.length > 0}
		<div class="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800">
			<button
				onclick={finishWorkout}
				class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
			>
				Finish Workout ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})
			</button>
		</div>
	{/if}
</div>
