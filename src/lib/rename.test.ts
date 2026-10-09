import { describe, expect, it } from 'vitest';
import { renameInSessions, renameInTemplates } from './rename';
import type { Exercise, WorkoutSession, WorkoutTemplate } from './types';

const ex = (machine: string, category: Exercise['category'] = 'back'): Exercise => ({
	id: machine,
	machine,
	category,
	weight: 40,
	sets: 3,
	reps: 12,
	next: 'stay'
});

const sessions: WorkoutSession[] = [
	{ id: 'a', date: '2026-10-07', exercises: [ex('dorsal en pole alfa diveegente'), ex('remo sentado')] },
	{ id: 'b', date: '2026-10-05', exercises: [ex('Dorsal en polea alta divergente', 'back')] }
];

describe('renameInSessions', () => {
	it('renames every session, ignoring case', () => {
		const result = renameInSessions(sessions, 'DORSAL EN POLE ALFA DIVEEGENTE', 'Jalón divergente');
		expect(result[0].exercises.map((e) => e.machine)).toEqual(['Jalón divergente', 'remo sentado']);
	});

	it('merges into an existing exercise, keeping its spelling and category', () => {
		const withLegs = [...sessions, { id: 'c', date: '2026-10-01', exercises: [ex('typo', 'legs')] }];
		const result = renameInSessions(withLegs, 'typo', 'remo SENTADO');
		expect(result[2].exercises[0]).toMatchObject({ machine: 'remo sentado', category: 'back' });
	});
});

describe('renameInTemplates', () => {
	it('drops the duplicate when a routine already has the merge target', () => {
		const routines: WorkoutTemplate[] = [
			{
				id: 'r',
				name: 'Upper',
				createdAt: '',
				exercises: [
					{ machine: 'typo', category: 'back', defaultWeight: 40, defaultSets: 3, defaultReps: 12 },
					{ machine: 'remo sentado', category: 'back', defaultWeight: 18, defaultSets: 3, defaultReps: 12 }
				]
			}
		];
		expect(renameInTemplates(routines, 'typo', 'remo sentado')[0].exercises.map((e) => e.machine)).toEqual(['remo sentado']);
	});
});
