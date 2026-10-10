<script lang="ts">
	import type { WorkoutSession } from '$lib/types';
	import { formatDate, getSessionCategoryCounts } from '$lib/utils';
	import { daysBetween, todayKey } from '$lib/dates';
	import { t, getCategoryTranslation } from '$lib/i18n';

	let { session }: { session: WorkoutSession } = $props();

	const title = $derived(
		session.title ??
			getSessionCategoryCounts(session)
				.map((c) => getCategoryTranslation(c.category))
				.join(' + ')
	);

	const when = $derived.by(() => {
		const n = daysBetween(session.date, todayKey());
		return n > 1 && n < 7 ? t('n_days_ago').replace('{n}', String(n)) : formatDate(session.date);
	});
</script>

<a href="/workout/{session.id}" class="flex items-center justify-between gap-3 py-4 group">
	<div class="min-w-0">
		<p class="font-semibold truncate group-hover:text-emerald-300 transition-colors">{title}</p>
		<p class="text-sm text-zinc-500">
			{session.exercises.length} {session.exercises.length !== 1 ? t('exercises') : t('exercise')}
			{#if session.duration}· {session.duration} min{/if}
		</p>
	</div>
	<span class="text-sm text-zinc-500 shrink-0 first-letter:uppercase">{when}</span>
</a>
