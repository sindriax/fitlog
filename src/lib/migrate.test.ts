import { describe, expect, it } from 'vitest';
import { migrateSession } from './migrate';
import type { WorkoutSession } from './types';

const legacy = (feeling: string) =>
	({
		id: 'w1',
		date: '2026-10-07',
		exercises: [{ id: 'e1', machine: 'Leg Press', category: 'legs', weight: 50, sets: 3, reps: 12, feeling }]
	}) as unknown as WorkoutSession;

describe('migrateSession', () => {
	it('maps old feelings to next-time progression', () => {
		expect(migrateSession(legacy('too_easy')).exercises[0].next).toBe('up');
		expect(migrateSession(legacy('just_right')).exercises[0].next).toBe('stay');
		expect(migrateSession(legacy('too_hard')).exercises[0].next).toBe('down');
	});

	it('drops the old field', () => {
		expect(migrateSession(legacy('too_easy')).exercises[0]).not.toHaveProperty('feeling');
	});

	it('leaves migrated exercises alone', () => {
		const session = migrateSession(legacy('too_hard'));
		expect(migrateSession(session)).toEqual(session);
	});
});
