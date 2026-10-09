<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	import type { TranslationKey } from '$lib/i18n/translations';

	const tabs: { href: string; label: TranslationKey; icon: string }[] = [
		{ href: '/', label: 'home', icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z' },
		{ href: '/calendar', label: 'history', icon: 'M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z' },
		{ href: '/progress', label: 'progress', icon: 'M4 19h16M7 15l4-4 3 3 5-6' },
		{
			href: '/settings',
			label: 'settings',
			icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'
		}
	];

	const isActive = (href: string) => (href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href));
</script>

<nav
	class="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<div class="grid grid-cols-4 max-w-lg mx-auto">
		{#each tabs as tab (tab.href)}
			{@const active = isActive(tab.href)}
			<a
				href={tab.href}
				aria-current={active ? 'page' : undefined}
				class="flex flex-col items-center gap-1 py-2.5 text-xs transition-colors {active
					? 'text-emerald-400'
					: 'text-zinc-500 hover:text-zinc-300'}"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d={tab.icon} />
				</svg>
				{t(tab.label)}
			</a>
		{/each}
	</div>
</nav>
