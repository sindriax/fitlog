<script lang="ts">
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { getCategoryEmoji } from '$lib/utils';
	import type { Category } from '$lib/types';

	function getTemplateCategories(exercises: { category: Category }[]): string {
		const cats = [...new Set(exercises.map((e) => e.category))];
		return cats.map((c) => getCategoryEmoji(c)).join(' ');
	}
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
		<h1 class="text-xl font-semibold">Workout Templates</h1>
	</header>

	{#if templatesStore.all.length === 0}
		<div class="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700/50 text-center">
			<p class="text-4xl mb-3">📋</p>
			<p class="text-zinc-400 font-medium">No templates yet</p>
			<p class="text-zinc-600 text-sm mt-1">Save a workout as template to reuse it</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each templatesStore.all as template}
				<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<p class="font-medium text-lg">{template.name}</p>
							<p class="text-zinc-400 text-sm mt-1">
								{getTemplateCategories(template.exercises)} · {template.exercises.length} exercises
							</p>
							<div class="mt-2 flex flex-wrap gap-1">
								{#each template.exercises.slice(0, 3) as ex}
									<span class="text-xs bg-zinc-700 px-2 py-1 rounded">{ex.machine}</span>
								{/each}
								{#if template.exercises.length > 3}
									<span class="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-400">
										+{template.exercises.length - 3} more
									</span>
								{/if}
							</div>
						</div>
						<div class="flex gap-2">
							<a
								href="/workout/new?template={template.id}"
								class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
							>
								Use
							</a>
							<button
								onclick={() => templatesStore.delete(template.id)}
								class="px-3 py-1.5 bg-zinc-700 hover:bg-red-500/50 text-zinc-300 text-sm rounded-lg transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<a
		href="/workout/new"
		class="block mt-6 py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-emerald-500/30 text-center transition-colors"
	>
		<span class="text-zinc-300">+ Start new workout</span>
	</a>
</div>
