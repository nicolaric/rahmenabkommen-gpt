import { fallbackLanguage, type Language } from '../locales/languages';

// URL from .env
const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
const defaultImage = `${frontendUrl}/rich-preview.png`;

// Meta functions can't use the i18next instance, so these live here
const localized = {
  de: {
    ogLocale: 'de_DE',
    description: 'Stelle deine Fragen zum Paket Schweiz-EU.',
    defaultQuestion: 'Frage zum Paket Schweiz-EU',
  },
  fr: {
    ogLocale: 'fr_FR',
    description: 'Pose tes questions sur le paquet Suisse-UE.',
    defaultQuestion: 'Question sur le paquet Suisse-UE',
  },
  it: {
    ogLocale: 'it_IT',
    description: 'Fai le tue domande sul pacchetto Svizzera-UE.',
    defaultQuestion: 'Domanda sul pacchetto Svizzera-UE',
  },
} satisfies Record<Language, Record<string, string>>;

export function getDefaultQuestion(locale: Language = fallbackLanguage) {
  return localized[locale].defaultQuestion;
}

export function buildMeta({
  locale = fallbackLanguage,
  // Default meta content
  title = 'Rahmenabkommen GPT',
  description = localized[locale].description,
  image = defaultImage,
  url = frontendUrl,
}: {
  locale?: Language;
  // Optional meta content overrides
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  return [
    { charset: 'utf-8' },
    { title },
    { name: 'description', content: description },

    /* Open Graph / Facebook / LinkedIn */
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: frontendUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: localized[locale].ogLocale },

    /* Twitter */
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:creator', content: '@NicolaRic2' },
  ];
}
