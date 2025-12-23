import type { WorkoutTemplate, TemplateExercise, Exercise } from '$lib/types';
import { browser } from '$app/environment';
import { generateId } from '$lib/utils';

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
				exercises: exercises.map((e) => ({
					machine: e.machine,
					category: e.category,
					defaultWeight: e.weight,
					defaultSets: e.sets,
					defaultReps: e.reps
				})),
				createdAt: new Date().toISOString()
			};
			templates = [template, ...templates];
			saveToLocalStorage(templates);
			return template;
		},
		delete(id: string) {
			templates = templates.filter((t) => t.id !== id);
			saveToLocalStorage(templates);
		},
		import(template: WorkoutTemplate) {
			templates = [template, ...templates];
			saveToLocalStorage(templates);
		},
		getById(id: string): WorkoutTemplate | undefined {
			return templates.find((t) => t.id === id);
		}
	};
}

export const templatesStore = createTemplatesStore();
