import { describe, expect, it } from 'vitest';
import { weekRecap } from './recap';
import type { Exercise, WorkoutSession } from './types';

const session = (date: string, machine: string, weight: number, extra: Partial<Exercise> = {}): WorkoutSession => ({
	id: date + machine,
	date,
	exercises: [{ id: date, machine, category: 'back', weight, sets: 3, reps: 10, next: 'stay', ...extra }]
});

describe('weekRecap', () => {
	const workouts = [
		session('2026-10-08', 'Remo', 20),
		session('2026-10-06', 'Remo', 18),
		session('2026-10-06', 'Prensa', 50),
		session('2026-09-29', 'Remo', 18),
		session('2026-10-07', 'Correr', 0, { category: 'cardio', sets: 0, reps: 0 })
	];

	it('counts the week’s sessions and volume, ignoring cardio', () => {
		const recap = weekRecap(workouts, [], '2026-10-05');
		expect(recap.sessions).toBe(4);
		expect(recap.volume).toBe(20 * 30 + 18 * 30 + 50 * 30);
	});

	it('lists records that beat earlier weeks, not first-time exercises', () => {
		expect(weekRecap(workouts, [], '2026-10-05').records).toEqual(['Remo']);
	});

	it('compares body weight with the last entry before the week', () => {
		const bodyweight = [
			{ date: '2026-10-01', weight: 70 },
			{ date: '2026-10-06', weight: 69.6 },
			{ date: '2026-10-09', weight: 69.2 }
		];
		expect(weekRecap(workouts, bodyweight, '2026-10-05').bodyweightChange).toBe(-0.8);
		expect(weekRecap(workouts, [], '2026-10-05').bodyweightChange).toBeNull();
	});
});
