<script lang="ts">
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { setupStore } from '$lib/stores/setups.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { formatDate } from '$lib/utils';
	import { t, tm } from '$lib/i18n';

	const exercises = $derived.by(() => {
		const byName = new Map<string, { machine: string; sessions: number; lastDate: string }>();
		for (const workout of workoutStore.all) {
			for (const e of workout.exercises) {
				const key = e.machine.toLowerCase();
				const entry = byName.get(key) ?? { machine: e.machine, sessions: 0, lastDate: workout.date };
				entry.sessions++;
				byName.set(key, entry);
			}
		}
		return [...byName.values()].sort((a, b) => tm(a.machine).localeCompare(tm(b.machine)));
	});

	let editing = $state<string | null>(null);
	let newName = $state('');

	const target = $derived(
		exercises.find((e) => e.machine.toLowerCase() === newName.trim().toLowerCase() && e.machine !== editing)
	);

	function startEdit(machine: string) {
		editing = machine;
		newName = tm(machine);
	}

	function save() {
		const to = target?.machine ?? newName.trim();
		if (!editing || !to || to === editing) {
			editing = null;
			return;
		}
		workoutStore.renameMachine(editing, to);
		templatesStore.renameMachine(editing, to);
		setupStore.rename(editing, to);
		toastStore.show(target ? t('exercises_merged') : t('changes_saved'), 'success');
		editing = null;
	}
</script>

<div class="text-white p-6">
	<header class="flex items-center gap-4 mb-2">
		<a href="/settings" class="text-zinc-500 hover:text-white transition-colors" aria-label={t('back')}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-bold">{t('exercises_title')}</h1>
	</header>
	<p class="text-zinc-500 text-sm mb-6">{t('exercises_help')}</p>

	<div class="space-y-2">
		{#each exercises as exercise (exercise.machine)}
			<div class="bg-zinc-900 rounded-xl border border-zinc-800">
				{#if editing === exercise.machine}
					<form
						class="p-4 space-y-3"
						onsubmit={(e) => {
							e.preventDefault();
							save();
						}}
					>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							bind:value={newName}
							autofocus
							aria-label={t('machine_name')}
							class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
						/>
						{#if target}
							<p class="text-amber-400 text-sm">{t('merge_warning').replace('{name}', tm(target.machine))}</p>
						{/if}
						<div class="flex gap-3">
							<button type="button" onclick={() => (editing = null)} class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300">
								{t('cancel')}
							</button>
							<button type="submit" class="flex-1 py-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-medium">
								{target ? t('merge') : t('save')}
							</button>
						</div>
					</form>
				{:else}
					<button onclick={() => startEdit(exercise.machine)} class="w-full text-left p-4 flex items-center justify-between gap-3">
						<span class="min-w-0">
							<span class="block font-medium truncate">{tm(exercise.machine)}</span>
							<span class="block text-xs text-zinc-500">
								{exercise.sessions} {t('sessions')} · {formatDate(exercise.lastDate)}
							</span>
						</span>
						<span class="text-zinc-600 text-sm shrink-0">{t('rename')}</span>
					</button>
				{/if}
			</div>
		{:else}
			<p class="text-zinc-500 text-sm">{t('no_workout_data')}</p>
		{/each}
	</div>
</div>
