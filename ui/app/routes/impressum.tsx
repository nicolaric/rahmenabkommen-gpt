import { useTranslation } from 'react-i18next';
import { Header } from '../lib/components/header';

export default function ImpressumPage() {
    const { t } = useTranslation('help');

    return (
        <div className="min-h-screen w-full">
            <Header />
            <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 font-sans">
                <h1 className="mb-6 text-3xl font-bold">{t('impressum.title')}</h1>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
                    <div className="space-y-4 text-gray-600 dark:text-gray-400">
                        <p>
                            <strong>{t('impressum.operator')}</strong><br />
                            Nicola Richli<br />
                            Unterdorf 7b<br />
                            5073 Gipf-Oberfrick<br />
                            {t('impressum.country')}
                        </p>
                        <p>
                            <strong>{t('impressum.contact')}</strong><br />
                            X: <a href="https://x.com/NicolaRic2" className="text-blue-500 hover:underline">@NicolaRic2</a><br />
                        </p>
                        <p>
                            <strong>{t('impressum.disclaimer')}</strong><br />
                            {t('impressum.disclaimerText')}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
