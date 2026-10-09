import { describe, expect, it } from 'vitest';
import { computeStreak } from './streak';

const week = (monday: string, count: number) => {
	const [y, m, d] = monday.split('-').map(Number);
	return Array.from({ length: count }, (_, i) => {
		const date = new Date(y, m - 1, d + i);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	});
};

describe('computeStreak', () => {
	it('is empty with no workouts', () => {
		expect(computeStreak([], '2026-10-09')).toEqual({
			currentWeeks: 0,
			longestWeeks: 0,
			thisWeekCount: 0,
			weeklyGoal: 3
		});
	});

	it('orders week 9 before week 10', () => {
		const dates = [...week('2026-02-23', 3), ...week('2026-03-02', 3), ...week('2026-03-09', 3)];
		expect(computeStreak(dates, '2026-03-11').currentWeeks).toBe(3);
	});

	it('breaks the streak on a week with no workouts', () => {
		const dates = [...week('2026-09-07', 3), ...week('2026-09-28', 3), ...week('2026-10-05', 3)];
		const streak = computeStreak(dates, '2026-10-09');
		expect(streak.currentWeeks).toBe(2);
		expect(streak.longestWeeks).toBe(2);
	});

	it('keeps last week’s streak while this week is in progress', () => {
		const dates = [...week('2026-09-21', 3), ...week('2026-09-28', 3), '2026-10-06'];
		const streak = computeStreak(dates, '2026-10-09');
		expect(streak.currentWeeks).toBe(2);
		expect(streak.thisWeekCount).toBe(1);
	});

	it('ends the streak when last week missed the goal', () => {
		const dates = [...week('2026-09-21', 3), '2026-09-29', '2026-10-06'];
		expect(computeStreak(dates, '2026-10-09').currentWeeks).toBe(0);
	});

	it('counts a streak across new year', () => {
		const dates = [...week('2025-12-22', 3), ...week('2025-12-29', 3), ...week('2026-01-05', 3)];
		expect(computeStreak(dates, '2026-01-08').currentWeeks).toBe(3);
	});
});
