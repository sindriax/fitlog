import { addDays } from './dates';
import { isTimed } from './progression';
import type { WorkoutSession } from './types';

export type WeekRecap = {
	weekStart: string;
	sessions: number;
	volume: number;
	records: string[];
	bodyweightChange: number | null;
};

export function weekRecap(
	workouts: WorkoutSession[],
	bodyweight: { date: string; weight: number }[],
	weekStart: string
): WeekRecap {
	const weekEnd = addDays(weekStart, 7);
	const inWeek = (date: string) => date >= weekStart && date < weekEnd;

	const best = new Map<string, number>();
	for (const w of workouts) {
		if (w.date >= weekStart) continue;
		for (const e of w.exercises) {
			if (isTimed(e)) continue;
			const key = e.machine.toLowerCase();
			best.set(key, Math.max(best.get(key) ?? 0, e.weight));
		}
	}

	const week = workouts.filter((w) => inWeek(w.date));
	const records = new Map<string, string>();
	let volume = 0;
	for (const w of [...week].sort((a, b) => a.date.localeCompare(b.date))) {
		for (const e of w.exercises) {
			if (isTimed(e)) continue;
			volume += e.weight * e.sets * e.reps;
			const key = e.machine.toLowerCase();
			const previous = best.get(key);
			if (previous !== undefined && e.weight > previous) records.set(key, e.machine);
			best.set(key, Math.max(previous ?? 0, e.weight));
		}
	}

	const before = bodyweight.filter((b) => b.date < weekStart).at(-1);
	const during = bodyweight.filter((b) => inWeek(b.date)).at(-1);
	const bodyweightChange = before && during ? Math.round((during.weight - before.weight) * 10) / 10 : null;

	return { weekStart, sessions: week.length, volume, records: [...records.values()], bodyweightChange };
}
