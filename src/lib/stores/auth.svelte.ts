import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

function createAuthStore() {
	let user = $state<User | null>(null);
	let isLoading = $state(true);

	async function init() {
		if (!browser) return;

		const { data: { session } } = await supabase.auth.getSession();
		user = session?.user ?? null;
		isLoading = false;

		supabase.auth.onAuthStateChange((_event, session) => {
			user = session?.user ?? null;
		});
	}

	if (browser) {
		init();
	}

	return {
		get user() {
			return user;
		},
		get isLoading() {
			return isLoading;
		},
		get isLoggedIn() {
			return !!user;
		},
		async signInWithGoogle() {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: window.location.origin
				}
			});
			if (error) console.error('Login error:', error);
		},
		async signOut() {
			const { error } = await supabase.auth.signOut();
			if (error) console.error('Logout error:', error);
		}
	};
}

export const authStore = createAuthStore();
