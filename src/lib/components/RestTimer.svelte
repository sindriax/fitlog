<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		endsAt: number;
		onadd: (seconds: number) => void;
		onskip: () => void;
	}

	let { endsAt, onadd, onskip }: Props = $props();

	let now = $state(Date.now());

	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(timer);
	});

	const remaining = $derived(Math.max(0, Math.ceil((endsAt - now) / 1000)));
	const finished = $derived(remaining === 0);
	const label = $derived(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`);
</script>

<div
	class="sticky top-0 z-30 -mx-6 px-6 py-3 mb-4 flex items-center justify-between gap-3 backdrop-blur border-b {finished
		? 'bg-emerald-500 text-zinc-950 border-emerald-500'
		: 'bg-zinc-950/90 border-zinc-800'}"
	role="timer"
	aria-live={finished ? 'assertive' : 'off'}
>
	<div>
		<p class="text-xs uppercase tracking-widest {finished ? 'text-zinc-900' : 'text-zinc-500'}">{t('rest')}</p>
		<p class="text-2xl font-bold font-mono">{finished ? t('rest_over') : label}</p>
	</div>
	<div class="flex gap-2">
		{#if !finished}
			<button onclick={() => onadd(15)} class="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 font-mono text-sm">+15s</button>
		{/if}
		<button
			onclick={onskip}
			class="px-3 py-2 rounded-lg text-sm {finished ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-300'}"
		>
			{finished ? t('ok') : t('skip')}
		</button>
	</div>
</div>
