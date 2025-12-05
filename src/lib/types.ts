export type Category = 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core';

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
};

export type WorkoutSession = {
	id: string;
	date: string;
	exercises: Exercise[];
};
