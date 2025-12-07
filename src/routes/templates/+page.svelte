<script lang="ts">
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { getCategoryLabel, getCategoryColor } from '$lib/utils';
	import type { Category } from '$lib/types';

	function getTemplateCategories(exercises: { category: Category }[]): Category[] {
		return [...new Set(exercises.map((e) => e.category))];
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-semibold">Templates</h1>
	</header>

	{#if templatesStore.all.length === 0}
		<div class="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
			<div class="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
				<svg class="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
			</div>
			<p class="text-zinc-400 font-medium">No templates yet</p>
			<p class="text-zinc-600 text-sm mt-1">Save a workout as template to reuse it</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each templatesStore.all as template}
				{@const categories = getTemplateCategories(template.exercises)}
				<div class="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<p class="font-medium text-lg text-white">{template.name}</p>
							<div class="flex flex-wrap gap-1.5 mt-2">
								{#each categories as cat}
									{@const colors = getCategoryColor(cat)}
									<span class="px-2 py-0.5 rounded text-xs font-medium border {colors.bg} {colors.text} {colors.border}">
										{getCategoryLabel(cat)}
									</span>
								{/each}
								<span class="text-zinc-500 text-xs self-center ml-1">
									· {template.exercises.length} exercises
								</span>
							</div>
							<div class="mt-3 flex flex-wrap gap-1.5">
								{#each template.exercises.slice(0, 4) as ex}
									<span class="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
										{ex.machine}
									</span>
								{/each}
								{#if template.exercises.length > 4}
									<span class="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded border border-zinc-700">
										+{template.exercises.length - 4} more
									</span>
								{/if}
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<a
								href="/workout/new?template={template.id}"
								class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors text-center"
							>
								Use
							</a>
							<button
								onclick={() => templatesStore.delete(template.id)}
								class="px-4 py-2 bg-zinc-800 hover:bg-rose-500/30 text-zinc-400 hover:text-rose-400 text-sm rounded-lg border border-zinc-700 hover:border-rose-500/30 transition-all"
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
		class="block mt-6 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-center transition-all"
	>
		<span class="text-zinc-400">+ Start new workout</span>
	</a>
</div>
