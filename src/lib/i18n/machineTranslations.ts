// Machine name translations - data is stored in English, displayed in user's language
// Based on real gym machine names from Spanish gyms

export const machineTranslations: Record<string, { en: string; es: string }> = {
	// Legs
	'Leg Press': { en: 'Leg Press', es: 'Prensa de Piernas' },
	'Leg Curl': { en: 'Leg Curl', es: 'Flexión de Piernas Sentado' },
	'Leg Extension': { en: 'Leg Extension', es: 'Extensión de Piernas' },
	'Calf Raise': { en: 'Calf Raise', es: 'Elevación de Pantorrillas' },
	'Hip Abductor': { en: 'Hip Abductor', es: 'Muslo Exterior' },
	'Hip Adductor': { en: 'Hip Adductor', es: 'Muslo Interior' },
	'Hack Squat': { en: 'Hack Squat', es: 'Hack Squat' },
	'Glute Kickback': { en: 'Glute Kickback', es: 'Extensión de Glúteos' },
	'Squats': { en: 'Squats', es: 'Sentadillas' },
	'Lunges': { en: 'Lunges', es: 'Zancadas' },
	'Romanian Deadlift': { en: 'Romanian Deadlift', es: 'Peso Muerto Rumano' },
	'Bulgarian Split Squat': { en: 'Bulgarian Split Squat', es: 'Sentadilla Búlgara' },
	'Goblet Squat': { en: 'Goblet Squat', es: 'Sentadilla Goblet' },
	'Hip Thrust': { en: 'Hip Thrust', es: 'Hip Thrust' },
	'Deadlift': { en: 'Deadlift', es: 'Peso Muerto' },

	// Chest
	'Chest Press': { en: 'Chest Press', es: 'Prensa de Pecho Convergente' },
	'Incline Press': { en: 'Incline Press', es: 'Prensa Inclinada' },
	'Pec Fly': { en: 'Pec Fly', es: 'Aperturas de Pecho' },
	'Cable Crossover': { en: 'Cable Crossover', es: 'Cruce de Poleas' },
	'Decline Press': { en: 'Decline Press', es: 'Prensa Declinada' },
	'Dumbbell Bench Press': { en: 'Dumbbell Bench Press', es: 'Press de Banca con Mancuernas' },
	'Push-ups': { en: 'Push-ups', es: 'Flexiones' },

	// Back
	'Lat Pulldown': { en: 'Lat Pulldown', es: 'Dorsal en Polea Alta' },
	'Seated Row': { en: 'Seated Row', es: 'Remo Sentado' },
	'Cable Row': { en: 'Cable Row', es: 'Remo en Polea' },
	'Back Extension': { en: 'Back Extension', es: 'Extensión de Espalda' },
	'Assisted Pull-up': { en: 'Assisted Pull-up', es: 'Dominadas Asistidas' },
	'T-Bar Row': { en: 'T-Bar Row', es: 'Remo T-Bar' },
	'Pull-ups': { en: 'Pull-ups', es: 'Dominadas' },
	'Dumbbell Row': { en: 'Dumbbell Row', es: 'Remo con Mancuerna' },
	'Barbell Row': { en: 'Barbell Row', es: 'Remo con Barra' },
	'Chin-ups': { en: 'Chin-ups', es: 'Dominadas Supinas' },
	'Reverse Fly': { en: 'Reverse Fly', es: 'Aperturas Invertidas' },
	'Straight Arm Pulldown': { en: 'Straight Arm Pulldown', es: 'Pulldown Brazos Rectos' },

	// Shoulders
	'Shoulder Press': { en: 'Shoulder Press', es: 'Prensa de Hombros Convergente' },
	'Lateral Raise': { en: 'Lateral Raise', es: 'Elevaciones Laterales' },
	'Rear Delt Fly': { en: 'Rear Delt Fly', es: 'Aperturas Traseras' },
	'Face Pull': { en: 'Face Pull', es: 'Face Pull' },
	'Upright Row': { en: 'Upright Row', es: 'Remo al Mentón' },
	'Dumbbell Shoulder Press': { en: 'Dumbbell Shoulder Press', es: 'Press de Hombros con Mancuernas' },
	'Front Raise': { en: 'Front Raise', es: 'Elevaciones Frontales' },
	'Arnold Press': { en: 'Arnold Press', es: 'Press Arnold' },
	'Cable Lateral Raise': { en: 'Cable Lateral Raise', es: 'Elevación Lateral en Polea' },
	'Shrugs': { en: 'Shrugs', es: 'Encogimientos' },

	// Arms
	'Bicep Curl': { en: 'Bicep Curl', es: 'Curl de Bíceps' },
	'Tricep Pushdown': { en: 'Tricep Pushdown', es: 'Extensión de Tríceps en Polea' },
	'Tricep Extension': { en: 'Tricep Extension', es: 'Extensión de Tríceps' },
	'Preacher Curl': { en: 'Preacher Curl', es: 'Curl en Banco Scott' },
	'Cable Curl': { en: 'Cable Curl', es: 'Curl en Polea' },
	'Hammer Curl': { en: 'Hammer Curl', es: 'Curl Martillo' },
	'Dumbbell Curl': { en: 'Dumbbell Curl', es: 'Curl con Mancuernas' },
	'Tricep Dips': { en: 'Tricep Dips', es: 'Fondos de Tríceps' },
	'Skull Crushers': { en: 'Skull Crushers', es: 'Rompecráneos' },
	'Concentration Curl': { en: 'Concentration Curl', es: 'Curl Concentrado' },
	'Overhead Tricep Extension': { en: 'Overhead Tricep Extension', es: 'Extensión de Tríceps Sobre Cabeza' },
	'Close Grip Bench Press': { en: 'Close Grip Bench Press', es: 'Press de Banca Agarre Cerrado' },
	'EZ Bar Curl': { en: 'EZ Bar Curl', es: 'Curl con Barra Z' },

	// Core
	'Cable Crunch': { en: 'Cable Crunch', es: 'Crunch en Polea' },
	'Ab Machine': { en: 'Ab Machine', es: 'Máquina Abdominal' },
	'Torso Rotation': { en: 'Torso Rotation', es: 'Rotación de Torso' },
	'Hanging Leg Raise': { en: 'Hanging Leg Raise', es: 'Elevación de Piernas Colgado' },
	'Plank': { en: 'Plank', es: 'Plancha' },
	'Crunches': { en: 'Crunches', es: 'Abdominales' },
	'Russian Twist': { en: 'Russian Twist', es: 'Giro Ruso' },
	'Leg Raise': { en: 'Leg Raise', es: 'Elevación de Piernas' },
	'Mountain Climbers': { en: 'Mountain Climbers', es: 'Escaladores' },
	'Bicycle Crunches': { en: 'Bicycle Crunches', es: 'Abdominales Bicicleta' },
	'Dead Bug': { en: 'Dead Bug', es: 'Dead Bug' },
	'Wood Chop': { en: 'Wood Chop', es: 'Leñador' },

	// Cardio
	'Treadmill': { en: 'Treadmill', es: 'Cinta de Correr' },
	'Stationary Bike': { en: 'Stationary Bike', es: 'Bicicleta Estática' },
	'Elliptical': { en: 'Elliptical', es: 'Elíptica' },
	'Rowing Machine': { en: 'Rowing Machine', es: 'Máquina de Remo' },
	'Stair Climber': { en: 'Stair Climber', es: 'Escaladora' },
	'Spin Bike': { en: 'Spin Bike', es: 'Bicicleta de Spinning' },
	'Jump Rope': { en: 'Jump Rope', es: 'Saltar la Cuerda' },
	'Arc Trainer': { en: 'Arc Trainer', es: 'Arc Trainer' },
	'Ski Erg': { en: 'Ski Erg', es: 'Ski Erg' },
	'Assault Bike': { en: 'Assault Bike', es: 'Assault Bike' },

	// Free weights / General
	'Dumbbells': { en: 'Dumbbells', es: 'Mancuernas' },
	'Barbell': { en: 'Barbell', es: 'Barra' },
	'Kettlebell': { en: 'Kettlebell', es: 'Pesa Rusa' },
	'Smith Machine': { en: 'Smith Machine', es: 'Máquina Smith' },
	'Cable Machine': { en: 'Cable Machine', es: 'Máquina de Poleas' },

	// Sports
	'Swimming': { en: 'Swimming', es: 'Natación' },
	'Basketball': { en: 'Basketball', es: 'Baloncesto' },
	'Soccer': { en: 'Soccer', es: 'Fútbol' },
	'Tennis': { en: 'Tennis', es: 'Tenis' },
	'Padel': { en: 'Padel', es: 'Pádel' },
	'Volleyball': { en: 'Volleyball', es: 'Voleibol' },
	'Hiking': { en: 'Hiking', es: 'Senderismo' },
	'Yoga': { en: 'Yoga', es: 'Yoga' },
	'Pilates': { en: 'Pilates', es: 'Pilates' },
	'Boxing': { en: 'Boxing', es: 'Boxeo' },
	'Martial Arts': { en: 'Martial Arts', es: 'Artes Marciales' },
	'Dancing': { en: 'Dancing', es: 'Baile' },
	'Climbing': { en: 'Climbing', es: 'Escalada' },
	'Cycling': { en: 'Cycling', es: 'Ciclismo' }
};

// Get the display name for a machine in the current language
export function translateMachine(englishName: string, language: 'en' | 'es'): string {
	const translation = machineTranslations[englishName];
	if (translation) {
		return translation[language];
	}
	// If no translation exists (custom machine), return as-is
	return englishName;
}

// Reverse lookup: find English name from Spanish name (for search/input)
export function findEnglishName(displayName: string, language: 'en' | 'es'): string {
	if (language === 'en') return displayName;

	for (const [englishName, translations] of Object.entries(machineTranslations)) {
		if (translations.es.toLowerCase() === displayName.toLowerCase()) {
			return englishName;
		}
	}
	// If no match found, return as-is (custom machine)
	return displayName;
}
