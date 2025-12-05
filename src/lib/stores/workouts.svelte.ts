import type { WorkoutSession, Exercise, Category } from '$lib/types';
import { browser } from '$app/environment';

const STORAGE_KEY = 'fitlog_workouts';

function loadWorkouts(): WorkoutSession[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

function saveWorkouts(workouts: WorkoutSession[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function createWorkoutStore() {
	let workouts = $state<WorkoutSession[]>(loadWorkouts());

	return {
		get all() {
			return workouts;
		},
		get latest() {
			return workouts.length > 0 ? workouts[0] : null;
		},
		get recent() {
			return workouts.slice(0, 5);
		},
		add(session: WorkoutSession) {
			workouts = [session, ...workouts];
			saveWorkouts(workouts);
		},
		update(session: WorkoutSession) {
			workouts = workouts.map((w) => (w.id === session.id ? session : w));
			saveWorkouts(workouts);
		},
		delete(id: string) {
			workouts = workouts.filter((w) => w.id !== id);
			saveWorkouts(workouts);
		},
		get machines(): string[] {
			const allMachines = workouts.flatMap((w) => w.exercises.map((e) => e.machine));
			return [...new Set(allMachines)].sort();
		},
		getLastExercise(machineName: string): Exercise | null {
			for (const workout of workouts) {
				const exercise = workout.exercises.find(
					(e) => e.machine.toLowerCase() === machineName.toLowerCase()
				);
				if (exercise) return exercise;
			}
			return null;
		},
		getMachineSuggestions(query: string): { machine: string; category: Category; lastWeight: number }[] {
			if (!query.trim()) return [];
			const q = query.toLowerCase();
			const seen = new Set<string>();
			const suggestions: { machine: string; category: Category; lastWeight: number }[] = [];

			for (const workout of workouts) {
				for (const exercise of workout.exercises) {
					const machineKey = exercise.machine.toLowerCase();
					if (machineKey.includes(q) && !seen.has(machineKey)) {
						seen.add(machineKey);
						suggestions.push({
							machine: exercise.machine,
							category: exercise.category,
							lastWeight: exercise.weight
						});
					}
				}
			}
			return suggestions.slice(0, 5);
		}
	};
}

export const workoutStore = createWorkoutStore();
