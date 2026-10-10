<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		endsAt: number;
		total: number;
		onadd: (seconds: number) => void;
		onskip: () => void;
	}

	let { endsAt, total, onadd, onskip }: Props = $props();

	let now = $state(Date.now());

	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(timer);
	});

	const remainingMs = $derived(Math.max(0, endsAt - now));
	const remaining = $derived(Math.ceil(remainingMs / 1000));
	const finished = $derived(remaining === 0);
	const fraction = $derived(total > 0 ? Math.min(1, remainingMs / total) : 0);
	const label = $derived(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`);
</script>

<div
	class="sticky top-0 z-30 -mx-6 mb-4 overflow-hidden backdrop-blur {finished ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-950/90'}"
	role="timer"
	aria-live={finished ? 'assertive' : 'off'}
>
	<div class="px-6 py-3 flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-semibold uppercase tracking-widest {finished ? 'text-zinc-900' : 'text-zinc-500'}">{t('rest')}</p>
			<p class="font-display text-4xl font-extrabold leading-none tabular-nums">{finished ? t('rest_over') : label}</p>
		</div>
		<div class="flex gap-2">
			{#if !finished}
				<button onclick={() => onadd(15)} class="px-4 py-2.5 rounded-full bg-zinc-800 text-zinc-200 font-semibold text-sm">+15s</button>
			{/if}
			<button
				onclick={onskip}
				class="px-4 py-2.5 rounded-full font-semibold text-sm {finished ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-300'}"
			>
				{finished ? t('ok') : t('skip')}
			</button>
		</div>
	</div>
	{#if !finished}
		<div class="h-1 bg-zinc-800" aria-hidden="true">
			<div class="h-full bg-emerald-400 transition-[width] duration-300 ease-linear" style="width: {fraction * 100}%"></div>
		</div>
	{/if}
</div>
