<script lang="ts">
	import type { Exercise, Progression } from '$lib/types';
	import { isTimed } from '$lib/progression';
	import { t } from '$lib/i18n';
	import { setupStore } from '$lib/stores/setups.svelte';

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
		if (!selected) return 'bg-zinc-800 text-zinc-400 border-zinc-700';
		if (p === 'up') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
		if (p === 'down') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
		return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
	}
</script>

<div class="space-y-4">
	{#if isTimed(exercise) && exercise.cardio}
		<div class="grid grid-cols-2 gap-3">
			{#each [['minutes', 'minutes'], ['incline', 'incline'], ['speed', 'speed'], ['distance', 'distance_km'], ['calories', 'calories']] as const as [field, label] (field)}
				{#if exercise.category === 'cardio' || field === 'minutes'}
					<label class="block">
						<span class="block text-zinc-500 text-xs uppercase tracking-wide mb-1">{t(label)}</span>
						<input
							type="number"
							inputmode="decimal"
							min="0"
							step="any"
							bind:value={exercise.cardio[field]}
							class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-emerald-500"
						/>
					</label>
				{/if}
			{/each}
		</div>
	{:else}
		{#each [['weight', 'weight_kg', step], ['sets', 'sets', 1], ['reps', 'reps', 1]] as const as [field, label, delta] (field)}
			<div class="flex items-center gap-3">
				<span class="w-16 text-zinc-500 text-xs uppercase tracking-wide">{t(label)}</span>
				<button
					onclick={() => adjust(field, -delta)}
					class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-xl active:scale-95"
					aria-label="-{delta}">−</button
				>
				<input
					type="number"
					inputmode="decimal"
					min="0"
					step="any"
					aria-label={t(label)}
					bind:value={exercise[field]}
					class="flex-1 min-w-0 bg-transparent text-center text-3xl font-bold font-mono focus:outline-none"
				/>
				<button
					onclick={() => adjust(field, delta)}
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
					onclick={() => (exercise.next = p)}
					aria-pressed={exercise.next === p}
					class="py-3 rounded-lg text-sm font-medium border transition-colors {progressionClass(p, exercise.next === p)}"
				>
					{t(p)}
				</button>
			{/each}
		</div>
	</div>

	<label class="block">
		<span class="block text-zinc-500 text-xs uppercase tracking-wide mb-1">⚙ {t('machine_setup')}</span>
		<input
			type="text"
			value={setupStore.get(exercise.machine)}
			oninput={(e) => setupStore.set(exercise.machine, e.currentTarget.value)}
			placeholder={t('machine_setup_placeholder')}
			class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
		/>
	</label>

	<input
		type="text"
		bind:value={exercise.notes}
		placeholder={t('optional_notes')}
		class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
	/>
</div>
