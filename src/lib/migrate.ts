import type { Exercise, Progression, WorkoutSession } from './types';

// Before v2, exercises stored how they felt instead of what to do next time.
const fromFeeling: Record<string, Progression> = {
	too_easy: 'up',
	just_right: 'stay',
	too_hard: 'down'
};

export function migrateExercise<T extends Exercise>(exercise: T & { feeling?: string }): T {
	if (exercise.next) return exercise;
	const { feeling, ...rest } = exercise;
	return { ...rest, next: fromFeeling[feeling ?? ''] ?? 'stay' } as T;
}

export function migrateSession(session: WorkoutSession): WorkoutSession {
	return { ...session, exercises: (session.exercises ?? []).map(migrateExercise) };
}
