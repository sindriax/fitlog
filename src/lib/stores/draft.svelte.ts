import type { Exercise } from '$lib/types';
import { browser } from '$app/environment';
import { untrack } from 'svelte';

const STORAGE_KEY = 'fitlog_draft';

export type WorkoutDraft = {
	startedAt: number;
	exercises: Exercise[];
};

function load(): WorkoutDraft | null {
	if (!browser) return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : null;
}

function createDraftStore() {
	let draft = $state<WorkoutDraft | null>(load());

	return {
		get current() {
			return draft;
		},
		start(exercises: Exercise[] = []): WorkoutDraft {
			const next = { startedAt: Date.now(), exercises };
			if (!browser) return next;
			draft = next;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
			return draft;
		},
		save(exercises: Exercise[]) {
			untrack(() => {
				if (!draft || !browser) return;
				draft = { ...draft, exercises };
				localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
			});
		},
		clear() {
			draft = null;
			if (browser) localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const draftStore = createDraftStore();
