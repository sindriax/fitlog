<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { goto } from '$app/navigation';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { t, tm } from '$lib/i18n';

	function createRoutine() {
		const routine = templatesStore.add(`${t('routine')} ${templatesStore.all.length + 1}`, []);
		goto(`/templates/${routine.id}`);
	}
</script>

<div class="text-white px-6 pt-8 pb-6">
	<PageHeader title={t('workout_templates')} back="/" />

	{#if templatesStore.all.length === 0}
		<p class="text-zinc-500 text-sm mb-4">{t('save_workout_as_template')}</p>
	{/if}

	<div class="space-y-2 mb-4">
		{#each templatesStore.all as routine, index (routine.id)}
			<div class="flex items-center gap-2 bg-zinc-900 rounded-3xl p-3">
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
					class="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-sm font-medium rounded-lg"
				>
					{t('start')}
				</a>
			</div>
		{/each}
	</div>

	<button
		onclick={createRoutine}
		class="w-full py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
	>
		+ {t('new_routine')}
	</button>
</div>
