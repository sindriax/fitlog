import type { WorkoutSession, Exercise, Category, Feeling } from './types';
import { generateId } from './utils';

const machines: { name: string; category: Category; startWeight: number }[] = [
	{ name: 'Leg Press', category: 'legs', startWeight: 60 },
	{ name: 'Leg Curl', category: 'legs', startWeight: 25 },
	{ name: 'Leg Extension', category: 'legs', startWeight: 30 },
	{ name: 'Lat Pulldown', category: 'back', startWeight: 35 },
	{ name: 'Seated Row', category: 'back', startWeight: 40 },
	{ name: 'Chest Press', category: 'chest', startWeight: 30 },
	{ name: 'Pec Fly', category: 'chest', startWeight: 25 },
	{ name: 'Shoulder Press', category: 'shoulders', startWeight: 20 },
	{ name: 'Lateral Raise', category: 'shoulders', startWeight: 8 },
	{ name: 'Bicep Curl', category: 'arms', startWeight: 10 },
	{ name: 'Tricep Pushdown', category: 'arms', startWeight: 20 },
	{ name: 'Cable Crunch', category: 'core', startWeight: 30 }
];

const workoutTemplates: { name: string; machines: string[] }[] = [
	{ name: 'legs', machines: ['Leg Press', 'Leg Curl', 'Leg Extension'] },
	{ name: 'push', machines: ['Chest Press', 'Pec Fly', 'Shoulder Press', 'Tricep Pushdown'] },
	{ name: 'pull', machines: ['Lat Pulldown', 'Seated Row', 'Bicep Curl'] },
	{ name: 'upper', machines: ['Chest Press', 'Lat Pulldown', 'Shoulder Press', 'Bicep Curl', 'Tricep Pushdown'] }
];

function randomFeeling(progressPercent: number): Feeling {
	const rand = Math.random();
	if (progressPercent < 0.3) {
		return rand < 0.3 ? 'too_hard' : rand < 0.7 ? 'just_right' : 'too_easy';
	} else if (progressPercent < 0.7) {
		return rand < 0.15 ? 'too_hard' : rand < 0.75 ? 'just_right' : 'too_easy';
	} else {
		return rand < 0.1 ? 'too_hard' : rand < 0.5 ? 'just_right' : 'too_easy';
	}
}

export function generateMockData(months: number = 3): WorkoutSession[] {
	const sessions: WorkoutSession[] = [];
	const today = new Date();
	const startDate = new Date(today);
	startDate.setMonth(startDate.getMonth() - months);

	const currentWeights: Record<string, number> = {};
	machines.forEach((m) => {
		currentWeights[m.name] = m.startWeight;
	});

	let currentDate = new Date(startDate);
	let workoutIndex = 0;

	while (currentDate <= today) {
		const dayOfWeek = currentDate.getDay();
		const isWorkoutDay =
			dayOfWeek === 1 || // Monday
			dayOfWeek === 3 || // Wednesday
			dayOfWeek === 5 || // Friday
			(dayOfWeek === 6 && Math.random() > 0.5); // Sometimes Saturday

		if (isWorkoutDay) {
			const template = workoutTemplates[workoutIndex % workoutTemplates.length];
			workoutIndex++;

			const exercises: Exercise[] = [];
			const progressPercent = (currentDate.getTime() - startDate.getTime()) / (today.getTime() - startDate.getTime());

			for (const machineName of template.machines) {
				const machineInfo = machines.find((m) => m.name === machineName)!;
				const weight = currentWeights[machineName];

				const feeling = randomFeeling(progressPercent);

				exercises.push({
					id: generateId(),
					machine: machineName,
					category: machineInfo.category,
					weight: weight,
					sets: Math.random() > 0.3 ? 3 : 4,
					reps: [8, 10, 12][Math.floor(Math.random() * 3)],
					feeling: feeling
				});

				if (feeling === 'too_easy' && Math.random() > 0.3) {
					currentWeights[machineName] = weight + (weight >= 50 ? 5 : 2.5);
				} else if (feeling === 'too_hard' && Math.random() > 0.7) {
					currentWeights[machineName] = Math.max(machineInfo.startWeight, weight - 2.5);
				}
			}

			if (Math.random() > 0.6) {
				const coreWeight = currentWeights['Cable Crunch'];
				exercises.push({
					id: generateId(),
					machine: 'Cable Crunch',
					category: 'core',
					weight: coreWeight,
					sets: 3,
					reps: 15,
					feeling: randomFeeling(progressPercent)
				});
			}

			sessions.push({
				id: generateId(),
				date: currentDate.toISOString().split('T')[0],
				exercises
			});
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export function getMockDataStats(sessions: WorkoutSession[]) {
	const totalWorkouts = sessions.length;
	const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);
	const dateRange = sessions.length > 0
		? `${sessions[sessions.length - 1].date} to ${sessions[0].date}`
		: 'No data';

	return { totalWorkouts, totalExercises, dateRange };
}
