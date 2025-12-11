<script lang="ts">
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { i18n, t, tm, getCategoryTranslation } from '$lib/i18n';
	import { generateId, getCategoryColor } from '$lib/utils';
	import type { WorkoutSession, WorkoutTemplate } from '$lib/types';

	let parsedWorkouts = $state<WorkoutSession[]>([]);
	let parsedTemplates = $state<WorkoutTemplate[]>([]);
	let selectedWorkouts = $state<Set<string>>(new Set());
	let selectedTemplates = $state<Set<string>>(new Set());
	let importStatus = $state<'success' | 'error' | null>(null);
	let importMessage = $state('');
	let jsonExportDate = $state<string | null>(null);
	let showFormatHelp = $state(false);
	let fileInput: HTMLInputElement;

	function toggleWorkout(id: string) {
		const newSet = new Set(selectedWorkouts);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedWorkouts = newSet;
	}

	function toggleTemplate(id: string) {
		const newSet = new Set(selectedTemplates);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedTemplates = newSet;
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			parseJSON(content);
		};
		reader.readAsText(file);
	}

	function parseJSON(content: string) {
		try {
			const data = JSON.parse(content);

			if (!data.workouts || !Array.isArray(data.workouts)) {
				importStatus = 'error';
				importMessage = t('invalid_backup_format');
				return;
			}

			const existingWorkoutDates = new Set(workoutStore.all.map(w => w.date));
			const newWorkouts = data.workouts.filter((w: WorkoutSession) => !existingWorkoutDates.has(w.date));

			parsedWorkouts = newWorkouts.map((w: WorkoutSession) => ({
				...w,
				id: w.id || generateId()
			}));
			selectedWorkouts = new Set(parsedWorkouts.map(w => w.id));

			if (data.templates && Array.isArray(data.templates)) {
				const existingTemplateNames = new Set(templatesStore.all.map(t => t.name.toLowerCase()));
				const newTemplates = data.templates.filter((t: WorkoutTemplate) =>
					!existingTemplateNames.has(t.name.toLowerCase())
				);
				parsedTemplates = newTemplates.map((t: WorkoutTemplate) => ({
					...t,
					id: t.id || generateId()
				}));
				selectedTemplates = new Set(parsedTemplates.map(t => t.id));
			}

			if (data.exportDate) {
				jsonExportDate = data.exportDate;
			}

			importStatus = null;
			importMessage = '';
		} catch (e) {
			importStatus = 'error';
			importMessage = t('invalid_json');
			parsedWorkouts = [];
			parsedTemplates = [];
		}
	}

	function resetImport() {
		parsedWorkouts = [];
		parsedTemplates = [];
		selectedWorkouts = new Set();
		selectedTemplates = new Set();
		importStatus = null;
		importMessage = '';
		jsonExportDate = null;
		if (fileInput) fileInput.value = '';
	}

	async function importSelected() {
		const workoutsToImport = parsedWorkouts.filter(w => selectedWorkouts.has(w.id));
		const templatesToImport = parsedTemplates.filter(t => selectedTemplates.has(t.id));

		for (const workout of workoutsToImport) {
			await workoutStore.add(workout);
		}

		for (const template of templatesToImport) {
			templatesStore.import(template);
		}

		const parts = [];
		if (workoutsToImport.length > 0) {
			parts.push(`${workoutsToImport.length} ${workoutsToImport.length === 1 ? t('workout_logged') : t('workouts_logged')}`);
		}
		if (templatesToImport.length > 0) {
			parts.push(`${templatesToImport.length} ${t('templates')}`);
		}

		importStatus = 'success';
		importMessage = parts.join(', ');

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

	const exampleJSON = `{
  "workouts": [
    {
      "date": "2025-01-15",
      "exercises": [
        {
          "machine": "Bench Press",
          "category": "chest",
          "weight": 60,
          "sets": 3,
          "reps": 10,
          "feeling": "just_right"
        }
      ]
    }
  ]
}`;
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/settings" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">{t('import_data')}</h1>
	</header>

	{#if importStatus === 'success'}
		<div class="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6">
			<p class="text-emerald-400">{t('import_success')}: {importMessage}</p>
		</div>
	{:else if importStatus === 'error'}
		<div class="bg-rose-500/20 border border-rose-500/30 rounded-xl p-4 mb-6">
			<p class="text-rose-400">{importMessage}</p>
		</div>
	{/if}

	{#if parsedWorkouts.length === 0 && parsedTemplates.length === 0}
		<div class="mb-6">
			<p class="text-zinc-400 text-sm mb-4">{t('import_json_description')}</p>

			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				onchange={handleFileSelect}
				class="hidden"
			/>

			<button
				onclick={() => fileInput?.click()}
				class="w-full py-4 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-colors border border-zinc-700 border-dashed flex items-center justify-center gap-3"
			>
				<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
				{t('select_backup_file')}
			</button>

			<button
				onclick={() => showFormatHelp = !showFormatHelp}
				class="w-full mt-4 text-xs text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-1"
			>
				{t('json_format_help')}
				<svg class="w-3 h-3 transition-transform {showFormatHelp ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if showFormatHelp}
				<div class="mt-3 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
					<p class="text-zinc-400 text-xs mb-3">{t('json_format_description')}</p>
					<pre class="text-xs text-zinc-500 overflow-x-auto">{exampleJSON}</pre>
					<p class="text-zinc-600 text-xs mt-3">
						category: legs, back, chest, shoulders, arms, core, cardio, sports<br>
						feeling: too_easy, just_right, too_hard
					</p>
				</div>
			{/if}
		</div>
	{:else}
		{#if jsonExportDate}
			<div class="bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-800">
				<p class="text-zinc-400 text-sm">
					{t('backup_from')} {new Date(jsonExportDate).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long' })}
				</p>
			</div>
		{/if}

		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
				{parsedWorkouts.length} {t('workouts_found')}
			</h2>
			<button onclick={resetImport} class="text-xs text-zinc-500 hover:text-zinc-300">
				{t('cancel')}
			</button>
		</div>

		{#if parsedWorkouts.length > 0}
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
							<div class="flex items-center gap-2">
								<span class="font-medium">{formatDate(workout.date)}</span>
								{#if workout.duration}
									<span class="text-zinc-500 text-sm">{workout.duration}min</span>
								{/if}
							</div>
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
							{#each workout.exercises.slice(0, 3) as exercise}
								{@const colors = getCategoryColor(exercise.category)}
								<div class="flex items-center gap-2 text-sm">
									<span class="px-1.5 py-0.5 rounded text-xs {colors.bg} {colors.text}">
										{getCategoryTranslation(exercise.category)}
									</span>
									<span class="text-zinc-300">{tm(exercise.machine)}</span>
									<span class="text-zinc-500">
										{#if exercise.cardio}
											{exercise.cardio.minutes}min
										{:else}
											{exercise.weight}kg · {exercise.sets}×{exercise.reps}
										{/if}
									</span>
								</div>
							{/each}
							{#if workout.exercises.length > 3}
								<p class="text-zinc-600 text-xs">+{workout.exercises.length - 3} more</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 text-center mb-6">
				<p class="text-zinc-500">{t('all_workouts_exist')}</p>
			</div>
		{/if}

		{#if parsedTemplates.length > 0}
			<div class="mb-4">
				<h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
					{parsedTemplates.length} {t('templates')}
				</h2>
				<div class="space-y-2">
					{#each parsedTemplates as template}
						{@const isSelected = selectedTemplates.has(template.id)}
						<button
							onclick={() => toggleTemplate(template.id)}
							class="w-full text-left bg-zinc-900 rounded-lg p-3 border transition-all {isSelected
								? 'border-emerald-500/50'
								: 'border-zinc-800 opacity-60'}"
						>
							<div class="flex items-center justify-between">
								<span class="text-zinc-300">{template.name}</span>
								<div class="flex items-center gap-2">
									<span class="text-zinc-500 text-sm">{template.exercises.length} ex.</span>
									<div class="w-4 h-4 rounded border-2 flex items-center justify-center {isSelected
										? 'border-emerald-500 bg-emerald-500'
										: 'border-zinc-600'}">
										{#if isSelected}
											<svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<button
			onclick={importSelected}
			disabled={selectedWorkouts.size === 0 && selectedTemplates.size === 0}
			class="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
		>
			{t('import_selected')} ({selectedWorkouts.size + selectedTemplates.size})
		</button>
	{/if}
</div>
