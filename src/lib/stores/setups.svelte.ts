import { browser } from '$app/environment';

// Per-machine adjustments like "seat 4, back pad 2", kept across sessions.
const STORAGE_KEY = 'fitlog_setups';

const key = (machine: string) => machine.trim().toLowerCase();

function load(): Record<string, string> {
	if (!browser) return {};
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : {};
}

function createSetupStore() {
	let setups = $state<Record<string, string>>(load());

	function persist(next: Record<string, string>) {
		setups = next;
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(setups));
	}

	return {
		get all() {
			return setups;
		},
		get(machine: string): string {
			return setups[key(machine)] ?? '';
		},
		set(machine: string, text: string) {
			const { [key(machine)]: _, ...rest } = setups;
			persist(text.trim() ? { ...rest, [key(machine)]: text.trim() } : rest);
		},
		rename(from: string, to: string) {
			const { [key(from)]: moved, ...rest } = setups;
			if (moved === undefined) return;
			persist({ ...rest, [key(to)]: rest[key(to)] ?? moved });
		},
		replaceAll(next: Record<string, string>) {
			persist(next);
		},
		merge(incoming: Record<string, string>) {
			persist({ ...incoming, ...setups });
		}
	};
}

export const setupStore = createSetupStore();
