import { describe, expect, it } from 'vitest';
import { parseNotes } from './notesParser';

const notes = `dorsal en pole alfa diveegente
3x12 45kg oct 5th
3x12 47kg oct 7th -stay here

prensa de hombro concergente
3x10 16kg
3x12 16kg oct 7th - stay

maquina abdominal
2x13 36kg

maquina correr
15 min - picture attached of details
15 min - 12 incline x 5 (151 calories and 1.15 km)

lower

extension de piernas
4x10 36kg oct 6th
3x10 41kg oct 8th

muslo exterior
3x12 45kg
3x12 45kg

extensión de glúteos
1x27kg`;

const today = new Date(2026, 9, 9);

describe('parseNotes', () => {
	const result = parseNotes(notes, today);
	const byDate = Object.fromEntries(result.workouts.map((w) => [w.date, w.exercises]));

	it('groups lines into one workout per date, newest first', () => {
		expect(result.workouts.map((w) => w.date)).toEqual(['2026-10-08', '2026-10-07', '2026-10-06', '2026-10-05']);
	});

	it('reads sets, reps and weight', () => {
		expect(byDate['2026-10-07'][0]).toMatchObject({
			machine: 'dorsal en pole alfa diveegente',
			category: 'back',
			sets: 3,
			reps: 12,
			weight: 47,
			next: 'stay'
		});
	});

	it('gives undated lines the section’s latest dates', () => {
		const shoulder = (date: string) => byDate[date].find((e) => e.machine.startsWith('prensa de hombro'));
		expect(shoulder('2026-10-05')).toMatchObject({ reps: 10, weight: 16 });
		expect(shoulder('2026-10-07')).toMatchObject({ reps: 12, weight: 16 });
		expect(byDate['2026-10-07'].some((e) => e.machine === 'maquina abdominal')).toBe(true);
		expect(byDate['2026-10-06'].some((e) => e.machine === 'muslo exterior')).toBe(true);
		expect(byDate['2026-10-08'].some((e) => e.machine === 'muslo exterior')).toBe(true);
	});

	it('reads treadmill details', () => {
		const run = byDate['2026-10-07'].find((e) => e.machine === 'maquina correr');
		expect(run).toMatchObject({
			category: 'cardio',
			cardio: { minutes: 15, incline: 12, speed: 5, calories: 151, distance: 1.15 }
		});
	});

	it('creates a routine per section', () => {
		expect(result.routines.map((r) => [r.name, r.exercises.length])).toEqual([
			['Routine 1', 4],
			['lower', 2]
		]);
		expect(result.routines[1].exercises[0]).toMatchObject({ machine: 'extension de piernas', defaultWeight: 41, defaultSets: 3 });
	});

	it('reports lines it cannot read instead of guessing', () => {
		expect(result.unreadable).toEqual(['extensión de glúteos: 1x27kg']);
	});

	it('puts last year’s dates in the past', () => {
		expect(parseNotes('leg press\n3x10 50kg dec 20th', today).workouts[0].date).toBe('2025-12-20');
	});
});
