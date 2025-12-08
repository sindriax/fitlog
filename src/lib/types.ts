export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'cardio';

export type Feeling = 'too_easy' | 'just_right' | 'too_hard';

export type Exercise = {
	id: string;
	machine: string;
	category: Category;
	weight: number; // For cardio: can represent incline, resistance level, or 0
	sets: number; // For cardio: can represent minutes
	reps: number; // For cardio: can represent distance (km) or calories
	feeling: Feeling;
	notes?: string;
};

export type WorkoutSession = {
	id: string;
	date: string;
	exercises: Exercise[];
};

export type TemplateExercise = {
	machine: string;
	category: Category;
	defaultWeight: number;
	defaultSets: number;
	defaultReps: number;
};

export type WorkoutTemplate = {
	id: string;
	name: string;
	exercises: TemplateExercise[];
	createdAt: string;
};
