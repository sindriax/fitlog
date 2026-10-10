import type { WorkoutTemplate, TemplateExercise, Exercise } from '$lib/types';
import { browser } from '$app/environment';
import { generateId } from '$lib/utils';
import { renameInTemplates } from '$lib/rename';

const STORAGE_KEY = 'fitlog_templates';

function loadFromLocalStorage(): WorkoutTemplate[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

function saveToLocalStorage(templates: WorkoutTemplate[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function toTemplateExercise(e: Exercise): TemplateExercise {
	return {
		machine: e.machine,
		category: e.category,
		defaultWeight: e.weight,
		defaultSets: e.sets,
		defaultReps: e.reps
	};
}

function createTemplatesStore() {
	let templates = $state<WorkoutTemplate[]>(loadFromLocalStorage());

	return {
		get all() {
			return templates;
		},
		add(name: string, exercises: Exercise[]) {
			const template: WorkoutTemplate = {
				id: generateId(),
				name,
				exercises: exercises.map(toTemplateExercise),
				createdAt: new Date().toISOString()
			};
			templates = [...templates, template];
			saveToLocalStorage(templates);
			return template;
		},
		update(id: string, changes: Partial<Pick<WorkoutTemplate, 'name' | 'exercises'>>) {
			templates = templates.map((t) => (t.id === id ? { ...t, ...changes } : t));
			saveToLocalStorage(templates);
		},
		move(id: string, offset: number) {
			const from = templates.findIndex((t) => t.id === id);
			const to = from + offset;
			if (from < 0 || to < 0 || to >= templates.length) return;
			const next = [...templates];
			[next[from], next[to]] = [next[to], next[from]];
			templates = next;
			saveToLocalStorage(templates);
		},
		replaceAll(next: WorkoutTemplate[]) {
			templates = next;
			saveToLocalStorage(templates);
		},
		renameMachine(from: string, to: string) {
			templates = renameInTemplates(templates, from, to);
			saveToLocalStorage(templates);
		},
		delete(id: string) {
			templates = templates.filter((t) => t.id !== id);
			saveToLocalStorage(templates);
		},
		import(template: WorkoutTemplate) {
			templates = [...templates, template];
			saveToLocalStorage(templates);
		},
		getById(id: string): WorkoutTemplate | undefined {
			return templates.find((t) => t.id === id);
		}
	};
}

export const templatesStore = createTemplatesStore();
