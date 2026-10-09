// Workout dates are stored as local calendar days ("YYYY-MM-DD"), never UTC.

export function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
	const [y, m, d] = key.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function todayKey(): string {
	return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
	const date = parseDateKey(key);
	date.setDate(date.getDate() + days);
	return toDateKey(date);
}

export function weekStartKey(key: string): string {
	const date = parseDateKey(key);
	const mondayOffset = (date.getDay() + 6) % 7;
	return addDays(key, -mondayOffset);
}

export function daysBetween(from: string, to: string): number {
	return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / 86400000);
}
