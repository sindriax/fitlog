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

<section class="mb-10">
	<h2 class="text-sm font-semibold text-zinc-400 mb-3">{t('bodyweight')}</h2>
	<div class="bg-zinc-900 rounded-3xl p-5">
		{#if latest}
			<div class="flex items-end justify-between mb-2">
				<p class="font-display text-6xl font-extrabold leading-none">{latest.weight}<span class="text-xl text-zinc-500 ml-1">kg</span></p>
				{#if change !== null}
					<p class="text-sm text-zinc-400">
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
				class="flex-1 min-w-0 bg-zinc-800/70 rounded-2xl px-4 py-3 text-white font-display text-2xl font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
			/>
			<button
				type="submit"
				disabled={!value && !latest}
				class="px-5 rounded-2xl bg-emerald-400 text-zinc-950 font-semibold disabled:opacity-40"
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
							<span class="font-semibold">{entry.weight} kg</span>
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
