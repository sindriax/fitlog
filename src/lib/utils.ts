import type { Category, WorkoutSession } from './types';

export function generateId(): string {
	return crypto.randomUUID();
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (dateString === today.toISOString().split('T')[0]) {
		return 'Today';
	}
	if (dateString === yesterday.toISOString().split('T')[0]) {
		return 'Yesterday';
	}

	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'short',
		day: 'numeric'
	});
}

export function getCategoryEmoji(category: Category): string {
	const emojis: Record<Category, string> = {
		legs: '🦵',
		back: '🔙',
		chest: '💪',
		shoulders: '🏋️',
		arms: '💪',
		core: '🎯'
	};
	return emojis[category];
}

export function getCategoryLabel(category: Category): string {
	return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getTodayDateString(): string {
	return new Date().toISOString().split('T')[0];
}

export function getSessionCategories(session: WorkoutSession): Category[] {
	const categories = session.exercises.map((e) => e.category);
	return [...new Set(categories)];
}

export function formatSessionCategories(session: WorkoutSession): string {
	if (session.exercises.length === 0) return 'No exercises';

	const counts = session.exercises.reduce(
		(acc, e) => {
			acc[e.category] = (acc[e.category] || 0) + 1;
			return acc;
		},
		{} as Record<Category, number>
	);

	const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a) as [Category, number][];

	return sorted
		.map(([cat, count]) => {
			const label = `${getCategoryEmoji(cat)} ${getCategoryLabel(cat)}`;
			return count > 1 ? `${label} (${count})` : label;
		})
		.join(' • ');
}
