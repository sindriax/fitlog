import type { Category } from './types';

export interface PresetMachine {
	name: string;
	category: Category;
	defaultWeight?: number;
}

export const presetMachines: Record<Category, PresetMachine[]> = {
	legs: [
		{ name: 'Leg Press', category: 'legs', defaultWeight: 60 },
		{ name: 'Leg Curl', category: 'legs', defaultWeight: 25 },
		{ name: 'Leg Extension', category: 'legs', defaultWeight: 30 },
		{ name: 'Calf Raise', category: 'legs', defaultWeight: 40 },
		{ name: 'Hip Abductor', category: 'legs', defaultWeight: 35 },
		{ name: 'Hip Adductor', category: 'legs', defaultWeight: 35 },
		{ name: 'Hack Squat', category: 'legs', defaultWeight: 40 },
		{ name: 'Glute Kickback', category: 'legs', defaultWeight: 20 },
		{ name: 'Squats', category: 'legs', defaultWeight: 20 },
		{ name: 'Lunges', category: 'legs', defaultWeight: 10 },
		{ name: 'Romanian Deadlift', category: 'legs', defaultWeight: 30 },
		{ name: 'Bulgarian Split Squat', category: 'legs', defaultWeight: 10 },
		{ name: 'Goblet Squat', category: 'legs', defaultWeight: 16 },
		{ name: 'Hip Thrust', category: 'legs', defaultWeight: 40 },
		{ name: 'Deadlift', category: 'legs', defaultWeight: 40 }
	],
	chest: [
		{ name: 'Chest Press', category: 'chest', defaultWeight: 30 },
		{ name: 'Incline Press', category: 'chest', defaultWeight: 25 },
		{ name: 'Pec Fly', category: 'chest', defaultWeight: 20 },
		{ name: 'Cable Crossover', category: 'chest', defaultWeight: 15 },
		{ name: 'Decline Press', category: 'chest', defaultWeight: 30 },
		{ name: 'Dumbbell Bench Press', category: 'chest', defaultWeight: 12 },
		{ name: 'Push-ups', category: 'chest', defaultWeight: 0 }
	],
	back: [
		{ name: 'Lat Pulldown', category: 'back', defaultWeight: 35 },
		{ name: 'Seated Row', category: 'back', defaultWeight: 40 },
		{ name: 'Cable Row', category: 'back', defaultWeight: 35 },
		{ name: 'Back Extension', category: 'back', defaultWeight: 0 },
		{ name: 'Assisted Pull-up', category: 'back', defaultWeight: 30 },
		{ name: 'T-Bar Row', category: 'back', defaultWeight: 20 },
		{ name: 'Pull-ups', category: 'back', defaultWeight: 0 },
		{ name: 'Dumbbell Row', category: 'back', defaultWeight: 12 },
		{ name: 'Barbell Row', category: 'back', defaultWeight: 30 },
		{ name: 'Chin-ups', category: 'back', defaultWeight: 0 },
		{ name: 'Reverse Fly', category: 'back', defaultWeight: 10 },
		{ name: 'Straight Arm Pulldown', category: 'back', defaultWeight: 20 }
	],
	shoulders: [
		{ name: 'Shoulder Press', category: 'shoulders', defaultWeight: 20 },
		{ name: 'Lateral Raise', category: 'shoulders', defaultWeight: 8 },
		{ name: 'Rear Delt Fly', category: 'shoulders', defaultWeight: 10 },
		{ name: 'Face Pull', category: 'shoulders', defaultWeight: 15 },
		{ name: 'Upright Row', category: 'shoulders', defaultWeight: 15 },
		{ name: 'Dumbbell Shoulder Press', category: 'shoulders', defaultWeight: 10 },
		{ name: 'Front Raise', category: 'shoulders', defaultWeight: 6 },
		{ name: 'Arnold Press', category: 'shoulders', defaultWeight: 10 },
		{ name: 'Cable Lateral Raise', category: 'shoulders', defaultWeight: 5 },
		{ name: 'Shrugs', category: 'shoulders', defaultWeight: 20 }
	],
	arms: [
		{ name: 'Bicep Curl', category: 'arms', defaultWeight: 10 },
		{ name: 'Tricep Pushdown', category: 'arms', defaultWeight: 20 },
		{ name: 'Tricep Extension', category: 'arms', defaultWeight: 15 },
		{ name: 'Preacher Curl', category: 'arms', defaultWeight: 15 },
		{ name: 'Cable Curl', category: 'arms', defaultWeight: 15 },
		{ name: 'Hammer Curl', category: 'arms', defaultWeight: 10 },
		{ name: 'Dumbbell Curl', category: 'arms', defaultWeight: 8 },
		{ name: 'Tricep Dips', category: 'arms', defaultWeight: 0 },
		{ name: 'Skull Crushers', category: 'arms', defaultWeight: 10 },
		{ name: 'Concentration Curl', category: 'arms', defaultWeight: 8 },
		{ name: 'Overhead Tricep Extension', category: 'arms', defaultWeight: 12 },
		{ name: 'Close Grip Bench Press', category: 'arms', defaultWeight: 25 },
		{ name: 'EZ Bar Curl', category: 'arms', defaultWeight: 15 }
	],
	core: [
		{ name: 'Cable Crunch', category: 'core', defaultWeight: 30 },
		{ name: 'Ab Machine', category: 'core', defaultWeight: 25 },
		{ name: 'Torso Rotation', category: 'core', defaultWeight: 20 },
		{ name: 'Hanging Leg Raise', category: 'core', defaultWeight: 0 },
		{ name: 'Plank', category: 'core', defaultWeight: 0 },
		{ name: 'Crunches', category: 'core', defaultWeight: 0 },
		{ name: 'Russian Twist', category: 'core', defaultWeight: 5 },
		{ name: 'Leg Raise', category: 'core', defaultWeight: 0 },
		{ name: 'Mountain Climbers', category: 'core', defaultWeight: 0 },
		{ name: 'Bicycle Crunches', category: 'core', defaultWeight: 0 },
		{ name: 'Dead Bug', category: 'core', defaultWeight: 0 },
		{ name: 'Wood Chop', category: 'core', defaultWeight: 10 }
	],
	cardio: [
		{ name: 'Treadmill', category: 'cardio' },
		{ name: 'Stationary Bike', category: 'cardio' },
		{ name: 'Elliptical', category: 'cardio' },
		{ name: 'Rowing Machine', category: 'cardio' },
		{ name: 'Stair Climber', category: 'cardio' },
		{ name: 'Spin Bike', category: 'cardio' },
		{ name: 'Jump Rope', category: 'cardio' },
		{ name: 'Arc Trainer', category: 'cardio' },
		{ name: 'Ski Erg', category: 'cardio' },
		{ name: 'Assault Bike', category: 'cardio' }
	],
	sports: [
		{ name: 'Swimming', category: 'sports' },
		{ name: 'Basketball', category: 'sports' },
		{ name: 'Soccer', category: 'sports' },
		{ name: 'Tennis', category: 'sports' },
		{ name: 'Padel', category: 'sports' },
		{ name: 'Volleyball', category: 'sports' },
		{ name: 'Hiking', category: 'sports' },
		{ name: 'Yoga', category: 'sports' },
		{ name: 'Pilates', category: 'sports' },
		{ name: 'Boxing', category: 'sports' },
		{ name: 'Martial Arts', category: 'sports' },
		{ name: 'Dancing', category: 'sports' },
		{ name: 'Climbing', category: 'sports' },
		{ name: 'Cycling', category: 'sports' }
	]
};

export const commonReps = [6, 8, 10, 12, 15, 20];
export const commonSets = [2, 3, 4, 5];
