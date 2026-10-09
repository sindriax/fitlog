<script lang="ts">
	import type { Exercise } from '$lib/types';
	import type { PersonalRecord } from '$lib/stores/workouts.svelte';
	import { isTimed } from '$lib/progression';
	import { i18n, t, tm } from '$lib/i18n';

	interface Props {
		title: string;
		minutes: number;
		exercises: Exercise[];
		previous: Map<string, Exercise>;
		records: PersonalRecord[];
		ondone: () => void;
	}

	let { title, minutes, exercises, previous, records, ondone }: Props = $props();

	const strength = $derived(exercises.filter((e) => !isTimed(e)));
	const volume = $derived(strength.reduce((sum, e) => sum + e.weight * e.sets * e.reps, 0));
	const recordMachines = $derived(new Set(records.map((r) => r.machine)));

	const changes = $derived(
		strength
			.map((e) => ({ exercise: e, before: previous.get(e.machine)?.weight }))
			.filter(({ exercise, before }) => before !== undefined && before !== exercise.weight)
	);

	const nextTime = $derived(exercises.filter((e) => e.next !== 'stay'));
</script>

<div class="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto" style="padding-top: env(safe-area-inset-top)">
	<div class="max-w-lg mx-auto p-6 pb-32">
		<div class="text-center mt-8 mb-8">
			<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
				<svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold">{title}</h1>
			<p class="text-zinc-500">{t('workout_saved')}</p>
		</div>

		<div class="grid grid-cols-3 gap-2 mb-8">
			{#each [[minutes, 'min'], [exercises.length, t('exercises')], [Math.round(volume).toLocaleString(i18n.language === 'es' ? 'es-ES' : 'en-US'), 'kg']] as [value, label]}
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
					<p class="text-2xl font-bold font-mono">{value}</p>
					<p class="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
				</div>
			{/each}
		</div>

		{#if records.length > 0}
			<section class="mb-6">
				<h2 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
					{records.length === 1 ? t('new_record') : `${records.length} ${t('records_this_workout')}`}
				</h2>
				<div class="space-y-2">
					{#each records as record (record.machine)}
						<div class="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
							<span class="truncate">{tm(record.machine)}</span>
							<span class="font-mono font-semibold text-amber-400 shrink-0">
								{#if record.previousWeight !== null}<span class="text-zinc-500">{record.previousWeight} →</span>{/if}
								{record.weight} kg
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if changes.some(({ exercise }) => !recordMachines.has(exercise.machine))}
			<section class="mb-6">
				<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('vs_last_time')}</h2>
				<div class="space-y-2">
					{#each changes.filter(({ exercise }) => !recordMachines.has(exercise.machine)) as { exercise, before } (exercise.id)}
						<div class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4">
							<span class="truncate">{tm(exercise.machine)}</span>
							<span class="font-mono shrink-0 {exercise.weight > (before ?? 0) ? 'text-emerald-400' : 'text-rose-400'}">
								<span class="text-zinc-500">{before} →</span>
								{exercise.weight} kg
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if nextTime.length > 0}
			<section class="mb-6">
				<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('next_time')}</h2>
				<div class="space-y-2">
					{#each nextTime as exercise (exercise.id)}
						<div class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4">
							<span class="truncate">{tm(exercise.machine)}</span>
							<span class="shrink-0 text-sm font-medium {exercise.next === 'up' ? 'text-amber-400' : 'text-rose-400'}">
								{exercise.next === 'up' ? '↑' : '↓'} {t(exercise.next)}
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<div
		class="fixed bottom-0 inset-x-0 p-4 bg-zinc-950 border-t border-zinc-800"
		style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))"
	>
		<button
			onclick={ondone}
			class="block w-full max-w-lg mx-auto py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
		>
			{t('done')}
		</button>
	</div>
</div>
