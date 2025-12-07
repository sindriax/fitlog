import type { WorkoutSession, Exercise, Category } from '$lib/types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { dev } from '$app/environment';
import { generateMockData } from '$lib/mockData';

const STORAGE_KEY = 'fitlog_workouts';

function loadFromLocalStorage(): WorkoutSession[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

function saveToLocalStorage(workouts: WorkoutSession[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function createWorkoutStore() {
	let workouts = $state<WorkoutSession[]>(loadFromLocalStorage());
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function loadFromSupabase() {
		if (!browser) return;
		isLoading = true;
		error = null;

		const { data, error: err } = await supabase
			.from('workouts')
			.select('*')
			.order('date', { ascending: false });

		if (err) {
			error = err.message;
			console.error('Failed to load from Supabase:', err);
		} else if (data) {
			workouts = data.map((row) => ({
				id: row.id,
				date: row.date,
				exercises: row.exercises as Exercise[]
			}));
			saveToLocalStorage(workouts);
		}
		isLoading = false;
	}

	if (browser) {
		loadFromSupabase();
	}

	return {
		get all() {
			return workouts;
		},
		get latest() {
			return workouts.length > 0 ? workouts[0] : null;
		},
		get recent() {
			return workouts.slice(0, 10);
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		async add(session: WorkoutSession) {
			workouts = [session, ...workouts];
			saveToLocalStorage(workouts);

			const { data: { user } } = await supabase.auth.getUser();

			const { error: err } = await supabase.from('workouts').insert({
				id: session.id,
				date: session.date,
				exercises: session.exercises,
				user_id: user?.id
			});

			if (err) {
				console.error('Failed to save to Supabase:', err);
				error = err.message;
			}
		},
		async update(session: WorkoutSession) {
			workouts = workouts.map((w) => (w.id === session.id ? session : w));
			saveToLocalStorage(workouts);

			const { error: err } = await supabase
				.from('workouts')
				.update({
					date: session.date,
					exercises: session.exercises
				})
				.eq('id', session.id);

			if (err) {
				console.error('Failed to update in Supabase:', err);
				error = err.message;
			}
		},
		async delete(id: string) {
			workouts = workouts.filter((w) => w.id !== id);
			saveToLocalStorage(workouts);

			const { error: err } = await supabase.from('workouts').delete().eq('id', id);

			if (err) {
				console.error('Failed to delete from Supabase:', err);
				error = err.message;
			}
		},
		refresh: loadFromSupabase,
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
		},
		getMachineHistory(machineName: string): { date: string; weight: number; sets: number; reps: number; feeling: string }[] {
			const history: { date: string; weight: number; sets: number; reps: number; feeling: string }[] = [];

			for (const workout of workouts) {
				for (const exercise of workout.exercises) {
					if (exercise.machine.toLowerCase() === machineName.toLowerCase()) {
						history.push({
							date: workout.date,
							weight: exercise.weight,
							sets: exercise.sets,
							reps: exercise.reps,
							feeling: exercise.feeling
						});
					}
				}
			}

			return history.reverse();
		},
		get streak(): { currentWeeks: number; longestWeeks: number; thisWeekCount: number; weeklyGoal: number } {
			const weeklyGoal = 3; // Target workouts per week

			if (workouts.length === 0) {
				return { currentWeeks: 0, longestWeeks: 0, thisWeekCount: 0, weeklyGoal };
			}

			const getWeekKey = (dateStr: string) => {
				const date = new Date(dateStr);
				const thursday = new Date(date);
				thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);
				const firstThursday = new Date(thursday.getFullYear(), 0, 4);
				const weekNum = Math.ceil(((thursday.getTime() - firstThursday.getTime()) / 86400000 + 1) / 7);
				return `${thursday.getFullYear()}-W${weekNum}`;
			};

			const weekCounts = new Map<string, number>();
			for (const w of workouts) {
				const week = getWeekKey(w.date);
				weekCounts.set(week, (weekCounts.get(week) || 0) + 1);
			}

			const today = new Date().toISOString().split('T')[0];
			const currentWeekKey = getWeekKey(today);
			const thisWeekCount = weekCounts.get(currentWeekKey) || 0;

			const weeks = [...weekCounts.keys()].sort().reverse();

			let currentWeeks = 0;
			const lastWeekKey = getWeekKey(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);

			let checkWeek = currentWeekKey;
			if ((weekCounts.get(currentWeekKey) || 0) < weeklyGoal) {
				if ((weekCounts.get(lastWeekKey) || 0) >= weeklyGoal) {
					checkWeek = lastWeekKey;
				} else {
					checkWeek = ''; 
				}
			}

			if (checkWeek) {
				for (const week of weeks) {
					if ((weekCounts.get(week) || 0) >= weeklyGoal) {
						currentWeeks++;
					} else {
						break;
					}
				}
			}

			let longestWeeks = 0;
			let tempStreak = 0;
			for (const week of weeks) {
				if ((weekCounts.get(week) || 0) >= weeklyGoal) {
					tempStreak++;
					longestWeeks = Math.max(longestWeeks, tempStreak);
				} else {
					tempStreak = 0;
				}
			}

			return { currentWeeks, longestWeeks, thisWeekCount, weeklyGoal };
		},
		get totalWorkouts(): number {
			return workouts.length;
		},
		get isDev(): boolean {
			return dev;
		},
		loadMockData(months: number = 3) {
			if (!dev) return;
			const mockWorkouts = generateMockData(months);
			workouts = mockWorkouts;
			saveToLocalStorage(workouts);
		},
		clearAllData() {
			if (!dev) return;
			workouts = [];
			saveToLocalStorage(workouts);
		}
	};
}

export const workoutStore = createWorkoutStore();
