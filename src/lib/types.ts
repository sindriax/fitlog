export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core';

export type Feeling = 'too_easy' | 'just_right' | 'too_hard';

export type Exercise = {
	id: string;
	machine: string;
	weight: number;
	sets: number;
	reps: number;
	feeling: Feeling;
	notes?: string;
};

export type WorkoutSession = {
	id: string;
	date: string;
	category: Category;
	exercises: Exercise[];
};
