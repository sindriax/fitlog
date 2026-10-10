<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { bodyweightStore, type BodyweightEntry } from '$lib/stores/bodyweight.svelte';
	import { setupStore } from '$lib/stores/setups.svelte';
	import { i18n, t, tm, getCategoryTranslation } from '$lib/i18n';
	import { generateId, getCategoryColor } from '$lib/utils';
	import type { WorkoutSession, WorkoutTemplate } from '$lib/types';
	import { parseDateKey } from '$lib/dates';
	import { migrateSession } from '$lib/migrate';
	import { parseNotes } from '$lib/notesParser';
	import { summarize } from '$lib/progression';

	let parsedWorkouts = $state<WorkoutSession[]>([]);
	let parsedTemplates = $state<WorkoutTemplate[]>([]);
	let selectedWorkouts = $state<Set<string>>(new Set());
	let selectedTemplates = $state<Set<string>>(new Set());
	let importStatus = $state<'success' | 'error' | null>(null);
	let importMessage = $state('');
	let jsonExportDate = $state<string | null>(null);
	let showFormatHelp = $state(false);
	let notesText = $state('');
	let unreadableLines = $state<string[]>([]);
	let parsedRoutineNames = new Map<string, string>();
	let parsedBodyweight = $state<BodyweightEntry[]>([]);
	let parsedSetups: Record<string, string> = {};
	let fileInput = $state<HTMLInputElement>();

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

	function machineSignature(session: WorkoutSession): string {
		return session.exercises.map((e) => e.machine.toLowerCase()).sort().join('|');
	}

	function isDuplicateWithoutId(session: WorkoutSession): boolean {
		const signature = machineSignature(session);
		return workoutStore.all.some((w) => w.date === session.date && machineSignature(w) === signature);
	}

	function showPreview(workouts: WorkoutSession[], templates: WorkoutTemplate[]) {
		parsedWorkouts = workouts
			.filter((w) => (w.id ? !workoutStore.has(w.id) : !isDuplicateWithoutId(w)))
			.map((w) => ({ ...migrateSession(w), id: w.id || generateId() }));
		selectedWorkouts = new Set(parsedWorkouts.map((w) => w.id));

		const existingTemplateNames = new Set(templatesStore.all.map((t) => t.name.toLowerCase()));
		parsedTemplates = templates
			.filter((t) => !existingTemplateNames.has(t.name.toLowerCase()))
			.map((t) => ({ ...t, id: t.id || generateId() }));
		selectedTemplates = new Set(parsedTemplates.map((t) => t.id));
	}

	function parseNotesText() {
		const result = parseNotes(notesText);
		if (result.workouts.length === 0 && result.routines.length === 0) {
			importStatus = 'error';
			importMessage = t('no_workouts_parsed');
			return;
		}
		const createdAt = new Date().toISOString();
		const routines = result.routines.map((r) => ({ ...r, id: generateId(), createdAt }));
		parsedRoutineNames = new Map(routines.map((r) => [r.id, r.name]));
		showPreview(result.workouts, routines);
		unreadableLines = result.unreadable;
		importStatus = null;
		importMessage = '';
	}

	function parseJSON(content: string) {
		try {
			const data = JSON.parse(content);

			if (!data.workouts || !Array.isArray(data.workouts)) {
				importStatus = 'error';
				importMessage = t('invalid_backup_format');
				return;
			}

			showPreview(data.workouts, Array.isArray(data.templates) ? data.templates : []);
			parsedBodyweight = Array.isArray(data.bodyweight) ? data.bodyweight : [];
			parsedSetups = data.setups && typeof data.setups === 'object' ? data.setups : {};

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
		unreadableLines = [];
		parsedBodyweight = [];
		parsedSetups = {};
		if (fileInput) fileInput.value = '';
	}

	function importSelected() {
		const renamed = new Map(
			parsedTemplates
				.filter((t) => parsedRoutineNames.has(t.id))
				.map((t) => [parsedRoutineNames.get(t.id)!, t.name.trim() || parsedRoutineNames.get(t.id)!])
		);
		const workoutsToImport = parsedWorkouts
			.filter((w) => selectedWorkouts.has(w.id))
			.map((w) => (w.title && renamed.has(w.title) ? { ...w, title: renamed.get(w.title) } : w));
		const templatesToImport = parsedTemplates.filter(t => selectedTemplates.has(t.id));

		workoutStore.addMany(workoutsToImport);
		bodyweightStore.merge(parsedBodyweight);
		setupStore.merge(parsedSetups);

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
		if (parsedBodyweight.length > 0) {
			parts.push(`${parsedBodyweight.length} × ${t('bodyweight')}`);
		}

		importStatus = 'success';
		importMessage = parts.join(', ');

		setTimeout(() => {
			goto('/');
		}, 2000);
	}

	function formatDate(dateStr: string): string {
		return parseDateKey(dateStr).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
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
          "next": "stay"
        }
      ]
    }
  ]
}`;
</script>

<div class="text-white px-6 pt-8 pb-6">
	<PageHeader title={t('import_data')} back="/settings" />

	{#if importStatus === 'success'}
		<div class="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-6">
			<p class="text-emerald-400">{t('import_success')}: {importMessage}</p>
		</div>
	{:else if importStatus === 'error'}
		<div class="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-6">
			<p class="text-rose-400">{importMessage}</p>
		</div>
	{/if}

	{#if parsedWorkouts.length === 0 && parsedTemplates.length === 0 && parsedBodyweight.length === 0}
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
				class="w-full py-4 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-colors border border-zinc-700 border-dashed flex items-center justify-center gap-3"
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
				<div class="mt-3 bg-zinc-900 rounded-3xl p-5">
					<p class="text-zinc-400 text-xs mb-3">{t('json_format_description')}</p>
					<pre class="text-xs text-zinc-500 overflow-x-auto">{exampleJSON}</pre>
					<p class="text-zinc-600 text-xs mt-3">
						category: legs, back, chest, shoulders, arms, core, cardio, sports<br>
						next: up, stay, down
					</p>
				</div>
			{/if}

			<div class="mt-8">
				<label for="notes" class="block text-white font-medium mb-1">{t('paste_notes')}</label>
				<p class="text-zinc-500 text-sm mb-3">{t('import_instructions')}</p>
				<textarea
					id="notes"
					bind:value={notesText}
					rows="10"
					placeholder={'remo sentado\n3x12 18kg oct 5th\n3x12 18kg oct 7th - stay\n\nlower\n\nprensa de piernas\n3x12 50kg oct 6th'}
					class="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
				></textarea>
				<button
					onclick={parseNotesText}
					disabled={!notesText.trim()}
					class="w-full mt-3 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium disabled:opacity-40 transition-colors"
				>
					{t('parse_notes')}
				</button>
			</div>
		</div>
	{:else}
		{#if jsonExportDate}
			<div class="bg-zinc-900 rounded-3xl p-5 mb-4">
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

		{#if unreadableLines.length > 0}
			<div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
				<p class="text-amber-400 text-sm font-medium mb-2">{t('unreadable_lines')}</p>
				<ul class="text-zinc-400 text-sm space-y-1">
					{#each unreadableLines as line}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if parsedWorkouts.length > 0}
			<div class="space-y-3 mb-6">
				{#each parsedWorkouts as workout}
					{@const isSelected = selectedWorkouts.has(workout.id)}
					<button
						onclick={() => toggleWorkout(workout.id)}
						class="w-full text-left bg-zinc-900 rounded-3xl p-5 border transition-all {isSelected
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
									<span class="text-zinc-500">{summarize(exercise)}</span>
								</div>
							{/each}
							{#if workout.exercises.length > 3}
								<p class="text-zinc-600 text-xs">+{workout.exercises.length - 3} {t('more')}</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<div class="bg-zinc-900/50 rounded-2xl p-6 text-center mb-6">
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
						<div
							class="flex items-center gap-3 bg-zinc-900 rounded-lg p-3 border transition-all {isSelected
								? 'border-emerald-500/50'
								: 'border-zinc-800 opacity-60'}"
						>
							<input
								bind:value={template.name}
								aria-label={t('machine_name')}
								class="flex-1 min-w-0 bg-transparent text-zinc-200 focus:outline-none focus:text-white border-b border-transparent focus:border-zinc-600"
							/>
							<span class="text-zinc-500 text-sm">{template.exercises.length} {t('exercises')}</span>
							<button
								onclick={() => toggleTemplate(template.id)}
								aria-pressed={isSelected}
								aria-label={template.name}
								class="w-6 h-6 rounded border-2 flex items-center justify-center {isSelected
									? 'border-emerald-500 bg-emerald-500'
									: 'border-zinc-600'}"
							>
								{#if isSelected}
									<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
									</svg>
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if parsedBodyweight.length > 0}
			<p class="text-sm text-zinc-400 mb-4">+ {parsedBodyweight.length} × {t('bodyweight')}</p>
		{/if}

		<button
			onclick={importSelected}
			disabled={selectedWorkouts.size === 0 && selectedTemplates.size === 0 && parsedBodyweight.length === 0}
			class="w-full py-4 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
		>
			{t('import_selected')} ({selectedWorkouts.size + selectedTemplates.size})
		</button>
	{/if}
</div>
