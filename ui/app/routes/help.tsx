import { Header } from '~/lib/components/header';

export default function Help() {
    return (
        <div className="min-h-screen w-full">
            <Header />
            <section className="mx-auto max-w-3xl px-4 pb-8 pt-20 mt-8 font-sans leading-relaxed">
                <h1 className="mb-6 text-3xl font-bold">Über Rahmenabkommen GPT</h1>

                <p className="mb-4">
                    <strong>Rahmenabkommen GPT</strong> ist ein{' '}
                    <strong>Open-Source-Projekt</strong> mit einem klaren Ziel: Es soll
                    einfacher werden, sich mit dem komplexen und oft schwer zugänglichen
                    Text des Rahmenabkommens auseinanderzusetzen.
                </p>

                <p className="mb-4">
                    Die Anwendung basiert{' '}
                    <strong>ausschließlich auf dem offiziellen Vertragstext</strong> und
                    hilft dabei, die über <strong>1900 Seiten</strong> besser zu verstehen
                    – indem sie strukturierte, verständliche Antworten auf Fragen zum
                    Inhalt liefert.
                </p>

                <p className="mb-4">
                    Unser Ziel ist es, damit einen Beitrag zur{' '}
                    <strong>Stärkung der Demokratie</strong> zu leisten: Wer informiert
                    ist, kann mitreden und mitentscheiden. Rahmenabkommen GPT möchte
                    Hürden abbauen und politische Teilhabe fördern.
                </p>

                <p className="mb-4">
                    Das Projekt wird aktuell von <strong>Nicola Richli</strong> und{' '}
                    <strong>Michael Gasche</strong> entwickelt und
                    <strong> kontinuierlich weiterentwickelt</strong>.
                </p>

                <p className="mb-4">
                    <strong>Fehler gefunden? Eine Idee zur Verbesserung?</strong> Wir
                    freuen uns über Rückmeldungen!
                </p>

                <p>
                    Der Quellcode ist öffentlich zugänglich –{' '}
                    <a
                        href="https://github.com/nicolaric/rahmenabkommen-gpt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        mitmachen ist erwünscht
                    </a>
                    .
                </p>

                {/* Entwickler-Section */}
                <div className="mt-12 border-t pt-6">
                    <h2 className="mb-4 text-2xl font-semibold">Entwickler</h2>
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
                                    alt="X Icon für Nicola Richli"
                                    className="h-5 w-5 dark:invert"
                                />
                                Nicola Richli
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
                                    alt="X Icon für Michael Gasche"
                                    className="h-5 w-5 dark:invert"
                                />
                                Michael Gasche
                            </a>
                        </div>
                    </div>
                </div>
                {/* Source Code-Section */}
                <div className="mt-12 border-t pt-6">
                    <h2 className="mb-4 text-2xl font-semibold">Source Code</h2>
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
                                rahmenabkommen-gpt auf GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
