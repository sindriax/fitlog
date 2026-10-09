import { addDays, weekStartKey } from './dates';

export type Streak = {
	currentWeeks: number;
	longestWeeks: number;
	thisWeekCount: number;
	weeklyGoal: number;
};

export function computeStreak(dates: string[], today: string, weeklyGoal = 3): Streak {
	const weekCounts = new Map<string, number>();
	for (const date of dates) {
		const week = weekStartKey(date);
		weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1);
	}

	const metGoal = (week: string) => (weekCounts.get(week) ?? 0) >= weeklyGoal;
	const thisWeek = weekStartKey(today);

	// The current week still counts as in progress, so the streak may end last week.
	let currentWeeks = 0;
	let week = metGoal(thisWeek) ? thisWeek : addDays(thisWeek, -7);
	while (metGoal(week)) {
		currentWeeks++;
		week = addDays(week, -7);
	}

	let longestWeeks = 0;
	let run = 0;
	let previous: string | null = null;
	for (const week of [...weekCounts.keys()].sort()) {
		if (!metGoal(week)) {
			run = 0;
		} else {
			run = previous !== null && addDays(previous, 7) === week ? run + 1 : 1;
			longestWeeks = Math.max(longestWeeks, run);
		}
		previous = week;
	}

	return {
		currentWeeks,
		longestWeeks,
		thisWeekCount: weekCounts.get(thisWeek) ?? 0,
		weeklyGoal
	};
}
