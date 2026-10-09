import { describe, expect, it } from 'vitest';
import { nextWeight, summarize, weightStep } from './progression';
import type { Exercise } from './types';

describe('weightStep', () => {
	it('defaults to 2.5 kg without history', () => {
		expect(weightStep([])).toBe(2.5);
		expect(weightStep([45, 45])).toBe(2.5);
	});

	it('uses the smallest change seen on the machine', () => {
		expect(weightStep([45, 47, 47])).toBe(2);
		expect(weightStep([36, 41])).toBe(5);
		expect(weightStep([30, 35, 37.5, 35])).toBe(2.5);
	});
});

describe('nextWeight', () => {
	it('follows the decision made last time', () => {
		expect(nextWeight({ weight: 47, next: 'up' }, 2)).toBe(49);
		expect(nextWeight({ weight: 47, next: 'stay' }, 2)).toBe(47);
		expect(nextWeight({ weight: 47, next: 'down' }, 2)).toBe(45);
		expect(nextWeight({ weight: 1, next: 'down' }, 2)).toBe(0);
	});
});

describe('summarize', () => {
	const base = { id: 'e', machine: 'm', notes: undefined, next: 'stay' } as const;

	it('formats strength sets', () => {
		expect(summarize({ ...base, category: 'back', weight: 47, sets: 3, reps: 12 })).toBe('3×12 · 47 kg');
	});

	it('formats treadmill sessions, skipping empty fields', () => {
		const run: Exercise = {
			...base,
			category: 'cardio',
			weight: 0,
			sets: 0,
			reps: 0,
			cardio: { minutes: 15, incline: 12, speed: 5, calories: 151, distance: 1.15 }
		};
		expect(summarize(run)).toBe('15 min · 12% · 5 km/h · 1.15 km · 151 kcal');
		expect(summarize({ ...run, cardio: { minutes: 15, incline: 0, speed: 0, calories: 0 } })).toBe('15 min');
	});
});
