import type { Exercise } from '$lib/types';
import { browser } from '$app/environment';
import { untrack } from 'svelte';
import { migrateExercise } from '$lib/migrate';

const STORAGE_KEY = 'fitlog_draft';

export type DraftExercise = Exercise & { done?: boolean };

export type WorkoutDraft = {
	startedAt: number;
	title?: string;
	routineId?: string;
	restUntil?: number;
	exercises: DraftExercise[];
};

function load(): WorkoutDraft | null {
	if (!browser) return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return null;
	const draft: WorkoutDraft = JSON.parse(stored);
	return { ...draft, exercises: draft.exercises.map(migrateExercise) };
}

function createDraftStore() {
	let draft = $state<WorkoutDraft | null>(load());

	return {
		get current() {
			return draft;
		},
		start(exercises: DraftExercise[] = [], title?: string, routineId?: string): WorkoutDraft {
			const next = { startedAt: Date.now(), title, routineId, exercises };
			if (!browser) return next;
			draft = next;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
			return draft;
		},
		save(exercises: DraftExercise[]) {
			untrack(() => {
				if (!draft || !browser) return;
				draft = { ...draft, exercises };
				localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
			});
		},
		setRest(restUntil: number | undefined) {
			if (!draft || !browser) return;
			draft = { ...draft, restUntil };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
		},
		clear() {
			draft = null;
			if (browser) localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const draftStore = createDraftStore();
