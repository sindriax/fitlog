<script lang="ts">
	import { afterNavigate, replaceState } from '$app/navigation';
	import { syncStore } from '$lib/stores/sync.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { i18n, t } from '$lib/i18n';

	let email = $state('');
	let sentTo = $state<string | null>(null);
	let sending = $state(false);
	let now = $state(Date.now());

	// The router must be ready before the URL can be rewritten, so wait for the navigation to finish.
	afterNavigate(({ to }) => {
		const result = to?.url.searchParams.get('login');
		if (!result) return;
		toastStore.show(result === 'ok' ? t('login_ok') : t('login_expired'), result === 'ok' ? 'success' : 'error');
		replaceState('/settings', {});
		if (result === 'ok') syncStore.init();
	});

	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});

	const lastSynced = $derived.by(() => {
		const at = syncStore.lastSyncedAt;
		if (!at) return null;
		const minutes = Math.max(0, Math.floor((Math.max(now, Date.now()) - at) / 60_000));
		const rtf = new Intl.RelativeTimeFormat(i18n.language === 'es' ? 'es' : 'en', { numeric: 'auto' });
		return minutes < 60 ? rtf.format(-minutes, 'minute') : rtf.format(-Math.floor(minutes / 60), 'hour');
	});

	const statusText = $derived(
		syncStore.status === 'syncing'
			? t('syncing')
			: syncStore.status === 'offline'
				? t('sync_offline')
				: syncStore.status === 'error'
					? t('sync_error')
					: lastSynced
						? `${t('synced')} ${lastSynced}`
						: t('syncing')
	);

	async function send(event: SubmitEvent) {
		event.preventDefault();
		const address = email.trim();
		if (!address) return;
		sending = true;
		try {
			const result = await syncStore.requestLink(address);
			if (result === 'sent') sentTo = address;
			else toastStore.show(result === 'not_allowed' ? t('email_not_allowed') : t('sync_error'), 'error');
		} catch {
			toastStore.show(t('sync_offline'), 'error');
		}
		sending = false;
	}
</script>

<section class="mb-6">
	<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('account')}</h2>
	<div class="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
		{#if syncStore.email}
			<div class="flex items-center gap-3">
				<span
					class="w-2.5 h-2.5 rounded-full shrink-0 {syncStore.status === 'error'
						? 'bg-rose-400'
						: syncStore.status === 'offline'
							? 'bg-amber-400'
							: 'bg-emerald-400'}"
					aria-hidden="true"
				></span>
				<div class="flex-1 min-w-0">
					<p class="text-white font-medium truncate">{syncStore.email}</p>
					<p class="text-zinc-500 text-sm" aria-live="polite">{statusText}</p>
				</div>
			</div>
			<div class="flex gap-3 mt-4">
				<button
					onclick={() => syncStore.sync()}
					disabled={syncStore.status === 'syncing'}
					class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-50"
				>
					{t('sync_now')}
				</button>
				<button onclick={() => syncStore.logout()} class="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-400">
					{t('logout')}
				</button>
			</div>
		{:else if sentTo}
			<p class="text-white font-medium">{t('link_sent_title')}</p>
			<p class="text-zinc-400 text-sm mt-1">{t('link_sent').replace('{email}', sentTo)}</p>
			<button onclick={() => (sentTo = null)} class="text-sm text-emerald-400 mt-3">{t('use_other_email')}</button>
		{:else}
			<p class="text-white font-medium">{t('cloud_title')}</p>
			<p class="text-zinc-500 text-sm mt-1 mb-4">{t('cloud_help')}</p>
			<form class="flex gap-2" onsubmit={send}>
				<input
					type="email"
					bind:value={email}
					autocomplete="email"
					required
					placeholder={t('email_placeholder')}
					aria-label={t('email_placeholder')}
					class="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
				/>
				<button
					type="submit"
					disabled={sending}
					class="px-4 rounded-lg bg-emerald-500 text-zinc-950 font-medium disabled:opacity-50"
				>
					{t('send_link')}
				</button>
			</form>
		{/if}
	</div>
</section>
