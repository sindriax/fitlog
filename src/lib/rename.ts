import type { WorkoutSession, WorkoutTemplate } from './types';

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Renaming onto an existing name merges the two histories under that name and its category.
export function renameInSessions(sessions: WorkoutSession[], from: string, to: string): WorkoutSession[] {
	const target = sessions.flatMap((s) => s.exercises).find((e) => same(e.machine, to) && !same(e.machine, from));
	return sessions.map((session) => ({
		...session,
		exercises: session.exercises.map((e) =>
			same(e.machine, from) ? { ...e, machine: target?.machine ?? to, category: target?.category ?? e.category } : e
		)
	}));
}

export function renameInTemplates(templates: WorkoutTemplate[], from: string, to: string): WorkoutTemplate[] {
	return templates.map((template) => ({
		...template,
		exercises: template.exercises
			.map((e) => (same(e.machine, from) ? { ...e, machine: to } : e))
			.filter((e, i, all) => all.findIndex((other) => same(other.machine, e.machine)) === i)
	}));
}
