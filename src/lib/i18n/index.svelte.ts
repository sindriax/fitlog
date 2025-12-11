import { browser } from '$app/environment';
import { translations, type Language, type TranslationKey } from './translations';
import { translateMachine } from './machineTranslations';

const STORAGE_KEY = 'fitlog_language';

function getInitialLanguage(): Language {
	if (!browser) return 'en';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'en' || stored === 'es') return stored;
	const browserLang = navigator.language.slice(0, 2);
	return browserLang === 'es' ? 'es' : 'en';
}

export type I18nStore = {
	readonly language: Language;
	readonly isSpanish: boolean;
	setLanguage(lang: Language): void;
	toggle(): void;
	t(key: TranslationKey): string;
	machine(englishName: string): string;
};

function createI18nStore(): I18nStore {
	let language = $state<Language>(getInitialLanguage());

	return {
		get language() {
			return language;
		},
		get isSpanish() {
			return language === 'es';
		},
		setLanguage(lang: Language) {
			language = lang;
			if (browser) {
				localStorage.setItem(STORAGE_KEY, lang);
			}
		},
		toggle() {
			const newLang = language === 'en' ? 'es' : 'en';
			this.setLanguage(newLang);
		},
		t(key: TranslationKey): string {
			return translations[language][key] || translations.en[key] || key;
		},
		machine(englishName: string): string {
			return translateMachine(englishName, language);
		}
	};
}

export const i18n: I18nStore = createI18nStore();

export function t(key: TranslationKey): string {
	return i18n.t(key);
}

export function tm(englishName: string): string {
	return i18n.machine(englishName);
}

const categoryTranslationMap: Record<string, TranslationKey> = {
	legs: 'legs',
	back: 'back_category',
	chest: 'chest',
	shoulders: 'shoulders',
	arms: 'arms',
	core: 'core',
	cardio: 'cardio',
	sports: 'sports'
};

export function getCategoryTranslation(category: string): string {
	const key = categoryTranslationMap[category];
	return key ? i18n.t(key) : category;
}
