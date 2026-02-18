import type { WorkoutSession, Exercise, Category } from '$lib/types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { dev } from '$app/environment';
import { generateMockData } from '$lib/mockData';
import { toastStore } from '$lib/stores/toast.svelte';

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
const PENDING_SYNC_KEY = 'fitlog_pending_sync';

function loadFromLocalStorage(): WorkoutSession[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
}

function saveToLocalStorage(workouts: WorkoutSession[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function loadPendingSync(): Set<string> {
	if (!browser) return new Set();
	const stored = localStorage.getItem(PENDING_SYNC_KEY);
	return stored ? new Set(JSON.parse(stored)) : new Set();
}

function savePendingSync(pending: Set<string>) {
	if (!browser) return;
	if (pending.size === 0) {
		localStorage.removeItem(PENDING_SYNC_KEY);
	} else {
		localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([...pending]));
	}
}

function createWorkoutStore() {
	let workouts = $state<WorkoutSession[]>(loadFromLocalStorage());
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let pendingSync = loadPendingSync();

	const streakData = $derived.by(() => {
		const weeklyGoal = 3;

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
	});

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
			toastStore.show('Failed to sync data — using local data', 'error', 5000);
		} else if (data) {
			const supabaseWorkouts: WorkoutSession[] = data.map((row) => ({
				id: row.id,
				date: row.date,
				exercises: row.exercises as Exercise[],
				duration: row.duration as number | undefined
			}));

			const supabaseIds = new Set(supabaseWorkouts.map((w) => w.id));
			const unsyncedLocal = workouts.filter((w) => !supabaseIds.has(w.id));

			if (unsyncedLocal.length > 0) {
				const {
					data: { user }
				} = await supabase.auth.getUser();

				for (const session of unsyncedLocal) {
					const { error: syncErr } = await supabase.from('workouts').insert({
						id: session.id,
						date: session.date,
						exercises: session.exercises,
						duration: session.duration,
						user_id: user?.id
					});

					if (syncErr) {
						console.error('Failed to sync workout:', session.id, syncErr);
						pendingSync.add(session.id);
					} else {
						pendingSync.delete(session.id);
						supabaseWorkouts.push(session);
					}
				}

				savePendingSync(pendingSync);

				if (pendingSync.size > 0) {
					toastStore.show(
						`${pendingSync.size} workout(s) pending cloud sync`,
						'error',
						5000
					);
				}
			}

			const mergedIds = new Set<string>();
			const merged: WorkoutSession[] = [];

			for (const w of [
				...supabaseWorkouts,
				...unsyncedLocal.filter((w) => pendingSync.has(w.id))
			]) {
				if (!mergedIds.has(w.id)) {
					mergedIds.add(w.id);
					merged.push(w);
				}
			}

			workouts = merged.sort((a, b) => b.date.localeCompare(a.date));
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

			pendingSync.add(session.id);
			savePendingSync(pendingSync);

			try {
				const {
					data: { user }
				} = await supabase.auth.getUser();

				const { error: err } = await supabase.from('workouts').insert({
					id: session.id,
					date: session.date,
					exercises: session.exercises,
					duration: session.duration,
					user_id: user?.id
				});

				if (err) {
					console.error('Failed to save to Supabase:', err);
					error = err.message;
					toastStore.show('Saved locally — cloud sync failed', 'error', 5000);
				} else {
					pendingSync.delete(session.id);
					savePendingSync(pendingSync);
				}
			} catch (e) {
				console.error('Network error saving to Supabase:', e);
				toastStore.show('Saved locally — no connection', 'error', 5000);
			}
		},
		async update(session: WorkoutSession) {
			workouts = workouts.map((w) => (w.id === session.id ? session : w));
			saveToLocalStorage(workouts);

			pendingSync.add(session.id);
			savePendingSync(pendingSync);

			try {
				const { error: err } = await supabase
					.from('workouts')
					.update({
						date: session.date,
						exercises: session.exercises,
						duration: session.duration
					})
					.eq('id', session.id);

				if (err) {
					console.error('Failed to update in Supabase:', err);
					error = err.message;
					toastStore.show('Updated locally — cloud sync failed', 'error', 5000);
				} else {
					pendingSync.delete(session.id);
					savePendingSync(pendingSync);
				}
			} catch (e) {
				console.error('Network error updating Supabase:', e);
				toastStore.show('Updated locally — no connection', 'error', 5000);
			}
		},
		async delete(id: string) {
			workouts = workouts.filter((w) => w.id !== id);
			saveToLocalStorage(workouts);
			pendingSync.delete(id);
			savePendingSync(pendingSync);

			try {
				const { error: err } = await supabase.from('workouts').delete().eq('id', id);

				if (err) {
					console.error('Failed to delete from Supabase:', err);
					error = err.message;
					toastStore.show('Deleted locally — cloud sync failed', 'error', 5000);
				}
			} catch (e) {
				console.error('Network error deleting from Supabase:', e);
				toastStore.show('Deleted locally — no connection', 'error', 5000);
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
			const twoWeeksAgo = new Date();
			twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
			const twoWeeksAgoCutoff = twoWeeksAgo.toISOString().split('T')[0];

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
						date: new Date().toISOString().split('T')[0],
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
						date: new Date().toISOString().split('T')[0],
						previousWeight: currentPR.weight
					});
				}
			}

			return prs;
		},
		get weeklyStats(): WeeklyStats {
			const getWeekStart = (date: Date) => {
				const d = new Date(date);
				const day = d.getDay();
				const diff = d.getDate() - day + (day === 0 ? -6 : 1);
				d.setDate(diff);
				d.setHours(0, 0, 0, 0);
				return d;
			};

			const calcVolumeForWeek = (weekStartDate: Date) => {
				const weekEnd = new Date(weekStartDate);
				weekEnd.setDate(weekEnd.getDate() + 7);

				const weekWorkouts = workouts.filter(w => {
					const workoutDate = new Date(w.date);
					return workoutDate >= weekStartDate && workoutDate < weekEnd;
				});

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

			const thisWeekStart = getWeekStart(new Date());
			const lastWeekStart = new Date(thisWeekStart);
			lastWeekStart.setDate(lastWeekStart.getDate() - 7);

			const thisWeek = calcVolumeForWeek(thisWeekStart);
			const lastWeek = calcVolumeForWeek(lastWeekStart);

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
			const lastDate = new Date(workouts[0].date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			lastDate.setHours(0, 0, 0, 0);
			const diffTime = today.getTime() - lastDate.getTime();
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
			return diffDays;
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
			const twoWeeksAgo = new Date();
			twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
			const cutoff = twoWeeksAgo.toISOString().split('T')[0];

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
