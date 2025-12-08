export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'cardio';

export type Feeling = 'too_easy' | 'just_right' | 'too_hard';

export type Exercise = {
	id: string;
	machine: string;
	category: Category;
	weight: number; // For weight training: kg. For cardio: not used (0)
	sets: number; // For weight training: number of sets. For cardio: not used (0)
	reps: number; // For weight training: number of reps. For cardio: not used (0)
	feeling: Feeling;
	notes?: string;
	// Cardio-specific fields (optional, only for cardio exercises)
	cardio?: {
		minutes: number;
		speed: number; // km/h or pace
		incline: number; // percentage or level
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
