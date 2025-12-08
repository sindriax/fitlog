<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Exercise, Category, Feeling } from '$lib/types';
	import { generateId, getTodayDateString, getCategoryColor } from '$lib/utils';
	import { presetMachines, commonReps, commonSets } from '$lib/presetMachines';
	import { i18n, tm } from '$lib/i18n';

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core', 'cardio', 'sports'];

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	const feelings = $derived([
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

	let exercises = $state<Exercise[]>([]);
	let showForm = $state(false);
	let showMachinePicker = $state(false);
	let showCustomInput = $state(false);
	let showSaveTemplate = $state(false);
	let templateName = $state('');

	$effect(() => {
		const templateId = $page.url.searchParams.get('template');
		const repeatId = $page.url.searchParams.get('repeat');

		if (exercises.length === 0) {
			if (templateId) {
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
			} else if (repeatId) {
				const workout = workoutStore.all.find(w => w.id === repeatId);
				if (workout) {
					exercises = workout.exercises.map((e) => ({
						id: generateId(),
						machine: e.machine,
						category: e.category,
						weight: e.weight,
						sets: e.sets,
						reps: e.reps,
						feeling: 'just_right' as Feeling,
						...(e.cardio && { cardio: { ...e.cardio } })
					}));
				}
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
	let editingWeight = $state(false);
	// Cardio-specific state
	let cardioMinutes = $state<number>(30);
	let cardioSpeed = $state<number>(5.5);
	let cardioIncline = $state<number>(0);
	let cardioCalories = $state<number>(200);

	let selectedCategory = $state<Category>('legs');

	const lastExercise = $derived(machine ? workoutStore.getLastExercise(machine) : null);

	function selectMachine(name: string, cat: Category, defaultWeight?: number) {
		machine = name;
		category = cat;

		const last = workoutStore.getLastExercise(name);
		if (last) {
			if ((cat === 'cardio' || cat === 'sports') && last.cardio) {
				// Load last cardio/sports values
				cardioMinutes = last.cardio.minutes;
				cardioSpeed = last.cardio.speed;
				cardioIncline = last.cardio.incline;
				cardioCalories = last.cardio.calories;
			} else {
				weight = last.weight;
				sets = last.sets;
				reps = last.reps;
				if (last.feeling === 'too_easy') {
					weight = last.weight + 2.5;
				}
			}
		} else {
			if (cat === 'cardio') {
				cardioMinutes = 30;
				cardioSpeed = 5.5;
				cardioIncline = 0;
				cardioCalories = 200;
			} else if (cat === 'sports') {
				cardioMinutes = 60;
				cardioSpeed = 0;
				cardioIncline = 0;
				cardioCalories = 0;
			} else {
				weight = defaultWeight ?? 20;
				sets = 3;
				reps = 10;
			}
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
		editingWeight = false;
		cardioMinutes = 30;
		cardioSpeed = 5.5;
		cardioIncline = 0;
		cardioCalories = 200;
		showForm = false;
		showMachinePicker = false;
		showCustomInput = false;
	}

	function addExercise() {
		if (!machine) return;

		const isCardioOrSports = category === 'cardio' || category === 'sports';

		const exercise: Exercise = {
			id: generateId(),
			machine,
			category,
			weight: isCardioOrSports ? 0 : Number(weight),
			sets: isCardioOrSports ? 0 : Number(sets),
			reps: isCardioOrSports ? 0 : Number(reps),
			feeling,
			notes: notes || undefined,
			...(isCardioOrSports && {
				cardio: {
					minutes: Number(cardioMinutes),
					speed: Number(cardioSpeed),
					incline: Number(cardioIncline),
					calories: Number(cardioCalories)
				}
			})
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

		toastStore.show(t('workout_saved'), 'success');
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
		toastStore.show(t('template_saved'), 'success');
	}

	function getFeelingColor(f: Feeling): string {
		if (f === 'too_easy') return 'text-amber-400';
		if (f === 'too_hard') return 'text-rose-400';
		return 'text-emerald-400';
	}

	function getFeelingLabel(f: Feeling): string {
		return feelings.find(x => x.value === f)?.label || t('good');
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6 pb-24">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">{t('new_workout')}</h1>
	</header>

	<p class="text-zinc-500 text-sm mb-6">{t('today')}</p>

	{#if exercises.length > 0}
		<div class="space-y-2 mb-6">
			{#each exercises as exercise}
				{@const colors = getCategoryColor(exercise.category)}
				<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="px-2 py-0.5 rounded text-xs font-medium {colors.bg} {colors.text} {colors.border} border">
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
								<span class={getFeelingColor(exercise.feeling)}>
									· {getFeelingLabel(exercise.feeling)}
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
			<p class="text-zinc-500">{t('no_exercises_yet')}</p>
		</div>
	{/if}

	{#if showForm}
		<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-6">
			{#if showMachinePicker}
				<h2 class="font-medium mb-4 text-zinc-200">{t('select_machine')}</h2>

				<div class="flex gap-1.5 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
					{#each categories as cat}
						{@const colors = getCategoryColor(cat)}
						<button
							onclick={() => (selectedCategory = cat)}
							class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border {selectedCategory === cat
								? `${colors.bg} ${colors.text} ${colors.border}`
								: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}"
						>
							{getCategoryTranslation(cat)}
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
							<p class="text-white text-sm font-medium">{tm(preset.name)}</p>
							{#if lastUsed}
								{#if preset.category !== 'cardio' && preset.category !== 'sports'}
									<p class="text-emerald-400 text-xs mt-0.5">
										{t('last_weight')}: {lastUsed.weight}kg
									</p>
								{/if}
							{:else if preset.defaultWeight}
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
							placeholder={t('machine_name')}
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
									{getCategoryTranslation(cat)}
								</button>
							{/each}
						</div>
						<button
							onclick={() => { showMachinePicker = false; showCustomInput = false; }}
							disabled={!machine}
							class="w-full mt-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
						>
							{t('continue')}
						</button>
					</div>
				{:else}
					<button
						onclick={() => (showCustomInput = true)}
						class="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
					>
						{t('custom_machine')}
					</button>
				{/if}

				<button
					onclick={resetForm}
					class="w-full py-2 text-zinc-600 hover:text-zinc-400 text-sm mt-2 transition-colors"
				>
					{t('cancel')}
				</button>

			{:else}
				{@const colors = getCategoryColor(category)}
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<span class="px-2 py-0.5 rounded text-xs font-medium {colors.bg} {colors.text} {colors.border} border">
							{getCategoryTranslation(category)}
						</span>
						<h2 class="font-medium text-white">{tm(machine)}</h2>
					</div>
					<button
						onclick={() => (showMachinePicker = true)}
						class="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
					>
						{t('change')}
					</button>
				</div>

				{#if lastExercise && category !== 'cardio' && category !== 'sports'}
					<div class="text-xs text-zinc-500 mb-4 -mt-2 flex items-center gap-2">
						<span>{t('last_weight')}: {lastExercise.weight}kg, {lastExercise.sets}×{lastExercise.reps}</span>
						{#if lastExercise.feeling === 'too_easy'}
							<span class="text-amber-400">→ {t('try_more')}</span>
						{:else if lastExercise.feeling === 'too_hard'}
							<span class="text-rose-400">→ {t('try_less')}</span>
						{/if}
					</div>
				{/if}

				{#if category === 'cardio'}
					<!-- Cardio inputs: Minutes, Speed, Incline, Calories -->
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('minutes')}</label>
							<input
								type="number"
								bind:value={cardioMinutes}
								placeholder="30"
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-pink-500"
							/>
						</div>
						<div>
							<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('speed')}</label>
							<input
								type="number"
								step="0.1"
								bind:value={cardioSpeed}
								placeholder="5.5"
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-pink-500"
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('incline')}</label>
							<input
								type="number"
								step="0.5"
								bind:value={cardioIncline}
								placeholder="0"
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-pink-500"
							/>
						</div>
						<div>
							<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('calories')}</label>
							<input
								type="number"
								bind:value={cardioCalories}
								placeholder="200"
								class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-pink-500"
							/>
						</div>
					</div>
				{:else if category === 'sports'}
					<!-- Sports inputs: Just Minutes -->
					<div class="mb-4">
						<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('minutes')}</label>
						<input
							type="number"
							bind:value={cardioMinutes}
							placeholder="60"
							class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-orange-500"
						/>
					</div>
				{:else}
					<!-- Regular weight training inputs -->
					<div class="mb-5">
						<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('weight_kg')}</label>
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
							{#if editingWeight}
								<div class="w-24 text-center">
									<input
										type="number"
										step="0.5"
										bind:value={weight}
										onblur={() => (editingWeight = false)}
										onkeydown={(e) => e.key === 'Enter' && (editingWeight = false)}
										use:focusOnMount
										class="w-full bg-zinc-800 border border-emerald-500 rounded-lg px-2 py-1 text-2xl font-bold text-white text-center focus:outline-none"
									/>
								</div>
							{:else}
								<button
									onclick={() => (editingWeight = true)}
									class="w-24 text-center hover:bg-zinc-800/50 rounded-lg py-1 transition-colors"
								>
									<span class="text-3xl font-bold text-white">{weight}</span>
									<span class="text-zinc-500 text-sm ml-1">kg</span>
								</button>
							{/if}
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
						<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('sets')}</label>
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
						<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('reps')}</label>
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
				{/if}

				<div class="mb-4">
					<label class="block text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('how_did_it_feel')}</label>
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
						{t('add_notes')}
					</summary>
					<input
						type="text"
						bind:value={notes}
						placeholder={t('optional_notes')}
						class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
					/>
				</details>

				<div class="flex gap-3">
					<button
						onclick={resetForm}
						class="flex-1 py-3 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-colors"
					>
						{t('cancel')}
					</button>
					<button
						onclick={addExercise}
						class="flex-1 py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-colors"
					>
						{t('add_exercise')}
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<button
			onclick={openForm}
			class="w-full py-3 px-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors mb-4"
		>
			+ {t('add_exercise')}
		</button>
	{/if}

	{#if showSaveTemplate}
		<div class="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
			<div class="bg-zinc-900 rounded-xl p-4 w-full max-w-sm border border-zinc-800">
				<h2 class="font-medium mb-4 text-white">{t('save_as_template')}</h2>
				<input
					type="text"
					bind:value={templateName}
					placeholder={t('template_name_placeholder')}
					class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 mb-4"
				/>
				<div class="flex gap-3">
					<button
						onclick={() => (showSaveTemplate = false)}
						class="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700"
					>
						{t('cancel')}
					</button>
					<button
						onclick={saveAsTemplate}
						disabled={!templateName.trim()}
						class="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 transition-colors"
					>
						{t('save')}
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
					title={t('save_as_template')}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</button>
				<button
					onclick={finishWorkout}
					class="flex-1 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all"
				>
					{t('finish_workout')} ({exercises.length})
				</button>
			</div>
		</div>
	{/if}
</div>
