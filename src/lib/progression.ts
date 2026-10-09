import type { Exercise } from './types';

const DEFAULT_STEP = 2.5;

// Machines move in their own increments, so learn the step from past weight changes.
export function weightStep(weights: number[]): number {
	let step = Infinity;
	for (let i = 1; i < weights.length; i++) {
		const diff = Math.abs(weights[i] - weights[i - 1]);
		if (diff > 0) step = Math.min(step, diff);
	}
	return step === Infinity ? DEFAULT_STEP : Math.round(step * 100) / 100;
}

export function nextWeight(last: Pick<Exercise, 'weight' | 'next'>, step: number): number {
	if (last.next === 'up') return last.weight + step;
	if (last.next === 'down') return Math.max(0, last.weight - step);
	return last.weight;
}

export function isTimed(exercise: Pick<Exercise, 'category'>): boolean {
	return exercise.category === 'cardio' || exercise.category === 'sports';
}

export function summarize(exercise: Exercise): string {
	if (isTimed(exercise) && exercise.cardio) {
		const { minutes, incline, speed, calories, distance } = exercise.cardio;
		const parts = [`${minutes} min`];
		if (exercise.category === 'cardio') {
			if (incline) parts.push(`${incline}%`);
			if (speed) parts.push(`${speed} km/h`);
			if (distance) parts.push(`${distance} km`);
			if (calories) parts.push(`${calories} kcal`);
		}
		return parts.join(' · ');
	}
	return `${exercise.sets}×${exercise.reps} · ${exercise.weight} kg`;
}
