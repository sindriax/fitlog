export type Kind = 'workout' | 'template' | 'bodyweight' | 'setup' | 'prefs';
export type Item = { kind: Kind; id: string; data: unknown };
export type Change = { kind: Kind; id: string; data: unknown; deleted: boolean };

// Fingerprint of each item as it was at the last sync, keyed "kind:id".
export type Known = Record<string, number>;

export const keyOf = (kind: string, id: string) => `${kind}:${id}`;

// Stable across key order, so reloading an item from storage doesn't look like an edit.
function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, v]) => v !== undefined)
			.sort(([a], [b]) => a.localeCompare(b));
		return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

export function fingerprint(data: unknown): number {
	const text = stableStringify(data);
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

export function localChanges(items: Item[], known: Known): Change[] {
	const changes: Change[] = [];
	const present = new Set<string>();
	for (const item of items) {
		const key = keyOf(item.kind, item.id);
		present.add(key);
		if (known[key] !== fingerprint(item.data)) changes.push({ ...item, deleted: false });
	}
	for (const key of Object.keys(known)) {
		if (present.has(key)) continue;
		const split = key.indexOf(':');
		changes.push({ kind: key.slice(0, split) as Kind, id: key.slice(split + 1), data: null, deleted: true });
	}
	return changes;
}

// Applies the server's view on top of local items and returns what is now in sync.
export function applyRemote(items: Item[], remote: Change[]): { items: Item[]; known: Known } {
	const byKey = new Map(items.map((item) => [keyOf(item.kind, item.id), item]));
	for (const change of remote) {
		const key = keyOf(change.kind, change.id);
		if (change.deleted) byKey.delete(key);
		else byKey.set(key, { kind: change.kind, id: change.id, data: change.data });
	}
	const merged = [...byKey.values()];
	const known: Known = {};
	for (const item of merged) known[keyOf(item.kind, item.id)] = fingerprint(item.data);
	return { items: merged, known };
}
