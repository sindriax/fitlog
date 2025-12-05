<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { formatDate, getCategoryEmoji, formatSessionCategories } from '$lib/utils';
	import type { Feeling } from '$lib/types';

	const feelings: Record<Feeling, { label: string; emoji: string }> = {
		too_easy: { label: 'Too easy', emoji: '😴' },
		just_right: { label: 'Just right', emoji: '💪' },
		too_hard: { label: 'Too hard', emoji: '😵' }
	};

	let showDeleteConfirm = $state(false);

	const workout = $derived(workoutStore.all.find((w) => w.id === $page.params.id));

	function deleteWorkout() {
		if (!workout) return;
		workoutStore.delete(workout.id);
		goto('/');
	}
</script>

<div class="min-h-screen bg-zinc-900 text-white p-6">
	<header class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<a href="/" class="text-zinc-400 hover:text-white text-2xl">←</a>
			<h1 class="text-xl font-semibold">Workout Details</h1>
		</div>
		{#if workout}
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="text-red-400 hover:text-red-300 text-sm"
			>
				Delete
			</button>
		{/if}
	</header>

	{#if workout}
		<div class="mb-6">
			<p class="text-lg">{formatSessionCategories(workout)}</p>
			<p class="text-zinc-400 text-sm mt-1">{formatDate(workout.date)}</p>
		</div>

		<section>
			<h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
				Exercises ({workout.exercises.length})
			</h2>
			<div class="space-y-3">
				{#each workout.exercises as exercise}
					<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
						<div class="flex items-start justify-between">
							<div>
								<p class="font-medium">
									{getCategoryEmoji(exercise.category)} {exercise.machine}
								</p>
								<p class="text-zinc-400 text-sm mt-1">
									{exercise.weight}kg · {exercise.sets} sets × {exercise.reps} reps
								</p>
								<p class="text-zinc-500 text-sm mt-2">
									{feelings[exercise.feeling].emoji} {feelings[exercise.feeling].label}
								</p>
								{#if exercise.notes}
									<p class="text-zinc-500 text-sm mt-2 italic">"{exercise.notes}"</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		{#if showDeleteConfirm}
			<div class="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
				<div class="bg-zinc-800 rounded-xl p-6 max-w-sm w-full border border-zinc-700">
					<h3 class="text-lg font-semibold mb-2">Delete Workout?</h3>
					<p class="text-zinc-400 text-sm mb-6">
						This will permanently delete this workout and all its exercises. This cannot be undone.
					</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showDeleteConfirm = false)}
							class="flex-1 py-2 px-4 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
						>
							Cancel
						</button>
						<button
							onclick={deleteWorkout}
							class="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="bg-zinc-800 rounded-xl p-6 border border-zinc-700 text-center">
			<p class="text-zinc-500">Workout not found</p>
			<a href="/" class="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
				← Back to home
			</a>
		</div>
	{/if}
</div>
