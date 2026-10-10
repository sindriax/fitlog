import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			kit: {
				adapterFallback: '200.html'
			},
			manifest: {
				name: 'FitLog',
				short_name: 'FitLog',
				description: 'Train. Track. Progress.',
				theme_color: '#09090b',
				background_color: '#09090b',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}', '**/*-latin-wght-normal*.woff2'],
				navigateFallback: '/'
			}
		})
	]
});
