<script lang="ts">
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { i18n, tm } from '$lib/i18n';
	import { findEnglishName } from '$lib/i18n/machineTranslations';
	import { generateId, getCategoryColor } from '$lib/utils';
	import type { Exercise, Category, Feeling, WorkoutSession } from '$lib/types';
	import { presetMachines } from '$lib/presetMachines';

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	let rawNotes = $state('');
	let parsedWorkouts = $state<WorkoutSession[]>([]);
	let selectedWorkouts = $state<Set<string>>(new Set());
	let importStatus = $state<string | null>(null);

	// Build a map of Spanish names to English names and categories
	const machineMap = $derived(() => {
		const map: Record<string, { english: string; category: Category }> = {};
		for (const [category, machines] of Object.entries(presetMachines)) {
			for (const machine of machines) {
				// Add English name (lowercase)
				map[machine.name.toLowerCase()] = { english: machine.name, category: machine.category };
				// Add Spanish translation (lowercase)
				const spanishName = findEnglishName(machine.name, 'es');
				if (spanishName !== machine.name) {
					// This won't work - let me fix the lookup
				}
			}
		}
		return map;
	});

	function findMachineInfo(name: string): { english: string; category: Category } | null {
		const lowerName = name.toLowerCase().trim();

		// Check all preset machines
		for (const [category, machines] of Object.entries(presetMachines) as [Category, typeof presetMachines.legs][]) {
			for (const machine of machines) {
				// Check English name
				if (machine.name.toLowerCase() === lowerName) {
					return { english: machine.name, category: machine.category };
				}
				// Check Spanish translation
				const spanish = tm(machine.name);
				if (spanish.toLowerCase() === lowerName) {
					return { english: machine.name, category: machine.category };
				}
			}
		}

		// Common Spanish shortcuts
		const shortcuts: Record<string, { english: string; category: Category }> = {
			'treadmill': { english: 'Treadmill', category: 'cardio' },
			'cinta': { english: 'Treadmill', category: 'cardio' },
			'prensa': { english: 'Leg Press', category: 'legs' },
			'prensa de piernas': { english: 'Leg Press', category: 'legs' },
			'biceps': { english: 'Bicep Curl', category: 'arms' },
			'triceps': { english: 'Tricep Pushdown', category: 'arms' },
			'dorsal': { english: 'Lat Pulldown', category: 'back' },
		};

		if (shortcuts[lowerName]) {
			return shortcuts[lowerName];
		}

		// Check partial matches
		for (const [key, value] of Object.entries(shortcuts)) {
			if (lowerName.includes(key)) {
				return value;
			}
		}

		return null;
	}

	function parseDate(dateStr: string): string {
		// Parse dates like "01/12" (day/month) and assume current year
		const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
		if (match) {
			const day = match[1].padStart(2, '0');
			const month = match[2].padStart(2, '0');
			const year = new Date().getFullYear();
			return `${year}-${month}-${day}`;
		}
		return new Date().toISOString().split('T')[0];
	}

	function parseExerciseLine(line: string, machineInfo: { english: string; category: Category }): Exercise | null {
		const parts = line.split('-').map(p => p.trim());
		if (parts.length < 2) return null;

		const dateStr = parts[0];
		const feeling: Feeling = line.toLowerCase().includes('hard') || line.toLowerCase().includes('difícil')
			? 'too_hard'
			: line.toLowerCase().includes('easy') || line.toLowerCase().includes('fácil')
			? 'too_easy'
			: 'just_right';

		if (machineInfo.category === 'cardio') {
			// Parse cardio: "01/12 - 13 empinado - 5.5 - 10 min - 120 calories"
			let minutes = 30;
			let speed = 5.5;
			let incline = 0;
			let calories = 200;

			for (const part of parts.slice(1)) {
				const lower = part.toLowerCase();
				if (lower.includes('min')) {
					const match = part.match(/(\d+)/);
					if (match) minutes = parseInt(match[1]);
				} else if (lower.includes('cal')) {
					const match = part.match(/(\d+)/);
					if (match) calories = parseInt(match[1]);
				} else if (lower.includes('empinado') || lower.includes('incline')) {
					const match = part.match(/(\d+(?:\.\d+)?)/);
					if (match) incline = parseFloat(match[1]);
				} else {
					// Might be speed
					const match = part.match(/^(\d+(?:\.\d+)?)\s*$/);
					if (match) speed = parseFloat(match[1]);
				}
			}

			return {
				id: generateId(),
				machine: machineInfo.english,
				category: machineInfo.category,
				weight: 0,
				sets: 0,
				reps: 0,
				feeling,
				cardio: { minutes, speed, incline, calories }
			};
		} else {
			// Parse weight training: "02/12 - 3x15 - 45kg, 47kg good"
			let weight = 0;
			let sets = 3;
			let reps = 10;
			let notes = '';

			for (const part of parts.slice(1)) {
				// Check for sets x reps pattern
				const setsRepsMatch = part.match(/(\d+)\s*[xX×]\s*(\d+)/);
				if (setsRepsMatch) {
					sets = parseInt(setsRepsMatch[1]);
					reps = parseInt(setsRepsMatch[2]);
					continue;
				}

				// Check for weight pattern
				const weightMatch = part.match(/(\d+(?:\.\d+)?)\s*kg/i);
				if (weightMatch) {
					weight = parseFloat(weightMatch[1]);
					// Check if there are multiple weights (progression)
					const multiWeightMatch = part.match(/(\d+(?:\.\d+)?)\s*kg,\s*(\d+(?:\.\d+)?)\s*kg/i);
					if (multiWeightMatch) {
						weight = parseFloat(multiWeightMatch[2]); // Use the last (highest) weight
						notes = part;
					}
					continue;
				}

				// Check for standalone number (likely weight without "kg")
				const numMatch = part.match(/^(\d+(?:\.\d+)?)\s*$/);
				if (numMatch && parseFloat(numMatch[1]) > 10) {
					weight = parseFloat(numMatch[1]);
				}
			}

			return {
				id: generateId(),
				machine: machineInfo.english,
				category: machineInfo.category,
				weight,
				sets,
				reps,
				feeling,
				notes: notes || undefined
			};
		}
	}

	function parseNotes() {
		const lines = rawNotes.split('\n').map(l => l.trim()).filter(l => l);
		const workouts: WorkoutSession[] = [];
		let currentMachine: { english: string; category: Category } | null = null;
		let currentDate = '';
		let currentExercises: Exercise[] = [];

		for (const line of lines) {
			// Check if this line is a machine name
			const machineInfo = findMachineInfo(line);

			if (machineInfo) {
				currentMachine = machineInfo;
				continue;
			}

			// Check if this is an exercise entry (has date pattern)
			if (currentMachine && line.match(/\d{1,2}\/\d{1,2}/)) {
				const dateMatch = line.match(/(\d{1,2}\/\d{1,2})/);
				if (dateMatch) {
					const date = parseDate(dateMatch[1]);

					// If date changed, save previous workout
					if (currentDate && currentDate !== date && currentExercises.length > 0) {
						workouts.push({
							id: generateId(),
							date: currentDate,
							exercises: currentExercises
						});
						currentExercises = [];
					}

					currentDate = date;
					const exercise = parseExerciseLine(line, currentMachine);
					if (exercise) {
						currentExercises.push(exercise);
					}
				}
			}
		}

		// Don't forget the last workout
		if (currentExercises.length > 0 && currentDate) {
			workouts.push({
				id: generateId(),
				date: currentDate,
				exercises: currentExercises
			});
		}

		// Group exercises by date
		const groupedByDate = workouts.reduce((acc, workout) => {
			const existing = acc.find(w => w.date === workout.date);
			if (existing) {
				existing.exercises.push(...workout.exercises);
			} else {
				acc.push(workout);
			}
			return acc;
		}, [] as WorkoutSession[]);

		parsedWorkouts = groupedByDate;
		selectedWorkouts = new Set(groupedByDate.map(w => w.id));
	}

	function toggleWorkout(id: string) {
		const newSet = new Set(selectedWorkouts);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedWorkouts = newSet;
	}

	async function importSelected() {
		const toImport = parsedWorkouts.filter(w => selectedWorkouts.has(w.id));

		for (const workout of toImport) {
			await workoutStore.add(workout);
		}

		importStatus = `${t('import_success')}: ${toImport.length} ${t('workouts_found')}`;

		setTimeout(() => {
			goto('/');
		}, 2000);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	function getCategoryTranslation(category: string): string {
		const map: Record<string, Parameters<typeof i18n.t>[0]> = {
			legs: 'legs',
			back: 'back_category',
			chest: 'chest',
			shoulders: 'shoulders',
			arms: 'arms',
			core: 'core',
			cardio: 'cardio'
		};
		return t(map[category] || 'legs');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">{t('import_data')}</h1>
	</header>

	{#if importStatus}
		<div class="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6">
			<p class="text-emerald-400">{importStatus}</p>
		</div>
	{/if}

	<div class="mb-6">
		<p class="text-zinc-400 text-sm mb-4">{t('import_instructions')}</p>

		<textarea
			bind:value={rawNotes}
			placeholder={t('paste_notes')}
			rows="8"
			class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-y font-mono text-sm"
		></textarea>

		<button
			onclick={parseNotes}
			disabled={!rawNotes.trim()}
			class="w-full mt-3 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium disabled:opacity-50 disabled:hover:bg-zinc-800 transition-colors border border-zinc-700"
		>
			{t('parse_notes')}
		</button>
	</div>

	{#if parsedWorkouts.length > 0}
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
				{parsedWorkouts.length} {t('workouts_found')}
			</h2>
			<span class="text-xs text-zinc-500">{selectedWorkouts.size} selected</span>
		</div>

		<div class="space-y-3 mb-6">
			{#each parsedWorkouts as workout}
				{@const isSelected = selectedWorkouts.has(workout.id)}
				<button
					onclick={() => toggleWorkout(workout.id)}
					class="w-full text-left bg-zinc-900 rounded-xl p-4 border transition-all {isSelected
						? 'border-emerald-500/50'
						: 'border-zinc-800 opacity-60'}"
				>
					<div class="flex items-center justify-between mb-2">
						<span class="font-medium">{formatDate(workout.date)}</span>
						<div class="w-5 h-5 rounded border-2 flex items-center justify-center {isSelected
							? 'border-emerald-500 bg-emerald-500'
							: 'border-zinc-600'}">
							{#if isSelected}
								<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</div>
					</div>
					<div class="space-y-1">
						{#each workout.exercises as exercise}
							{@const colors = getCategoryColor(exercise.category)}
							<div class="flex items-center gap-2 text-sm">
								<span class="px-1.5 py-0.5 rounded text-xs {colors.bg} {colors.text}">
									{getCategoryTranslation(exercise.category)}
								</span>
								<span class="text-zinc-300">{tm(exercise.machine)}</span>
								<span class="text-zinc-500">
									{#if exercise.cardio}
										{exercise.cardio.minutes}min · {exercise.cardio.speed}km/h
									{:else}
										{exercise.weight}kg · {exercise.sets}×{exercise.reps}
									{/if}
								</span>
							</div>
						{/each}
					</div>
				</button>
			{/each}
		</div>

		<button
			onclick={importSelected}
			disabled={selectedWorkouts.size === 0}
			class="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
		>
			{t('import_selected')} ({selectedWorkouts.size})
		</button>
	{:else if rawNotes.trim() && parsedWorkouts.length === 0}
		<div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 text-center">
			<p class="text-zinc-500">{t('no_workouts_parsed')}</p>
		</div>
	{/if}
</div>
