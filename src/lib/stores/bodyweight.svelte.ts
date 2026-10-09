import { browser } from '$app/environment';

const STORAGE_KEY = 'fitlog_bodyweight';

export type BodyweightEntry = { date: string; weight: number };

function load(): BodyweightEntry[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

function createBodyweightStore() {
	let entries = $state<BodyweightEntry[]>(load());

	function persist(next: BodyweightEntry[]) {
		entries = [...next].sort((a, b) => a.date.localeCompare(b.date));
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	}

	return {
		// Oldest first, one entry per day.
		get all() {
			return entries;
		},
		get latest(): BodyweightEntry | null {
			return entries.at(-1) ?? null;
		},
		set(date: string, weight: number) {
			persist([...entries.filter((e) => e.date !== date), { date, weight }]);
		},
		remove(date: string) {
			persist(entries.filter((e) => e.date !== date));
		},
		merge(incoming: BodyweightEntry[]) {
			const byDate = new Map(entries.map((e) => [e.date, e]));
			for (const entry of incoming) {
				if (!byDate.has(entry.date)) byDate.set(entry.date, entry);
			}
			persist([...byDate.values()]);
		}
	};
}

export const bodyweightStore = createBodyweightStore();
