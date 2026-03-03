import { Header } from '~/lib/components/header';

export default function ImpressumPage() {
    return (
        <div className="min-h-screen w-full">
            <Header />
            <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 font-sans">
                <h1 className="mb-6 text-3xl font-bold">Impressum</h1>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
                    <div className="space-y-4 text-gray-600 dark:text-gray-400">
                        <p>
                            <strong>Betreiber der Webseite:</strong><br />
                            Nicola Richli<br />
                            Unterdorf 7b<br />
                            5073 Gipf-Oberfrick<br />
                            Schweiz
                        </p>
                        <p>
                            <strong>Kontakt:</strong><br />
                            X: <a href="https://x.com/NicolaRic2" className="text-blue-500 hover:underline">@NicolaRic2</a><br />
                        </p>
                        <p>
                            <strong>Haftungsausschluss:</strong><br />
                            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschliesslich deren Betreiber verantwortlich.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
