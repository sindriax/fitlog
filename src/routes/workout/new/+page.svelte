<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import type { Exercise, Category, Feeling } from '$lib/types';
	import { generateId, getTodayDateString, getCategoryLabel, getCategoryColor } from '$lib/utils';
	import { presetMachines, commonReps, commonSets } from '$lib/presetMachines';

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core'];
	const feelings: { value: Feeling; label: string }[] = [
		{ value: 'too_easy', label: 'Too Easy' },
		{ value: 'just_right', label: 'Good' },
		{ value: 'too_hard', label: 'Too Hard' }
	];

	let exercises = $state<Exercise[]>([]);
	let showForm = $state(false);
	let showMachinePicker = $state(false);
	let showCustomInput = $state(false);
	let showSaveTemplate = $state(false);
	let templateName = $state('');

	$effect(() => {
		const templateId = $page.url.searchParams.get('template');
		if (templateId && exercises.length === 0) {
			const template = templatesStore.getById(templateId);
			if (template) {
				exercises = template.exercises.map((e) => ({
					id: generateId(),
					machine: e.machine,
					category: e.category,
					weight: workoutStore.getLastExercise(e.machine)?.weight ?? e.defaultWeight,
					sets: e.defaultSets,
					reps: e.defaultReps,
					feeling: 'just_right' as Feeling
				}));
			}
		}
	});

	let machine = $state('');
	let category = $state<Category>('legs');
	let weight = $state<number>(20);
	let sets = $state<number>(3);
	let reps = $state<number>(10);
	let feeling = $state<Feeling>('just_right');
	let notes = $state('');

	let selectedCategory = $state<Category>('legs');

	const lastExercise = $derived(machine ? workoutStore.getLastExercise(machine) : null);

	function selectMachine(name: string, cat: Category, defaultWeight: number) {
		machine = name;
		category = cat;

		const last = workoutStore.getLastExercise(name);
		if (last) {
			weight = last.weight;
			sets = last.sets;
			reps = last.reps;
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

	function openForm() {
		showForm = true;
		showMachinePicker = true;
	}

	function saveAsTemplate() {
		if (!templateName.trim() || exercises.length === 0) return;
		templatesStore.add(templateName.trim(), exercises);
		showSaveTemplate = false;
		templateName = '';
	}

	function getFeelingColor(f: Feeling): string {
		if (f === 'too_easy') return 'text-amber-400';
		if (f === 'too_hard') return 'text-rose-400';
		return 'text-emerald-400';
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6 pb-24">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">New Workout</h1>
	</header>

	<p class="text-zinc-500 text-sm mb-6">Today</p>

	{#if exercises.length > 0}
		<div class="space-y-2 mb-6">
			{#each exercises as exercise}
				{@const colors = getCategoryColor(exercise.category)}
				<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="px-2 py-0.5 rounded text-xs font-medium {colors.bg} {colors.text} {colors.border} border">
									{getCategoryLabel(exercise.category)}
								</span>
								<p class="font-medium text-white">{exercise.machine}</p>
							</div>
							<p class="text-zinc-400 text-sm">
								{exercise.weight}kg · {exercise.sets} × {exercise.reps}
								<span class={getFeelingColor(exercise.feeling)}>
									· {feelings.find(f => f.value === exercise.feeling)?.label}
								</span>
							</p>
							{#if exercise.notes}
								<p class="text-zinc-500 text-sm mt-1">{exercise.notes}</p>
							{/if}
						</div>
						<button
							onclick={() => removeExercise(exercise.id)}
							class="text-zinc-600 hover:text-rose-400 transition-colors p-1"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else if !showForm}
		<div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 text-center mb-6">
			<p class="text-zinc-500">No exercises yet</p>
		</div>
	{/if}

	{#if showForm}
		<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-6">
			{#if showMachinePicker}
				<h2 class="font-medium mb-4 text-zinc-200">Select Machine</h2>

				<div class="flex gap-1.5 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
					{#each categories as cat}
						{@const colors = getCategoryColor(cat)}
						<button
							onclick={() => (selectedCategory = cat)}
							class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border {selectedCategory === cat
								? `${colors.bg} ${colors.text} ${colors.border}`
								: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}"
						>
							{getCategoryLabel(cat)}
						</button>
					{/each}
				</div>

				<div class="grid grid-cols-2 gap-2 mb-4">
					{#each presetMachines[selectedCategory] as preset}
						{@const lastUsed = workoutStore.getLastExercise(preset.name)}
						<button
							onclick={() => selectMachine(preset.name, preset.category, preset.defaultWeight)}
							class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-left transition-all"
						>
							<p class="text-white text-sm font-medium">{preset.name}</p>
							{#if lastUsed}
								<p class="text-emerald-400 text-xs mt-0.5">
									Last: {lastUsed.weight}kg
								</p>
							{:else}
								<p class="text-zinc-500 text-xs mt-0.5">{preset.defaultWeight}kg</p>
							{/if}
						</button>
					{/each}
				</div>

				{#if showCustomInput}
					<div class="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
						<input
							type="text"
							bind:value={machine}
							placeholder="Machine name..."
							class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
						/>
						<div class="flex flex-wrap gap-1.5 mt-3">
							{#each categories as cat}
								{@const colors = getCategoryColor(cat)}
								<button
									type="button"
									onclick={() => (category = cat)}
									class="px-2.5 py-1 rounded text-xs transition-all border {category === cat
										? `${colors.bg} ${colors.text} ${colors.border}`
										: 'bg-zinc-900 text-zinc-400 border-zinc-700'}"
								>
									{getCategoryLabel(cat)}
								</button>
							{/each}
						</div>
						<button
							onclick={() => { showMachinePicker = false; showCustomInput = false; }}
							disabled={!machine}
							class="w-full mt-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
						>
							Continue
						</button>
					</div>
				{:else}
					<button
						onclick={() => (showCustomInput = true)}
						class="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
					>
						+ Custom machine
					</button>
				{/if}

				<button
					onclick={resetForm}
					class="w-full py-2 text-zinc-600 hover:text-zinc-400 text-sm mt-2 transition-colors"
				>
					Cancel
				</button>

			{:else}
				{@const colors = getCategoryColor(category)}
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<span class="px-2 py-0.5 rounded text-xs font-medium {colors.bg} {colors.text} {colors.border} border">
							{getCategoryLabel(category)}
						</span>
						<h2 class="font-medium text-white">{machine}</h2>
					</div>
					<button
						onclick={() => (showMachinePicker = true)}
						class="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
					>
						Change
					</button>
				</div>

				{#if lastExercise}
					<div class="text-xs text-zinc-500 mb-4 -mt-2 flex items-center gap-2">
						<span>Last: {lastExercise.weight}kg, {lastExercise.sets}×{lastExercise.reps}</span>
						{#if lastExercise.feeling === 'too_easy'}
							<span class="text-amber-400">→ try more</span>
						{:else if lastExercise.feeling === 'too_hard'}
							<span class="text-rose-400">→ try less</span>
						{/if}
					</div>
				{/if}

				<div class="mb-5">
					<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">Weight (kg)</label>
					<div class="flex items-center justify-center gap-3">
						<button
							onclick={() => adjustWeight(-5)}
							class="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-lg font-medium transition-colors"
						>
							-5
						</button>
						<button
							onclick={() => adjustWeight(-2.5)}
							class="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm transition-colors"
						>
							-
						</button>
						<div class="w-24 text-center">
							<span class="text-3xl font-bold text-white">{weight}</span>
							<span class="text-zinc-500 text-sm ml-1">kg</span>
						</div>
						<button
							onclick={() => adjustWeight(2.5)}
							class="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm transition-colors"
						>
							+
						</button>
						<button
							onclick={() => adjustWeight(5)}
							class="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-lg font-medium transition-colors"
						>
							+5
						</button>
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">Sets</label>
					<div class="flex gap-2">
						{#each commonSets as s}
							<button
								onclick={() => (sets = s)}
								class="flex-1 py-2.5 rounded-lg text-base font-medium transition-all border {sets === s
									? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
									: 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'}"
							>
								{s}
							</button>
						{/each}
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">Reps</label>
					<div class="flex gap-2 flex-wrap">
						{#each commonReps as r}
							<button
								onclick={() => (reps = r)}
								class="flex-1 min-w-[3rem] py-2.5 rounded-lg text-base font-medium transition-all border {reps === r
									? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
									: 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'}"
							>
								{r}
							</button>
						{/each}
					</div>
				</div>

				<div class="mb-4">
					<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">How did it feel?</label>
					<div class="grid grid-cols-3 gap-2">
						{#each feelings as f}
							{@const isSelected = feeling === f.value}
							{@const colorClass = f.value === 'too_easy' ? 'amber' : f.value === 'too_hard' ? 'rose' : 'emerald'}
							<button
								onclick={() => (feeling = f.value)}
								class="py-2.5 px-3 rounded-lg text-sm font-medium transition-all border {isSelected
									? `bg-${colorClass}-500/20 text-${colorClass}-400 border-${colorClass}-500/30`
									: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}"
							>
								{f.label}
							</button>
						{/each}
					</div>
				</div>

				<details class="mb-4">
					<summary class="text-zinc-500 text-sm cursor-pointer hover:text-zinc-300 transition-colors">
						+ Add notes
					</summary>
					<input
						type="text"
						bind:value={notes}
						placeholder="Optional notes..."
						class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</details>

				<div class="flex gap-3">
					<button
						onclick={resetForm}
						class="flex-1 py-3 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={addExercise}
						class="flex-1 py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-colors"
					>
						Add Exercise
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<button
			onclick={openForm}
			class="w-full py-3 px-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors mb-4"
		>
			+ Add Exercise
		</button>
	{/if}

	{#if showSaveTemplate}
		<div class="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
			<div class="bg-zinc-900 rounded-xl p-4 w-full max-w-sm border border-zinc-800">
				<h2 class="font-medium mb-4 text-white">Save as Template</h2>
				<input
					type="text"
					bind:value={templateName}
					placeholder="e.g., Leg Day, Push Day"
					class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 mb-4"
				/>
				<div class="flex gap-3">
					<button
						onclick={() => (showSaveTemplate = false)}
						class="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700"
					>
						Cancel
					</button>
					<button
						onclick={saveAsTemplate}
						disabled={!templateName.trim()}
						class="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 transition-colors"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if exercises.length > 0}
		<div class="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
			<div class="flex gap-3">
				<button
					onclick={() => (showSaveTemplate = true)}
					class="py-4 px-4 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
					title="Save as template"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</button>
				<button
					onclick={finishWorkout}
					class="flex-1 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all"
				>
					Finish Workout ({exercises.length})
				</button>
			</div>
		</div>
	{/if}
</div>
