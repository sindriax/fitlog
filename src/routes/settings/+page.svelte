<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { workoutStore } from '$lib/stores/workouts.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import dumbbellIcon from '$lib/assets/dumbbell.png';

	const t = $derived((key: Parameters<typeof i18n.t>[0]) => i18n.t(key));

	// PWA Install prompt
	let deferredPrompt = $state<any>(null);
	let canInstall = $state(false);
	let isStandalone = $state(false);

	$effect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			canInstall = true;
		};

		window.addEventListener('beforeinstallprompt', handler);
		isStandalone = window.matchMedia('(display-mode: standalone)').matches;

		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function installApp() {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			canInstall = false;
			isStandalone = true;
		}
		deferredPrompt = null;
	}

	function exportData() {
		const data = {
			exportDate: new Date().toISOString(),
			workouts: workoutStore.all,
			templates: templatesStore.all
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `fitlog-backup-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toastStore.show('Data exported!', 'success');
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white p-6 pb-24">
	<header class="flex items-center gap-4 mb-6">
		<a href="/" class="text-zinc-500 hover:text-white transition-colors">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-bold">{t('settings')}</h1>
	</header>

	<!-- Install App Section -->
	<section class="mb-6">
		<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('install_on_device')}</h2>
		<div class="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
			{#if isStandalone}
				<div class="p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
						<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<p class="text-white font-medium">{t('app_installed')}</p>
						<p class="text-zinc-500 text-sm">FitLog</p>
					</div>
				</div>
			{:else if canInstall}
				<button
					onclick={installApp}
					class="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
				>
					<div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
						<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
					</div>
					<div class="flex-1 text-left">
						<p class="text-white font-medium">{t('install_app')}</p>
						<p class="text-zinc-500 text-sm">Add to home screen</p>
					</div>
					<svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			{:else}
				<!-- Manual install instructions -->
				<div class="divide-y divide-zinc-800">
					<div class="p-4">
						<div class="flex items-center gap-3 mb-2">
							<div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
								<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
									<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
								</svg>
							</div>
							<p class="text-white font-medium">{t('install_ios_title')}</p>
						</div>
						<p class="text-zinc-400 text-sm whitespace-pre-line ml-11">{t('install_ios_steps')}</p>
					</div>
					<div class="p-4">
						<div class="flex items-center gap-3 mb-2">
							<div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
								<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
									<path d="M17.523 2.322l-1.178 2.018a7.093 7.093 0 013.064 5.65h1.49a8.573 8.573 0 00-3.376-7.668zM12 4.57a7.044 7.044 0 00-3.655 1.018L7.167 3.57A8.523 8.523 0 0112 2.1c1.754 0 3.396.528 4.833 1.47l-1.178 2.018A7.044 7.044 0 0012 4.57zM6.477 2.322L5.3 4.34a8.573 8.573 0 00-3.377 7.67h1.491a7.093 7.093 0 013.064-5.65L6.477 2.322zM3.101 13.01h1.491a7.093 7.093 0 003.064 5.65l-1.179 2.018a8.573 8.573 0 01-3.376-7.668zm3.82 6.668l1.178-2.018a7.044 7.044 0 003.655 1.018v2.47a8.523 8.523 0 01-4.833-1.47zm10.602 0a8.523 8.523 0 01-4.833 1.47v-2.47a7.044 7.044 0 003.655-1.018l1.178 2.018zm3.376-6.668a8.573 8.573 0 01-3.376 7.668l-1.179-2.018a7.093 7.093 0 003.064-5.65h1.491zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/>
								</svg>
							</div>
							<p class="text-white font-medium">{t('install_android_title')}</p>
						</div>
						<p class="text-zinc-400 text-sm whitespace-pre-line ml-11">{t('install_android_steps')}</p>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Data Section -->
	<section class="mb-6">
		<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('data')}</h2>
		<div class="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
			<button
				onclick={exportData}
				class="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
			>
				<div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
					<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
				</div>
				<div class="flex-1 text-left">
					<p class="text-white font-medium">{t('export_data')}</p>
					<p class="text-zinc-500 text-sm">{t('export_description')}</p>
				</div>
				<svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>

			<a
				href="/import"
				class="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
			>
				<div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
					<svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
					</svg>
				</div>
				<div class="flex-1 text-left">
					<p class="text-white font-medium">{t('import_data')}</p>
					<p class="text-zinc-500 text-sm">{t('import_description')}</p>
				</div>
				<svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</section>

	<!-- Language Section -->
	<section class="mb-6">
		<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('language')}</h2>
		<div class="bg-zinc-900 rounded-xl border border-zinc-800">
			<button
				onclick={() => i18n.toggle()}
				class="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
			>
				<div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
					</svg>
				</div>
				<div class="flex-1 text-left">
					<p class="text-white font-medium">{i18n.language === 'en' ? 'English' : 'Español'}</p>
					<p class="text-zinc-500 text-sm">{i18n.language === 'en' ? 'Tap to switch to Spanish' : 'Toca para cambiar a inglés'}</p>
				</div>
				<svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			</button>
		</div>
	</section>

	<!-- Account Section -->
	<section class="mb-6">
		<h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{t('account')}</h2>
		<div class="bg-zinc-900 rounded-xl border border-zinc-800">
			<button
				onclick={() => authStore.signOut()}
				class="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
			>
				<div class="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</div>
				<div class="flex-1 text-left">
					<p class="text-rose-400 font-medium">{t('sign_out')}</p>
				</div>
			</button>
		</div>
	</section>

	<!-- App Info -->
	<div class="text-center mt-8">
		<img src={dumbbellIcon} alt="FitLog" class="w-12 h-12 mx-auto mb-2 opacity-40" />
		<p class="text-zinc-600 text-sm">FitLog</p>
		<p class="text-zinc-700 text-xs">{t('version')} 1.0.0</p>
	</div>
</div>
