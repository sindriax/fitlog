export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'sports';

export type Feeling = 'too_easy' | 'just_right' | 'too_hard';

export type Exercise = {
	id: string;
	machine: string;
	category: Category;
	weight: number;
	sets: number;
	reps: number;
	feeling: Feeling;
	notes?: string;
	cardio?: {
		minutes: number;
		speed: number;
		incline: number;
		calories: number;
	};
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
