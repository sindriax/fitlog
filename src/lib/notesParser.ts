import type { Category, Exercise, Progression, TemplateExercise, WorkoutSession } from './types';
import { generateId } from './utils';
import { toDateKey } from './dates';

export type ParsedNotes = {
	workouts: WorkoutSession[];
	routines: { name: string; exercises: TemplateExercise[] }[];
	unreadable: string[];
};

type Entry = Omit<Exercise, 'id' | 'machine' | 'category'> & { date: string | null };

const MONTHS: Record<string, number> = {
	jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5,
	jul: 6, aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11
};

const CATEGORY_WORDS: [Category, RegExp][] = [
	['cardio', /correr|cinta|bici|el[ií]ptica|remo erg|treadmill|run|bike|cardio/],
	['core', /abdom|core|crunch|plancha|plank/],
	['shoulders', /hombro|shoulder|lateral|deltoid/],
	['chest', /pecho|chest|bench|banca|pec\b|aperturas/],
	['arms', /b[ií]ceps|tr[ií]ceps|curl|arm|brazo/],
	['back', /dorsal|remo|espalda|lat\b|pulldown|row|back|jal[oó]n/],
	['legs', /pierna|muslo|gl[uú]te|gemelo|cuádriceps|cuadriceps|leg|hip|squat|sentadilla|abductor|aductor|calf/]
];

function guessCategory(name: string, section: string): Category {
	const lower = name.toLowerCase();
	for (const [category, words] of CATEGORY_WORDS) {
		if (words.test(lower)) return category;
	}
	return /lower|pierna|leg/i.test(section) ? 'legs' : 'back';
}

function parseDate(text: string, today: Date): string | null {
	const candidates = [
		...[...text.matchAll(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi)].map((m) => [m[1], m[2]]),
		...[...text.matchAll(/\b(\d{1,2})\s+(?:de\s+)?([a-z]{3})[a-z]*\b/gi)].map((m) => [m[2], m[1]])
	];
	for (const [monthText, dayText] of candidates) {
		const month = MONTHS[monthText.toLowerCase()];
		if (month === undefined) continue;
		const date = new Date(today.getFullYear(), month, Number(dayText));
		if (date > today) date.setFullYear(date.getFullYear() - 1);
		return toDateKey(date);
	}
	return null;
}

function parseProgression(text: string): Progression {
	if (/\b(up|subir|sube|m[aá]s)\b/i.test(text)) return 'up';
	if (/\b(down|bajar|baja|menos)\b/i.test(text)) return 'down';
	return 'stay';
}

const num = (value: string) => Number(value.replace(',', '.'));

function parseEntry(line: string, today: Date): Entry | null {
	const date = parseDate(line, today);
	const next = parseProgression(line);

	const strength = line.match(/(\d+)\s*[x×]\s*(\d+)\s+([\d.,]+)\s*kg/i);
	if (strength) {
		return { date, next, sets: num(strength[1]), reps: num(strength[2]), weight: num(strength[3]) };
	}

	const minutes = line.match(/(\d+)\s*min/i);
	if (minutes) {
		const pick = (re: RegExp) => num(line.match(re)?.[1] ?? '0');
		return {
			date,
			next,
			sets: 0,
			reps: 0,
			weight: 0,
			cardio: {
				minutes: num(minutes[1]),
				incline: pick(/([\d.,]+)\s*(?:incline|inclinaci[oó]n|%)/i),
				speed: pick(/(?:incline|inclinaci[oó]n|%)\s*x\s*([\d.,]+)/i) || pick(/([\d.,]+)\s*km\/h/i),
				calories: pick(/([\d.,]+)\s*(?:cal|kcal)/i),
				distance: pick(/([\d.,]+)\s*km\b(?!\/)/i) || undefined
			}
		};
	}
	return null;
}

const looksLikeEntry = (line: string) => /^\d/.test(line);

// Notes look like: optional section name, then blocks of "exercise name" followed by one line per session.
export function parseNotes(text: string, today = new Date()): ParsedNotes {
	const sections: { name: string; exercises: { name: string; lines: string[] }[] }[] = [];
	let section = { name: '', exercises: [] as { name: string; lines: string[] }[] };
	sections.push(section);

	const blocks = text
		.split(/\n\s*\n/)
		.map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
		.filter((lines) => lines.length > 0);

	for (let lines of blocks) {
		const startsSection = !looksLikeEntry(lines[0]) && (lines.length === 1 || !looksLikeEntry(lines[1]));
		if (startsSection) {
			section = { name: lines[0], exercises: [] };
			sections.push(section);
			lines = lines.slice(1);
			if (lines.length === 0) continue;
		}
		const [name, ...entryLines] = looksLikeEntry(lines[0]) ? ['', ...lines] : lines;
		section.exercises.push({ name, lines: entryLines });
	}

	const sessions = new Map<string, WorkoutSession>();
	const routines: ParsedNotes['routines'] = [];
	const unreadable: string[] = [];

	for (const [index, { name: sectionName, exercises }] of sections.entries()) {
		if (exercises.length === 0) continue;

		const parsed = exercises.map((e) => ({
			...e,
			category: guessCategory(e.name, sectionName),
			entries: e.lines.map((line) => ({ line, entry: parseEntry(line, today) }))
		}));

		const sectionDates = [
			...new Set(parsed.flatMap((e) => e.entries.map((x) => x.entry?.date).filter((d): d is string => !!d)))
		].sort();

		const routineExercises: TemplateExercise[] = [];

		for (const exercise of parsed) {
			const readable = exercise.entries.filter((x) => x.entry);
			for (const { line, entry } of exercise.entries) {
				if (!entry || !exercise.name) unreadable.push(exercise.name ? `${exercise.name}: ${line}` : line);
			}
			if (!exercise.name || readable.length === 0) continue;

			// Undated lines line up with the section's latest sessions, since notes grow at the bottom.
			readable.forEach(({ entry }, i) => {
				const { date: ownDate, ...fields } = entry!;
				const date = ownDate ?? sectionDates[sectionDates.length - readable.length + i] ?? sectionDates[0] ?? toDateKey(today);
				const session = sessions.get(date) ?? { id: generateId(), date, exercises: [] };
				session.exercises.push({ id: generateId(), machine: exercise.name, category: exercise.category, ...fields });
				sessions.set(date, session);
			});

			const latest = readable[readable.length - 1].entry!;
			routineExercises.push({
				machine: exercise.name,
				category: exercise.category,
				defaultWeight: latest.weight,
				defaultSets: latest.sets,
				defaultReps: latest.reps
			});
		}

		if (routineExercises.length > 0) {
			routines.push({ name: sectionName || `Routine ${index + 1}`, exercises: routineExercises });
		}
	}

	return {
		workouts: [...sessions.values()].sort((a, b) => b.date.localeCompare(a.date)),
		routines,
		unreadable
	};
}
