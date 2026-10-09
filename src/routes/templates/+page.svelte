<script lang="ts">
	import { goto } from '$app/navigation';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { t, tm } from '$lib/i18n';

	function createRoutine() {
		const routine = templatesStore.add(`${t('routine')} ${templatesStore.all.length + 1}`, []);
		goto(`/templates/${routine.id}`);
	}
</script>

<div class="text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-bold">{t('workout_templates')}</h1>
	</header>

	{#if templatesStore.all.length === 0}
		<p class="text-zinc-500 text-sm mb-4">{t('save_workout_as_template')}</p>
	{/if}

	<div class="space-y-2 mb-4">
		{#each templatesStore.all as routine, index (routine.id)}
			<div class="flex items-center gap-2 bg-zinc-900 rounded-xl p-3 border border-zinc-800">
				<div class="flex flex-col">
					<button
						onclick={() => templatesStore.move(routine.id, -1)}
						disabled={index === 0}
						class="w-9 h-7 text-zinc-400 disabled:opacity-20"
						aria-label="{t('move_up')}: {routine.name}">▲</button
					>
					<button
						onclick={() => templatesStore.move(routine.id, 1)}
						disabled={index === templatesStore.all.length - 1}
						class="w-9 h-7 text-zinc-400 disabled:opacity-20"
						aria-label="{t('move_down')}: {routine.name}">▼</button
					>
				</div>
				<a href="/templates/{routine.id}" class="flex-1 min-w-0">
					<p class="font-medium text-lg truncate">{routine.name}</p>
					<p class="text-zinc-500 text-sm truncate">
						{routine.exercises.map((e) => tm(e.machine)).join(' · ') || t('no_exercises_yet')}
					</p>
				</a>
				<a
					href="/workout/new?template={routine.id}"
					class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-medium rounded-lg"
				>
					{t('start')}
				</a>
			</div>
		{/each}
	</div>

	<button
		onclick={createRoutine}
		class="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
	>
		+ {t('new_routine')}
	</button>
</div>
