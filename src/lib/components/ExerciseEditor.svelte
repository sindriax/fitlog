<script lang="ts">
	import type { Exercise, Progression } from '$lib/types';
	import { isTimed } from '$lib/progression';
	import { t } from '$lib/i18n';
	import { setupStore } from '$lib/stores/setups.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		exercise: Exercise;
		step: number;
	}

	let { exercise = $bindable(), step }: Props = $props();

	const progressions: Progression[] = ['down', 'stay', 'up'];

	function adjust(field: 'weight' | 'sets' | 'reps', delta: number) {
		const min = field === 'weight' ? 0 : 1;
		exercise[field] = Math.max(min, Math.round((Number(exercise[field]) + delta) * 100) / 100);
	}

	function progressionClass(p: Progression, selected: boolean): string {
		if (!selected) return 'text-zinc-400 hover:text-zinc-200';
		if (p === 'up') return 'bg-amber-400 text-zinc-950';
		if (p === 'down') return 'bg-rose-400 text-zinc-950';
		return 'bg-emerald-400 text-zinc-950';
	}

	// Settings and notes stay tucked away unless they already have something in them.
	let showMore = $state(!!(setupStore.get(exercise.machine) || exercise.notes));
</script>

<div class="space-y-5">
	{#if isTimed(exercise) && exercise.cardio}
		<div class="grid grid-cols-2 gap-3">
			{#each [['minutes', 'minutes'], ['incline', 'incline'], ['speed', 'speed'], ['distance', 'distance_km'], ['calories', 'calories']] as const as [field, label] (field)}
				{#if exercise.category === 'cardio' || field === 'minutes'}
					<label class="block rounded-2xl bg-zinc-800/70 px-4 py-3">
						<span class="block text-zinc-500 text-xs font-semibold uppercase tracking-wide">{t(label)}</span>
						<input
							type="number"
							inputmode="decimal"
							min="0"
							step="any"
							bind:value={exercise.cardio[field]}
							class="w-full bg-transparent text-white font-display text-3xl font-extrabold focus:outline-none"
						/>
					</label>
				{/if}
			{/each}
		</div>
	{:else}
		{#each [['weight', 'weight_kg', step], ['sets', 'sets', 1], ['reps', 'reps', 1]] as const as [field, label, delta] (field)}
			<div class="flex items-center gap-3">
				<span class="w-14 text-zinc-500 text-xs font-semibold uppercase tracking-wide">{field === 'weight' ? 'kg' : t(label)}</span>
				<button
					onclick={() => adjust(field, -delta)}
					class="w-14 h-14 rounded-2xl bg-zinc-800 text-2xl text-zinc-300 active:scale-90 transition-transform"
					aria-label="-{delta}">−</button
				>
				<input
					type="number"
					inputmode="decimal"
					min="0"
					step="any"
					aria-label={t(label)}
					bind:value={exercise[field]}
					class="flex-1 min-w-0 bg-transparent text-center font-display text-5xl font-extrabold focus:outline-none"
				/>
				<button
					onclick={() => adjust(field, delta)}
					class="w-14 h-14 rounded-2xl bg-zinc-800 text-2xl text-zinc-300 active:scale-90 transition-transform"
					aria-label="+{delta}">+</button
				>
			</div>
		{/each}
	{/if}

	<div>
		<p class="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">{t('next_time')}</p>
		<div class="grid grid-cols-3 gap-2 rounded-full bg-zinc-800/70 p-1">
			{#each progressions as p (p)}
				<button
					onclick={() => (exercise.next = p)}
					aria-pressed={exercise.next === p}
					class="py-2.5 rounded-full text-sm font-semibold transition-colors {progressionClass(p, exercise.next === p)}"
				>
					{t(p)}
				</button>
			{/each}
		</div>
	</div>

	{#if showMore}
		<div class="space-y-3" transition:slide={{ duration: 200 }}>
			<label class="block">
				<span class="block text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-1">⚙ {t('machine_setup')}</span>
				<input
					type="text"
					value={setupStore.get(exercise.machine)}
					oninput={(e) => setupStore.set(exercise.machine, e.currentTarget.value)}
					placeholder={t('machine_setup_placeholder')}
					class="w-full bg-zinc-800/70 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
				/>
			</label>
			<input
				type="text"
				bind:value={exercise.notes}
				placeholder={t('optional_notes')}
				aria-label={t('optional_notes')}
				class="w-full bg-zinc-800/70 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
			/>
		</div>
	{:else}
		<button onclick={() => (showMore = true)} class="text-sm text-zinc-400 hover:text-white">
			+ {t('machine_setup')} · {t('notes')}
		</button>
	{/if}
</div>
