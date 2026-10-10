<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Category, TemplateExercise } from '$lib/types';
	import { getCategoryColor } from '$lib/utils';
	import { t, tm, getCategoryTranslation } from '$lib/i18n';
	import MachinePicker from '$lib/components/MachinePicker.svelte';

	const routine = $derived(templatesStore.getById($page.params.id ?? ''));

	let showPicker = $state(false);
	let confirmRemove = $state<number | null>(null);
	let confirmDelete = $state(false);

	function setExercises(exercises: TemplateExercise[]) {
		if (routine) templatesStore.update(routine.id, { exercises });
		confirmRemove = null;
	}

	function move(index: number, offset: number) {
		if (!routine) return;
		const next = [...routine.exercises];
		const to = index + offset;
		if (to < 0 || to >= next.length) return;
		[next[index], next[to]] = [next[to], next[index]];
		setExercises(next);
	}

	function remove(index: number) {
		if (!routine) return;
		if (confirmRemove !== index) {
			confirmRemove = index;
			return;
		}
		setExercises(routine.exercises.filter((_, i) => i !== index));
	}

	function add(machine: string, category: Category, defaultWeight?: number) {
		if (!routine) return;
		const last = workoutStore.getLastExercise(machine);
		setExercises([
			...routine.exercises,
			{
				machine,
				category,
				defaultWeight: last?.weight ?? defaultWeight ?? 20,
				defaultSets: last?.sets ?? 3,
				defaultReps: last?.reps ?? 10
			}
		]);
		showPicker = false;
	}

	function rename(event: Event) {
		const name = (event.target as HTMLInputElement).value.trim();
		if (routine && name) templatesStore.update(routine.id, { name });
	}

	function deleteRoutine() {
		if (!routine) return;
		if (!confirmDelete) {
			confirmDelete = true;
			return;
		}
		templatesStore.delete(routine.id);
		toastStore.show(t('template_deleted'), 'info');
		goto('/templates');
	}
</script>

<div class="text-white px-6 pt-8 pb-6">
	<header class="flex items-center gap-3 mb-8">
		<a href="/templates" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		{#if routine}
			<input
				value={routine.name}
				onchange={rename}
				aria-label={t('routine_name')}
				class="flex-1 min-w-0 bg-transparent font-display text-4xl font-extrabold uppercase leading-none border-b border-transparent focus:border-zinc-600 focus:outline-none"
			/>
		{/if}
	</header>

	{#if routine}
		<div class="space-y-2 mb-4">
			{#each routine.exercises as exercise, index (exercise.machine + index)}
				{@const colors = getCategoryColor(exercise.category)}
				<div class="flex items-center gap-2 bg-zinc-900 rounded-3xl p-3">
					<div class="flex flex-col">
						<button
							onclick={() => move(index, -1)}
							disabled={index === 0}
							class="w-9 h-7 text-zinc-400 disabled:opacity-20"
							aria-label="{t('move_up')}: {tm(exercise.machine)}">▲</button
						>
						<button
							onclick={() => move(index, 1)}
							disabled={index === routine.exercises.length - 1}
							class="w-9 h-7 text-zinc-400 disabled:opacity-20"
							aria-label="{t('move_down')}: {tm(exercise.machine)}">▼</button
						>
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium truncate">{tm(exercise.machine)}</p>
						<span class="inline-block mt-1 px-2 py-0.5 rounded text-xs {colors.bg} {colors.text}">
							{getCategoryTranslation(exercise.category)}
						</span>
					</div>
					<button
						onclick={() => remove(index)}
						class="px-2 py-2 text-sm {confirmRemove === index ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}"
						aria-label="{t('remove')}: {tm(exercise.machine)}"
					>
						{confirmRemove === index ? t('tap_again_to_delete') : '✕'}
					</button>
				</div>
			{/each}
		</div>

		{#if showPicker}
			<div class="bg-zinc-900 rounded-3xl p-5 mb-4">
				<MachinePicker onselect={add} oncancel={() => (showPicker = false)} />
			</div>
		{:else}
			<button
				onclick={() => (showPicker = true)}
				class="w-full py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors mb-4"
			>
				+ {t('add_exercise')}
			</button>
		{/if}

		<a
			href="/workout/new?template={routine.id}"
			class="block w-full py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-center mb-4"
		>
			{t('start')} {routine.name}
		</a>

		<button
			onclick={deleteRoutine}
			class="w-full py-3 text-sm {confirmDelete ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}"
		>
			{confirmDelete ? t('tap_again_to_delete') : t('delete_template')}
		</button>
	{:else}
		<div class="bg-zinc-900 rounded-3xl p-8 text-center">
			<p class="text-zinc-500">{t('workout_not_found')}</p>
		</div>
	{/if}
</div>
