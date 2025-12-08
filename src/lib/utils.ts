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
		core: '🎯',
		cardio: '❤️'
	};
	return emojis[category];
}

export function getCategoryColor(category: Category): { bg: string; text: string; border: string } {
	const colors: Record<Category, { bg: string; text: string; border: string }> = {
		legs: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' },
		back: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
		chest: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
		shoulders: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
		arms: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
		core: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
		cardio: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' }
	};
	return colors[category];
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

	return sorted.map(([cat]) => getCategoryLabel(cat)).join(' + ');
}

export function getSessionCategoryCounts(session: WorkoutSession): { category: Category; count: number }[] {
	if (session.exercises.length === 0) return [];

	const counts = session.exercises.reduce(
		(acc, e) => {
			acc[e.category] = (acc[e.category] || 0) + 1;
			return acc;
		},
		{} as Record<Category, number>
	);

	return Object.entries(counts)
		.sort(([, a], [, b]) => b - a)
		.map(([cat, count]) => ({ category: cat as Category, count }));
}
