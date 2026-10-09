<script lang="ts">
	import type { WorkoutSession } from '$lib/types';
	import { formatDate, getCategoryColor, getSessionCategoryCounts } from '$lib/utils';
	import { t, getCategoryTranslation } from '$lib/i18n';

	let { session }: { session: WorkoutSession } = $props();

	const categories = $derived(getSessionCategoryCounts(session));
</script>

<a
	href="/workout/{session.id}"
	class="flex items-center justify-between gap-3 bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-emerald-500/40 transition-colors"
>
	<div class="min-w-0">
		<p class="font-medium text-white truncate">
			{session.title ?? categories.map((c) => getCategoryTranslation(c.category)).join(' + ')}
		</p>
		<div class="flex items-center gap-1.5 mt-1">
			{#each categories.slice(0, 4) as { category } (category)}
				{@const colors = getCategoryColor(category)}
				<span class="w-2 h-2 rounded-full {colors.bg} border {colors.border}"></span>
			{/each}
			<span class="text-zinc-500 text-xs ml-1">
				{session.exercises.length} {session.exercises.length !== 1 ? t('exercises') : t('exercise')}
				{#if session.duration}· {session.duration} min{/if}
			</span>
		</div>
	</div>
	<span class="text-zinc-500 text-sm shrink-0">{formatDate(session.date)}</span>
</a>
