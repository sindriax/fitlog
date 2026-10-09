<script lang="ts">
	import { bodyweightStore } from '$lib/stores/bodyweight.svelte';
	import { todayKey } from '$lib/dates';
	import { formatDate } from '$lib/utils';
	import { t } from '$lib/i18n';
	import WeightChart from './WeightChart.svelte';

	const entries = $derived(bodyweightStore.all);
	const latest = $derived(bodyweightStore.latest);
	const change = $derived(entries.length > 1 ? Math.round((entries.at(-1)!.weight - entries[0].weight) * 10) / 10 : null);
	const loggedToday = $derived(latest?.date === todayKey());

	let value = $state<number | null>(null);
	let confirmRemove = $state<string | null>(null);

	function save() {
		const weight = Number(value ?? latest?.weight);
		if (!weight || weight <= 0) return;
		bodyweightStore.set(todayKey(), Math.round(weight * 10) / 10);
		value = null;
	}

	function remove(date: string) {
		if (confirmRemove !== date) {
			confirmRemove = date;
			return;
		}
		bodyweightStore.remove(date);
		confirmRemove = null;
	}
</script>

<section class="mb-6">
	<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('bodyweight')}</h2>
	<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
		{#if latest}
			<div class="flex items-end justify-between mb-2">
				<p class="text-3xl font-bold font-mono">{latest.weight} <span class="text-base text-zinc-500">kg</span></p>
				{#if change !== null}
					<p class="text-sm text-zinc-400 font-mono">
						{change > 0 ? '+' : ''}{change} kg <span class="font-sans text-zinc-500">{t('since_start')}</span>
					</p>
				{/if}
			</div>
			{#if entries.length > 1}
				<WeightChart points={entries} />
			{/if}
		{/if}

		<form
			class="flex gap-2 {latest ? 'mt-4' : ''}"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<input
				type="number"
				inputmode="decimal"
				step="0.1"
				min="0"
				bind:value
				placeholder={latest ? String(latest.weight) : 'kg'}
				aria-label={t('bodyweight')}
				class="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-white text-lg font-mono focus:outline-none focus:border-emerald-500"
			/>
			<button
				type="submit"
				disabled={!value && !latest}
				class="px-4 rounded-lg bg-emerald-500 text-zinc-950 font-medium disabled:opacity-40"
			>
				{loggedToday ? t('update_today') : t('log_today')}
			</button>
		</form>

		{#if entries.length > 0}
			<ul class="mt-4 divide-y divide-zinc-800 text-sm">
				{#each [...entries].reverse().slice(0, 5) as entry (entry.date)}
					<li class="flex items-center justify-between py-2">
						<span class="text-zinc-400">{formatDate(entry.date)}</span>
						<span class="flex items-center gap-3">
							<span class="font-mono">{entry.weight} kg</span>
							<button
								onclick={() => remove(entry.date)}
								class="text-xs {confirmRemove === entry.date ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400'}"
								aria-label="{t('remove')} {formatDate(entry.date)}"
							>
								{confirmRemove === entry.date ? t('tap_again_to_delete') : '✕'}
							</button>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
