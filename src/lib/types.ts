export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'sports';

export type Progression = 'up' | 'stay' | 'down';

export type Exercise = {
	id: string;
	machine: string;
	category: Category;
	weight: number;
	sets: number;
	reps: number;
	next: Progression;
	notes?: string;
	cardio?: {
		minutes: number;
		speed: number;
		incline: number;
		calories: number;
		distance?: number;
	};
};

export type WorkoutSession = {
	id: string;
	date: string;
	exercises: Exercise[];
	duration?: number;
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
