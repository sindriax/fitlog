import type { WorkoutSession, Exercise, Category } from '$lib/types';
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import { generateMockData } from '$lib/mockData';
import { addDays, daysBetween, todayKey, weekStartKey } from '$lib/dates';
import { computeStreak } from '$lib/streak';

export interface PersonalRecord {
	machine: string;
	category: Category;
	weight: number;
	date: string;
	previousWeight: number | null;
}

export interface WeeklyStats {
	totalVolume: number;
	totalSets: number;
	totalReps: number;
	exerciseCount: number;
	workoutCount: number;
	lastWeekVolume: number;
	volumeChange: number;
}

const STORAGE_KEY = 'fitlog_workouts';

function loadFromLocalStorage(): WorkoutSession[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? sortNewestFirst(JSON.parse(stored)) : [];
}

function sortNewestFirst(sessions: WorkoutSession[]): WorkoutSession[] {
	return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
}

function saveToLocalStorage(workouts: WorkoutSession[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function createWorkoutStore() {
	let workouts = $state<WorkoutSession[]>(loadFromLocalStorage());

	const streakData = $derived(computeStreak(workouts.map((w) => w.date), todayKey()));

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
		add(session: WorkoutSession) {
			this.addMany([session]);
		},
		addMany(sessions: WorkoutSession[]) {
			workouts = sortNewestFirst([...sessions, ...workouts]);
			saveToLocalStorage(workouts);
		},
		has(id: string): boolean {
			return workouts.some((w) => w.id === id);
		},
		update(session: WorkoutSession) {
			workouts = sortNewestFirst(workouts.map((w) => (w.id === session.id ? session : w)));
			saveToLocalStorage(workouts);
		},
		delete(id: string) {
			workouts = workouts.filter((w) => w.id !== id);
			saveToLocalStorage(workouts);
		},
		replaceAll(sessions: WorkoutSession[]) {
			workouts = sortNewestFirst(sessions);
			saveToLocalStorage(workouts);
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
		get streak() {
			return streakData;
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
		},
		getPersonalRecord(machineName: string): { weight: number; date: string } | null {
			let maxWeight = 0;
			let maxDate = '';

			for (const workout of workouts) {
				for (const exercise of workout.exercises) {
					if (exercise.machine.toLowerCase() === machineName.toLowerCase()) {
						if (exercise.weight > maxWeight) {
							maxWeight = exercise.weight;
							maxDate = workout.date;
						}
					}
				}
			}

			return maxWeight > 0 ? { weight: maxWeight, date: maxDate } : null;
		},
		checkForPRs(newExercises: Exercise[]): PersonalRecord[] {
			const prs: PersonalRecord[] = [];
			const today = todayKey();
			const twoWeeksAgoCutoff = addDays(today, -14);

			for (const exercise of newExercises) {
				if (exercise.category === 'cardio' || exercise.category === 'sports') continue;
				if (exercise.weight <= 0) continue;

				const currentPR = this.getPersonalRecord(exercise.machine);

				if (currentPR && exercise.weight <= currentPR.weight) continue;

				if (!currentPR) {
					prs.push({
						machine: exercise.machine,
						category: exercise.category,
						weight: exercise.weight,
						date: today,
						previousWeight: null
					});
					continue;
				}

				const improvement = exercise.weight - currentPR.weight;
				const lastPRDate = currentPR.date;
				const isAfterPlateau = lastPRDate < twoWeeksAgoCutoff;
				const isBigJump = improvement >= 5;

				if (isAfterPlateau || isBigJump) {
					prs.push({
						machine: exercise.machine,
						category: exercise.category,
						weight: exercise.weight,
						date: today,
						previousWeight: currentPR.weight
					});
				}
			}

			return prs;
		},
		get weeklyStats(): WeeklyStats {
			const statsForWeek = (weekStart: string) => {
				const weekWorkouts = workouts.filter((w) => weekStartKey(w.date) === weekStart);

				let volume = 0;
				let sets = 0;
				let reps = 0;
				let exercises = 0;

				for (const workout of weekWorkouts) {
					for (const exercise of workout.exercises) {
						if (exercise.category !== 'cardio' && exercise.category !== 'sports') {
							volume += exercise.weight * exercise.sets * exercise.reps;
							sets += exercise.sets;
							reps += exercise.sets * exercise.reps;
							exercises++;
						}
					}
				}

				return { volume, sets, reps, exercises, workoutCount: weekWorkouts.length };
			};

			const thisWeekStart = weekStartKey(todayKey());
			const thisWeek = statsForWeek(thisWeekStart);
			const lastWeek = statsForWeek(addDays(thisWeekStart, -7));

			return {
				totalVolume: thisWeek.volume,
				totalSets: thisWeek.sets,
				totalReps: thisWeek.reps,
				exerciseCount: thisWeek.exercises,
				workoutCount: thisWeek.workoutCount,
				lastWeekVolume: lastWeek.volume,
				volumeChange: thisWeek.volume - lastWeek.volume
			};
		},
		get daysSinceLastWorkout(): number | null {
			if (workouts.length === 0) return null;
			return daysBetween(workouts[0].date, todayKey());
		},
		get frequentMachines(): { machine: string; category: Category; count: number; lastWeight: number }[] {
			const machineUsage = new Map<string, { category: Category; count: number; lastWeight: number }>();

			for (const workout of workouts) {
				for (const exercise of workout.exercises) {
					const key = exercise.machine.toLowerCase();
					if (!machineUsage.has(key)) {
						machineUsage.set(key, {
							category: exercise.category,
							count: 0,
							lastWeight: exercise.weight
						});
					}
					const current = machineUsage.get(key)!;
					current.count++;
				}
			}

			return [...machineUsage.entries()]
				.map(([machine, data]) => ({
					machine: workouts.flatMap(w => w.exercises).find(e => e.machine.toLowerCase() === machine)?.machine || machine,
					category: data.category,
					count: data.count,
					lastWeight: data.lastWeight
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);
		},
		get recentMachines(): { machine: string; category: Category; lastWeight: number; lastDate: string }[] {
			const cutoff = addDays(todayKey(), -14);

			const seen = new Map<string, { machine: string; category: Category; lastWeight: number; lastDate: string }>();

			for (const workout of workouts) {
				if (workout.date < cutoff) break;
				for (const exercise of workout.exercises) {
					const key = exercise.machine.toLowerCase();
					if (!seen.has(key)) {
						seen.set(key, {
							machine: exercise.machine,
							category: exercise.category,
							lastWeight: exercise.weight,
							lastDate: workout.date
						});
					}
				}
			}

			return [...seen.values()].slice(0, 8); // Max 8 recent
		}
	};
}

export const workoutStore = createWorkoutStore();
