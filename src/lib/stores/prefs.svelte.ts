import { browser } from '$app/environment';

const STORAGE_KEY = 'fitlog_prefs';

export type Prefs = {
	weeklyGoal: number;
	restSeconds: number;
	restSound: boolean;
	lastBackupAt: string | null;
	installTipDismissed: boolean;
	recapSeenWeek: string | null;
};

const defaults: Prefs = {
	weeklyGoal: 3,
	restSeconds: 90,
	restSound: true,
	lastBackupAt: null,
	installTipDismissed: false,
	recapSeenWeek: null
};

function load(): Prefs {
	if (!browser) return defaults;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
}

function createPrefsStore() {
	let prefs = $state<Prefs>(load());

	return {
		get current() {
			return prefs;
		},
		set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
			prefs = { ...prefs, [key]: value };
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
		}
	};
}

export const prefsStore = createPrefsStore();
