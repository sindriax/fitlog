import type { WorkoutSession } from '$lib/types';
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
		}
	};
}

export const workoutStore = createWorkoutStore();
