// URL from .env
const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
const defaultImage = `${frontendUrl}/rich-preview.png`;

export function buildMeta({
  // Default meta content
  title = 'Rahmenabkommen GPT',
  description = 'Stelle deine Fragen zum Rahmenabkommen zwischen der Schweiz und der EU.',
  image = defaultImage,
  url = frontendUrl,
}: {
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
    { property: 'og:locale', content: 'de_DE' },

    /* Twitter */
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:creator', content: '@NicolaRic2' },
  ];
}
