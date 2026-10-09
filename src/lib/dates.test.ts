import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, toDateKey, weekStartKey } from './dates';

describe('dates', () => {
	it('keeps the local day just after midnight', () => {
		expect(toDateKey(new Date(2026, 9, 7, 0, 30))).toBe('2026-10-07');
	});

	it('crosses month, year and DST boundaries', () => {
		expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
		expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
		expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
	});

	it('starts weeks on Monday', () => {
		expect(weekStartKey('2026-10-05')).toBe('2026-10-05');
		expect(weekStartKey('2026-10-11')).toBe('2026-10-05');
		expect(weekStartKey('2026-01-01')).toBe('2025-12-29');
	});

	it('counts whole days across DST', () => {
		expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
	});
});
