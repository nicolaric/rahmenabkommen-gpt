import { Trans, useTranslation } from 'react-i18next';
import { Header } from '../lib/components/header';

const strong = <strong />;

export default function Help() {
  const { t } = useTranslation('help');

  return (
    <div className="min-h-screen w-full">
      <Header />
      <section className="mx-auto mt-8 max-w-3xl px-4 pb-8 pt-20 font-sans leading-relaxed">
        <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>

        <p className="mb-4">
          <Trans t={t} i18nKey="intro" components={{ strong }} />
        </p>

        <p className="mb-4">
          <Trans
            t={t}
            i18nKey="basis"
            components={{
              strong,
              link: (
                <a
                  href="https://www.europa.eda.admin.ch/de/vernehmlassung-paket-schweiz-eu"
                  className="underline"
                />
              ),
            }}
          />
        </p>

        <p className="mb-4">
          <Trans t={t} i18nKey="democracy" components={{ strong }} />
        </p>

        <p className="mb-4">
          <Trans t={t} i18nKey="team" components={{ strong }} />
        </p>

        <p className="mb-4">
          <Trans t={t} i18nKey="feedback" components={{ strong }} />
        </p>

        <p>
          <Trans
            t={t}
            i18nKey="contribute"
            components={{
              link: (
                <a
                  href="https://github.com/nicolaric/rahmenabkommen-gpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                />
              ),
            }}
          />
        </p>

        {/* Entwickler-Section */}
        <div className="mt-12 border-t pt-6">
          <h2 className="mb-4 text-2xl font-semibold">{t('developers')}</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <a
                href="https://x.com/NicolaRic2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-800 hover:underline dark:text-gray-200"
              >
                <img
                  src="/X.svg"
                  alt={t('xIconFor', { name: 'Nicola Richli' })}
                  className="h-5 w-5 dark:invert"
                />
                Nicola Richli ({t('projectLead')})
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="https://x.com/MikeGasche"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-800 hover:underline dark:text-gray-200"
              >
                <img
                  src="/X.svg"
                  alt={t('xIconFor', { name: 'Michael Gasche' })}
                  className="h-5 w-5 dark:invert"
                />
                Michael Gasche
              </a>
            </div>
          </div>
        </div>
        {/* Source Code-Section */}
        <div className="mt-12 border-t pt-6">
          <h2 className="mb-4 text-2xl font-semibold">{t('sourceCode')}</h2>
          <div className="space-y-4">
            <div className="mb-8 flex items-center space-x-6">
              {/* GitHub */}
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-800 hover:underline dark:text-gray-200"
                title="GitHub"
              >
                <img
                  src="/github-mark.svg"
                  alt="GitHub Icon"
                  className="h-6 w-6 dark:invert"
                />
                {t('onGitHub')}
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-6">
          <div className="space-y-4">
            <a
              href="/impressum"
              className="text-gray-800 hover:underline dark:text-gray-200"
            >
              {t('impressum.title')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
