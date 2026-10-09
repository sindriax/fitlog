<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { draftStore, type DraftExercise } from '$lib/stores/draft.svelte';
	import type { Category, Exercise, Progression } from '$lib/types';
	import { generateId, getTodayDateString } from '$lib/utils';
	import { isTimed, nextWeight, summarize, weightStep } from '$lib/progression';
	import { t, tm } from '$lib/i18n';
	import MachinePicker from '$lib/components/MachinePicker.svelte';

	type Defaults = Partial<Pick<Exercise, 'weight' | 'sets' | 'reps' | 'cardio'>>;

	const progressions: Progression[] = ['down', 'stay', 'up'];

	function stepFor(machine: string): number {
		return weightStep(workoutStore.getMachineHistory(machine).map((h) => h.weight));
	}

	function rowFor(machine: string, category: Category, defaults: Defaults = {}): DraftExercise {
		const last = workoutStore.getLastExercise(machine);
		const row: DraftExercise = {
			id: generateId(),
			machine,
			category,
			weight: defaults.weight ?? 20,
			sets: defaults.sets ?? 3,
			reps: defaults.reps ?? 10,
			next: 'stay'
		};

		if (isTimed(row)) {
			const cardio = last?.cardio ?? defaults.cardio;
			row.weight = 0;
			row.sets = 0;
			row.reps = 0;
			row.cardio = cardio
				? { ...cardio }
				: { minutes: category === 'sports' ? 60 : 30, speed: 0, incline: 0, calories: 0 };
		} else if (last) {
			row.weight = nextWeight(last, stepFor(machine));
			row.sets = last.sets;
			row.reps = last.reps;
		}
		return row;
	}

	function rowsFromParams(): { rows: DraftExercise[]; title?: string } {
		const templateId = $page.url.searchParams.get('template');
		const repeatId = $page.url.searchParams.get('repeat');

		const template = templateId ? templatesStore.getById(templateId) : undefined;
		if (template) {
			return {
				title: template.name,
				rows: template.exercises.map((e) =>
					rowFor(e.machine, e.category, { weight: e.defaultWeight, sets: e.defaultSets, reps: e.defaultReps })
				)
			};
		}

		const workout = repeatId ? workoutStore.all.find((w) => w.id === repeatId) : undefined;
		if (workout) {
			return { rows: workout.exercises.map((e) => rowFor(e.machine, e.category, e)) };
		}
		return { rows: [] };
	}

	const resumable = draftStore.current;
	const draft = resumable?.exercises.length
		? resumable
		: (() => {
				const { rows, title } = rowsFromParams();
				return draftStore.start(rows, title);
			})();

	let exercises = $state<DraftExercise[]>(draft.exercises);
	let expandedId = $state<string | null>(null);
	let showPicker = $state(draft.exercises.length === 0);
	let showSaveTemplate = $state(false);
	let templateName = $state('');

	const workoutStartTime = draft.startedAt;
	let elapsedSeconds = $state(Math.floor((Date.now() - workoutStartTime) / 1000));

	$effect(() => {
		const timer = setInterval(() => {
			elapsedSeconds = Math.floor((Date.now() - workoutStartTime) / 1000);
		}, 1000);
		return () => clearInterval(timer);
	});

	$effect(() => {
		draftStore.save($state.snapshot(exercises));
	});

	const formattedTime = $derived.by(() => {
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	});

	const doneCount = $derived(exercises.filter((e) => e.done).length);

	function lastFor(machine: string): Exercise | null {
		return workoutStore.getLastExercise(machine);
	}

	function toggleExpanded(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	function toggleDone(row: DraftExercise) {
		row.done = !row.done;
		if (row.done && expandedId === row.id) expandedId = null;
	}

	function adjust(row: DraftExercise, field: 'weight' | 'sets' | 'reps', delta: number) {
		const min = field === 'weight' ? 0 : 1;
		row[field] = Math.max(min, Math.round((Number(row[field]) + delta) * 100) / 100);
	}

	function removeRow(id: string) {
		exercises = exercises.filter((e) => e.id !== id);
		if (expandedId === id) expandedId = null;
	}

	function addMachine(name: string, category: Category, defaultWeight?: number) {
		const row = rowFor(name, category, { weight: defaultWeight });
		exercises = [...exercises, row];
		expandedId = row.id;
		showPicker = false;
	}

	function finishWorkout() {
		const logged: Exercise[] = exercises.filter((e) => e.done).map(({ done, ...exercise }) => exercise);
		if (logged.length === 0) return;

		const prs = workoutStore.checkForPRs(logged);
		const duration = Math.round(elapsedSeconds / 60);
		draftStore.clear();

		workoutStore.add({
			id: generateId(),
			date: getTodayDateString(),
			title: draft.title,
			exercises: logged,
			duration: duration > 0 ? duration : undefined
		});

		if (prs.length > 0) {
			const prNames = prs.map((pr) => tm(pr.machine)).join(', ');
			const message =
				prs.length === 1
					? `${t('new_record')} - ${prNames}!`
					: `${prs.length} ${t('records_this_workout')} - ${prNames}!`;
			toastStore.show(message, 'success');
		} else {
			toastStore.show(t('workout_saved'), 'success');
		}
		goto('/');
	}

	function saveAsTemplate() {
		if (!templateName.trim() || exercises.length === 0) return;
		templatesStore.add(templateName.trim(), exercises);
		showSaveTemplate = false;
		templateName = '';
		toastStore.show(t('template_saved'), 'success');
	}

	function progressionClass(p: Progression, selected: boolean): string {
		if (!selected) return 'bg-zinc-800 text-zinc-400 border-zinc-700';
		if (p === 'up') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
		if (p === 'down') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
		return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
	}
</script>

<div class="text-white p-6 pb-32">
	<header class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<a href="/" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<h1 class="text-xl font-bold">{draft.title ?? t('new_workout')}</h1>
		</div>
		<span class="font-mono text-sm text-zinc-400">{formattedTime}</span>
	</header>

	<div class="space-y-2 mb-4">
		{#each exercises as row (row.id)}
			{@const last = lastFor(row.machine)}
			{@const expanded = expandedId === row.id}
			<div
				class="rounded-xl border transition-colors {row.done
					? 'bg-emerald-500/5 border-emerald-500/30'
					: 'bg-zinc-900 border-zinc-800'}"
			>
				<div class="flex items-center gap-3 p-4">
					<button class="flex-1 min-w-0 text-left" onclick={() => toggleExpanded(row.id)}>
						<p class="font-medium truncate {row.done ? 'text-zinc-300' : 'text-white'}">{tm(row.machine)}</p>
						<p class="text-lg font-semibold font-mono {row.done ? 'text-emerald-400' : 'text-white'}">
							{summarize(row)}
						</p>
						<p class="text-xs text-zinc-500 truncate">
							{#if last}
								{t('last')}: {summarize(last)} · {t(last.next)}
							{:else}
								{t('first_time')}
							{/if}
						</p>
					</button>
					<button
						onclick={() => toggleDone(row)}
						class="w-14 h-14 shrink-0 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 {row.done
							? 'bg-emerald-500 border-emerald-500 text-zinc-950'
							: 'border-zinc-700 text-zinc-600 hover:border-emerald-500 hover:text-emerald-400'}"
						aria-label={t('done')}
						aria-pressed={!!row.done}
					>
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
						</svg>
					</button>
				</div>

				{#if expanded}
					<div class="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
						{#if isTimed(row) && row.cardio}
							<div class="grid grid-cols-2 gap-3">
								{#each [['minutes', 'minutes'], ['incline', 'incline'], ['speed', 'speed'], ['distance', 'distance_km'], ['calories', 'calories']] as const as [field, label] (field)}
									{#if row.category === 'cardio' || field === 'minutes'}
										<label class="block">
											<span class="block text-zinc-500 text-xs uppercase tracking-wide mb-1">{t(label)}</span>
											<input
												type="number"
												inputmode="decimal"
												min="0"
												step="any"
												bind:value={row.cardio[field]}
												class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-emerald-500"
											/>
										</label>
									{/if}
								{/each}
							</div>
						{:else}
							{@const step = stepFor(row.machine)}
							{#each [['weight', 'weight_kg', step], ['sets', 'sets', 1], ['reps', 'reps', 1]] as const as [field, label, delta] (field)}
								<div class="flex items-center gap-3">
									<span class="w-16 text-zinc-500 text-xs uppercase tracking-wide">{t(label)}</span>
									<button
										onclick={() => adjust(row, field, -delta)}
										class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-xl active:scale-95"
										aria-label="-{delta}">−</button
									>
									<input
										type="number"
										inputmode="decimal"
										min="0"
										step="any"
										bind:value={row[field]}
										class="flex-1 min-w-0 bg-transparent text-center text-3xl font-bold font-mono focus:outline-none"
									/>
									<button
										onclick={() => adjust(row, field, delta)}
										class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-xl active:scale-95"
										aria-label="+{delta}">+</button
									>
								</div>
							{/each}
						{/if}

						<div>
							<p class="text-zinc-500 text-xs uppercase tracking-wide mb-2">{t('next_time')}</p>
							<div class="grid grid-cols-3 gap-2">
								{#each progressions as p (p)}
									<button
										onclick={() => (row.next = p)}
										class="py-3 rounded-lg text-sm font-medium border transition-colors {progressionClass(p, row.next === p)}"
									>
										{t(p)}
									</button>
								{/each}
							</div>
						</div>

						<input
							type="text"
							bind:value={row.notes}
							placeholder={t('optional_notes')}
							class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
						/>

						<div class="flex items-center justify-between">
							<button onclick={() => removeRow(row.id)} class="text-sm text-zinc-500 hover:text-rose-400">
								{t('remove')}
							</button>
							<button
								onclick={() => toggleDone(row)}
								class="px-5 py-2.5 rounded-lg font-medium {row.done
									? 'bg-zinc-800 text-zinc-300'
									: 'bg-emerald-500 text-zinc-950'}"
							>
								{row.done ? t('undo') : t('done')}
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if showPicker}
		<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-4">
			<MachinePicker onselect={addMachine} oncancel={() => (showPicker = false)} showCancel={exercises.length > 0} />
		</div>
	{:else}
		<button
			onclick={() => (showPicker = true)}
			class="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
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
		<div
			class="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800"
			style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))"
		>
			<div class="flex gap-3 max-w-lg mx-auto">
				{#if !draft.title}
					<button
						onclick={() => (showSaveTemplate = true)}
						class="py-4 px-4 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
						title={t('save_as_template')}
						aria-label={t('save_as_template')}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</button>
				{/if}
				<button
					onclick={finishWorkout}
					disabled={doneCount === 0}
					class="flex-1 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold transition-all disabled:opacity-40"
				>
					{t('finish_workout')} ({doneCount}/{exercises.length})
				</button>
			</div>
		</div>
	{/if}
</div>
