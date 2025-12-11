<script lang="ts">
	import type { Category } from '$lib/types';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { presetMachines } from '$lib/presetMachines';
	import { getCategoryColor } from '$lib/utils';
	import { i18n, t, tm, getCategoryTranslation } from '$lib/i18n';
	import { matchesSearch } from '$lib/i18n/machineTranslations';

	interface Props {
		onselect: (machine: string, category: Category, defaultWeight?: number) => void;
		oncancel: () => void;
		oncustom?: (machine: string, category: Category) => void;
		initialCategory?: Category;
		showCancel?: boolean;
	}

	let { onselect, oncancel, oncustom, initialCategory = 'legs', showCancel = true }: Props = $props();

	const categories: Category[] = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core', 'cardio', 'sports'];

	let searchQuery = $state('');
	let selectedCategory = $state<Category>(initialCategory);
	let activeTab = $state<'recent' | 'all'>('recent');
	let showCustomInput = $state(false);
	let customMachine = $state('');
	let customCategory = $state<Category>('legs');

	const allMachines = Object.values(presetMachines).flat();

	const searchResults = $derived(
		searchQuery.trim().length >= 2
			? allMachines.filter(m => matchesSearch(m.name, searchQuery, i18n.language))
			: []
	);

	function handleSelect(name: string, category: Category, defaultWeight?: number) {
		searchQuery = '';
		onselect(name, category, defaultWeight);
	}

	function handleCustomSubmit() {
		if (!customMachine.trim()) return;
		if (oncustom) {
			oncustom(customMachine.trim(), customCategory);
		} else {
			onselect(customMachine.trim(), customCategory);
		}
		showCustomInput = false;
		customMachine = '';
	}
</script>

<div class="machine-picker">
	<h2 class="font-medium mb-4 text-zinc-200">{t('select_machine')}</h2>

	<div class="relative mb-4">
		<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder={t('search_machine')}
			class="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
		/>
		{#if searchQuery}
			<button
				onclick={() => searchQuery = ''}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
				aria-label={t('cancel')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if searchResults.length > 0}
		<div class="grid grid-cols-2 gap-2 mb-4">
			{#each searchResults as preset (preset.name)}
				{@const lastUsed = workoutStore.getLastExercise(preset.name)}
				{@const colors = getCategoryColor(preset.category)}
				<button
					onclick={() => handleSelect(preset.name, preset.category, preset.defaultWeight)}
					class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-left transition-all"
				>
					<p class="text-white text-sm font-medium">{tm(preset.name)}</p>
					<p class="text-xs mt-0.5 {colors.text}">{getCategoryTranslation(preset.category)}</p>
					{#if lastUsed && preset.category !== 'cardio' && preset.category !== 'sports'}
						<p class="text-emerald-400 text-xs mt-0.5">
							{t('last_weight')}: {lastUsed.weight}kg
						</p>
					{/if}
				</button>
			{/each}
		</div>
	{:else if searchQuery.trim().length >= 2}
		<p class="text-zinc-500 text-sm text-center mb-4">{t('no_results')}</p>
	{/if}

	<div class="flex gap-2 mb-4">
		<button
			onclick={() => activeTab = 'recent'}
			class="flex-1 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'recent'
				? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
				: 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
		>
			{t('recent_exercises')}
		</button>
		<button
			onclick={() => activeTab = 'all'}
			class="flex-1 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'all'
				? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
				: 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
		>
			{t('all_exercises')}
		</button>
	</div>

	{#if activeTab === 'recent'}
		{#if workoutStore.recentMachines.length > 0}
			<div class="grid grid-cols-2 gap-2 mb-4">
				{#each workoutStore.recentMachines as recent (recent.machine)}
					{@const colors = getCategoryColor(recent.category)}
					<button
						onclick={() => handleSelect(recent.machine, recent.category, recent.lastWeight)}
						class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-left transition-all"
					>
						<p class="text-white text-sm font-medium">{tm(recent.machine)}</p>
						<p class="text-xs mt-0.5 {colors.text}">{getCategoryTranslation(recent.category)}</p>
						{#if recent.category !== 'cardio' && recent.category !== 'sports'}
							<p class="text-emerald-400 text-xs mt-0.5">
								{t('last_weight')}: {recent.lastWeight}kg
							</p>
						{/if}
					</button>
				{/each}
			</div>

			{#if workoutStore.frequentMachines.length > 0}
				<p class="text-xs text-zinc-500 uppercase tracking-wide mb-2">{t('frequent_exercises')}</p>
				<div class="grid grid-cols-2 gap-2 mb-4">
					{#each workoutStore.frequentMachines.slice(0, 6) as frequent (frequent.machine)}
						{@const colors = getCategoryColor(frequent.category)}
						<button
							onclick={() => handleSelect(frequent.machine, frequent.category, frequent.lastWeight)}
							class="py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-800 hover:border-zinc-600 text-left transition-all"
						>
							<p class="text-zinc-300 text-sm">{tm(frequent.machine)}</p>
							<p class="text-zinc-500 text-xs">{frequent.count}× {t('times_used')}</p>
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="text-center py-6 text-zinc-500">
				<p class="text-sm mb-2">{t('no_recent_exercises')}</p>
				<button
					onclick={() => activeTab = 'all'}
					class="text-emerald-400 text-sm hover:underline"
				>
					{t('browse_all_exercises')}
				</button>
			</div>
		{/if}
	{:else}
		<div class="flex gap-1.5 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
			{#each categories as cat (cat)}
				{@const colors = getCategoryColor(cat)}
				<button
					onclick={() => selectedCategory = cat}
					class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border {selectedCategory === cat
						? `${colors.bg} ${colors.text} ${colors.border}`
						: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}"
				>
					{getCategoryTranslation(cat)}
				</button>
			{/each}
		</div>

		<div class="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
			{#each presetMachines[selectedCategory] as preset (preset.name)}
				{@const lastUsed = workoutStore.getLastExercise(preset.name)}
				<button
					onclick={() => handleSelect(preset.name, preset.category, preset.defaultWeight)}
					class="py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-left transition-all"
				>
					<p class="text-white text-sm font-medium">{tm(preset.name)}</p>
					{#if lastUsed}
						{#if preset.category !== 'cardio' && preset.category !== 'sports'}
							<p class="text-emerald-400 text-xs mt-0.5">
								{t('last_weight')}: {lastUsed.weight}kg
							</p>
						{/if}
					{:else if preset.defaultWeight}
						<p class="text-zinc-500 text-xs mt-0.5">{preset.defaultWeight}kg</p>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	{#if showCustomInput}
		<div class="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
			<input
				type="text"
				bind:value={customMachine}
				placeholder={t('machine_name')}
				class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
			/>
			<div class="flex flex-wrap gap-1.5 mt-3">
				{#each categories as cat (cat)}
					{@const colors = getCategoryColor(cat)}
					<button
						type="button"
						onclick={() => customCategory = cat}
						class="px-2.5 py-1 rounded text-xs transition-all border {customCategory === cat
							? `${colors.bg} ${colors.text} ${colors.border}`
							: 'bg-zinc-900 text-zinc-400 border-zinc-700'}"
					>
						{getCategoryTranslation(cat)}
					</button>
				{/each}
			</div>
			<button
				onclick={handleCustomSubmit}
				disabled={!customMachine.trim()}
				class="w-full mt-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
			>
				{t('continue')}
			</button>
		</div>
	{:else}
		<button
			onclick={() => showCustomInput = true}
			class="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
		>
			{t('custom_machine')}
		</button>
	{/if}

	{#if showCancel}
		<button
			onclick={oncancel}
			class="w-full py-2 text-zinc-600 hover:text-zinc-400 text-sm mt-2 transition-colors"
		>
			{t('cancel')}
		</button>
	{/if}
</div>
