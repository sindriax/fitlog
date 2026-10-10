import { browser } from '$app/environment';
import { workoutStore } from './workouts.svelte';
import { templatesStore } from './templates.svelte';
import { bodyweightStore, type BodyweightEntry } from './bodyweight.svelte';
import { setupStore } from './setups.svelte';
import { prefsStore, type Prefs } from './prefs.svelte';
import { migrateSession } from '$lib/migrate';
import { applyRemote, fingerprint, keyOf, localChanges, type Change, type Item, type Known } from '$lib/sync/diff';
import type { WorkoutSession, WorkoutTemplate } from '$lib/types';

const STATE_KEY = 'fitlog_sync';

// Device-only preferences (tips, recap) stay out of the cloud.
const SYNCED_PREFS = ['weeklyGoal', 'restSeconds', 'restSound'] as const;

type SyncState = { email: string | null; since: number; known: Known; lastSyncedAt: number | null };
type Status = 'signed_out' | 'idle' | 'syncing' | 'offline' | 'error';

function loadState(): SyncState {
	const empty: SyncState = { email: null, since: 0, known: {}, lastSyncedAt: null };
	if (!browser) return empty;
	const stored = localStorage.getItem(STATE_KEY);
	return stored ? { ...empty, ...JSON.parse(stored) } : empty;
}

function collect(): Item[] {
	const prefs = prefsStore.current;
	return [
		...workoutStore.all.map((w) => ({ kind: 'workout' as const, id: w.id, data: w })),
		...templatesStore.all.map((t) => ({ kind: 'template' as const, id: t.id, data: t })),
		...bodyweightStore.all.map((b) => ({ kind: 'bodyweight' as const, id: b.date, data: b })),
		...Object.entries(setupStore.all).map(([machine, text]) => ({ kind: 'setup' as const, id: machine, data: text })),
		{ kind: 'prefs' as const, id: 'prefs', data: Object.fromEntries(SYNCED_PREFS.map((k) => [k, prefs[k]])) }
	];
}

function distribute(items: Item[]) {
	const of = <T>(kind: Item['kind']) => items.filter((i) => i.kind === kind).map((i) => i.data as T);
	workoutStore.replaceAll(of<WorkoutSession>('workout').map(migrateSession));
	templatesStore.replaceAll(of<WorkoutTemplate>('template'));
	bodyweightStore.replaceAll(of<BodyweightEntry>('bodyweight'));
	setupStore.replaceAll(
		Object.fromEntries(items.filter((i) => i.kind === 'setup').map((i) => [i.id, i.data as string]))
	);
	const prefs = of<Partial<Prefs>>('prefs')[0];
	for (const key of SYNCED_PREFS) {
		if (prefs?.[key] !== undefined && prefs[key] !== prefsStore.current[key]) prefsStore.set(key, prefs[key] as never);
	}
}

function createSyncStore() {
	let state = $state<SyncState>(loadState());
	let status = $state<Status>(state.email ? 'idle' : 'signed_out');
	let running: Promise<void> | null = null;
	let again = false;

	function save(next: Partial<SyncState>) {
		state = { ...state, ...next };
		if (browser) localStorage.setItem(STATE_KEY, JSON.stringify(state));
	}

	async function request(since: number, changes: Change[]) {
		const response = await fetch('/api/sync', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ since, changes })
		});
		if (response.status === 401) return null;
		if (!response.ok) throw new Error(`sync failed: ${response.status}`);
		return (await response.json()) as { now: number; changes: Change[] };
	}

	// A device's first sync only downloads, so its defaults never overwrite what the cloud already has.
	async function run() {
		const firstPull = state.since === 0;
		const items = collect();
		const changes = firstPull ? [] : localChanges(items, state.known);
		status = 'syncing';
		try {
			const result = await request(state.since, changes);
			if (!result) {
				save({ email: null, since: 0, known: {} });
				status = 'signed_out';
				return;
			}

			// Edits made while the request was in flight win over what came back, and go up next time.
			const sent: Known = Object.fromEntries(items.map((i) => [keyOf(i.kind, i.id), fingerprint(i.data)]));
			const latest = collect();
			const meanwhile = localChanges(latest, sent);
			const skip = new Set(meanwhile.map((c) => keyOf(c.kind, c.id)));
			const remote = result.changes.filter((c) => !skip.has(keyOf(c.kind, c.id)));

			const { items: merged, known: mergedKnown } = applyRemote(latest, remote);
			if (remote.length > 0) distribute(merged);

			let known: Known;
			if (firstPull) {
				known = {};
				for (const c of remote) if (!c.deleted) known[keyOf(c.kind, c.id)] = mergedKnown[keyOf(c.kind, c.id)];
			} else {
				known = mergedKnown;
			}
			for (const c of meanwhile) {
				const key = keyOf(c.kind, c.id);
				if (c.deleted) known[key] = sent[key];
				else delete known[key];
			}

			save({ since: result.now, known, lastSyncedAt: Date.now() });
			status = 'idle';
			if (firstPull || meanwhile.length > 0) again = true;
		} catch {
			status = navigator.onLine ? 'error' : 'offline';
		}
	}

	return {
		get status() {
			return status;
		},
		get email() {
			return state.email;
		},
		get lastSyncedAt() {
			return state.lastSyncedAt;
		},
		async init() {
			try {
				const response = await fetch('/api/me');
				if (response.ok) {
					const { email } = (await response.json()) as { email: string };
					if (email !== state.email) save({ email, since: 0, known: {} });
					await this.sync();
				} else if (response.status === 401) {
					save({ email: null, since: 0, known: {} });
					status = 'signed_out';
				}
			} catch {
				if (state.email) status = 'offline';
			}
		},
		// Coalesces overlapping calls: one request at a time, plus one follow-up if more changes came in.
		async sync() {
			if (!state.email) return;
			if (running) {
				again = true;
				return running;
			}
			running = (async () => {
				do {
					again = false;
					await run();
				} while (again && state.email);
			})();
			await running;
			running = null;
		},
		hasLocalChanges(): boolean {
			return !!state.email && localChanges(collect(), state.known).length > 0;
		},
		async requestLink(email: string): Promise<boolean> {
			const response = await fetch('/api/auth/request', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email })
			});
			return response.ok;
		},
		async logout() {
			await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
			save({ email: null, since: 0, known: {}, lastSyncedAt: null });
			status = 'signed_out';
		}
	};
}

export const syncStore = createSyncStore();
