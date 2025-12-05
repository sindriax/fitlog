import type { Category } from './types';

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
