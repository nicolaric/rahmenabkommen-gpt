// Kept apart from ./index so the client bundle doesn't pull in every locale
export const languages = ['de', 'fr', 'it'] as const;
export type Language = (typeof languages)[number];
export const fallbackLanguage: Language = 'de';

export function toLanguage(value: string | null | undefined): Language {
  return languages.find((language) => language === value) ?? fallbackLanguage;
}
