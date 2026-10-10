import { describe, expect, it } from 'vitest';
import { applyRemote, fingerprint, keyOf, localChanges, type Item } from './diff';

const workout = (id: string, weight: number): Item => ({ kind: 'workout', id, data: { id, weight } });

describe('fingerprint', () => {
	it('ignores key order and undefined fields', () => {
		expect(fingerprint({ a: 1, b: 2, c: undefined })).toBe(fingerprint({ b: 2, a: 1 }));
		expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
	});
});

describe('localChanges', () => {
	it('uploads everything the first time', () => {
		expect(localChanges([workout('w1', 40), workout('w2', 45)], {})).toHaveLength(2);
	});

	it('only sends items that changed or disappeared since the last sync', () => {
		const known = {
			[keyOf('workout', 'w1')]: fingerprint({ id: 'w1', weight: 40 }),
			[keyOf('workout', 'w2')]: fingerprint({ id: 'w2', weight: 45 }),
			[keyOf('workout', 'gone')]: 123
		};
		const changes = localChanges([workout('w1', 40), workout('w2', 47)], known);
		expect(changes).toEqual([
			{ kind: 'workout', id: 'w2', data: { id: 'w2', weight: 47 }, deleted: false },
			{ kind: 'workout', id: 'gone', data: null, deleted: true }
		]);
	});

	it('keeps ids that contain colons intact', () => {
		const changes = localChanges([], { [keyOf('setup', 'press: v2')]: 1 });
		expect(changes[0]).toMatchObject({ kind: 'setup', id: 'press: v2', deleted: true });
	});
});

describe('applyRemote', () => {
	it('merges other devices’ items and deletions, then marks everything as synced', () => {
		const { items, known } = applyRemote(
			[workout('w1', 40), workout('w2', 45)],
			[
				{ kind: 'workout', id: 'w3', data: { id: 'w3', weight: 50 }, deleted: false },
				{ kind: 'workout', id: 'w2', data: null, deleted: true },
				{ kind: 'workout', id: 'w1', data: { id: 'w1', weight: 42 }, deleted: false }
			]
		);
		expect(items.map((i) => i.data)).toEqual([
			{ id: 'w1', weight: 42 },
			{ id: 'w3', weight: 50 }
		]);
		expect(localChanges(items, known)).toEqual([]);
	});
});
