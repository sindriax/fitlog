<script lang="ts">
	import type { Exercise, Feeling } from '$lib/types';
	import { getCategoryEmoji } from '$lib/utils';

	interface Props {
		exercise: Exercise;
		onremove?: () => void;
		showRemove?: boolean;
	}

	let { exercise, onremove, showRemove = true }: Props = $props();

	function getFeelingEmoji(f: Feeling): string {
		const emojis: Record<Feeling, string> = {
			too_easy: '😴',
			just_right: '💪',
			too_hard: '😵'
		};
		return emojis[f];
	}
</script>

<div class="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
	<div class="flex items-start justify-between">
		<div>
			<p class="font-medium">
				{getCategoryEmoji(exercise.category)} {exercise.machine}
			</p>
			<p class="text-zinc-400 text-sm mt-1">
				{exercise.weight}kg · {exercise.sets}×{exercise.reps} · {getFeelingEmoji(exercise.feeling)}
			</p>
			{#if exercise.notes}
				<p class="text-zinc-500 text-sm mt-1">{exercise.notes}</p>
			{/if}
		</div>
		{#if showRemove && onremove}
			<button
				onclick={onremove}
				class="text-zinc-500 hover:text-red-400 text-sm transition-colors"
			>
				Remove
			</button>
		{/if}
	</div>
</div>
