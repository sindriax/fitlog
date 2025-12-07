<script lang="ts">
	interface Props {
		value: number;
		onchange: (value: number) => void;
		min?: number;
		smallStep?: number;
		largeStep?: number;
	}

	let { value, onchange, min = 0, smallStep = 2.5, largeStep = 5 }: Props = $props();

	function adjust(delta: number) {
		onchange(Math.max(min, value + delta));
	}
</script>

<div class="flex items-center justify-center gap-3">
	<button
		onclick={() => adjust(-largeStep)}
		class="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 text-xl font-bold transition-colors"
	>
		-{largeStep}
	</button>
	<button
		onclick={() => adjust(-smallStep)}
		class="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-lg transition-colors"
	>
		-
	</button>
	<div class="w-24 text-center">
		<span class="text-3xl font-bold">{value}</span>
		<span class="text-zinc-500 text-sm">kg</span>
	</div>
	<button
		onclick={() => adjust(smallStep)}
		class="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-lg transition-colors"
	>
		+
	</button>
	<button
		onclick={() => adjust(largeStep)}
		class="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 text-xl font-bold transition-colors"
	>
		+{largeStep}
	</button>
</div>
