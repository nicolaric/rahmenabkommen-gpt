import { ArrowUpIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useToast } from "~/lib/components/toast";
import { ThemeToggle } from "~/lib/components/ThemeToggle";

export const meta = () => {
    return [
        { charset: "utf-8" },
        {
            title:
                "Stelle deine Fragen an das Rahmenabkommen zwischen der Schweiz und der EU.",
        },
        {
            description: "",
        },
        { viewport: "width=device-width,initial-scale=1" },
    ];
};

export default function Index() {
    const { showToast } = useToast();

    const [isButtonLoading, setButtonLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [conversation, setConversation] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);
    const [conversationSessionId, setConversationSessionId] = useState<
        string | undefined
    >(undefined);

    const lastUserMessageRef = useRef<HTMLDivElement>(null);

    // Backend URL from .env
    const baseUrl = import.meta.env.VITE_API_URL;
    console.log(import.meta.env);

    // Scroll to the last user message when the conversation changes
    useEffect(() => {
        if (lastUserMessageRef.current) {
            const element = lastUserMessageRef.current;
            const y = element.getBoundingClientRect().top + window.scrollY - 56;

            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, [conversation]);

    const handleSendMessage = async () => {
        if (isButtonLoading) return;

        setButtonLoading(true);
        const question = message.trim();
        try {
            const askRequest = await fetch(`${baseUrl}/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question, session_id: conversationSessionId }),
            });
            const askResponse = await askRequest.json();
            setConversation((prev) => [
                ...prev,
                { role: "user", content: question },
                { role: "assistant", content: askResponse.answer },
            ]);
            setConversationSessionId(askResponse.session_id);
            setMessage("");
        } catch (error) {
            console.error("Error creating API key:", error);
            showToast("Etwas hat nicht funktioniert...", "error");
        } finally {
            setButtonLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen">
            {/* Hintergrundbild am unteren Rand, volle Breite, hinter allem */}
            {/*<div
                className="fixed bottom-0 left-0 w-full h-[60rem] bottom-[-24rem] bg-no-repeat bg-bottom bg-cover opacity-40"
                style={{ backgroundImage: `url('/back.webp')` }}
                aria-hidden="true"
            />*/}
            {!conversation.length && (
                <div className="flex justify-center items-center w-full h-screen z-10">
                    <div className="fixed top-0 left-0 w-full h-12 flex items-center justify-between px-4 sm:justify-end bg-gray-100 dark:bg-gray-900">
                        <div className="flex items-center gap-2  justify-center sm:hidden">
                            <img src="logo-colored.webp" alt="Logo" className="w-8 h-8" />
                            <div className="text-gray-700 dark:text-white text-2xl sm:text-3xl">
                                Rahmenabkommen GPT
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <a
                                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                                target="_blank"
                                className="p-2 rounded-full dark:bg-gray-800 hover:bg-neutral-300 dark:hover:bg-gray-700"
                            >
                                <img
                                    src="github-mark.svg"
                                    alt="GitHub Logo"
                                    className="h-6 w-6 transition dark:invert hover:brightness-125"
                                />
                            </a>
                            <a
                                href="https://x.com/NicolaRic2"
                                target="_blank"
                                className="p-2 rounded-full dark:bg-gray-800 hover:bg-neutral-300 dark:hover:bg-gray-700"
                            >
                                <img
                                    src="X.svg"
                                    alt="X Logo"
                                    className="h-6 w-6 transition hover:brightness-125 dark:invert"
                                />
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-col gap-8 max-w-[48rem] w-11/12 -mt-48">
                        <div className="flex items-center gap-6 flex-col justify-center mt-10 mb-6">
                            <div className="hidden items-center flex-col gap-2 md:gap-4 lg:gap-6 justify-center sm:flex">
                                <img
                                    src="logo-colored.webp"
                                    alt="Logo"
                                    className="w-8 h-8 lg:w-14 lg:h-14 md:w-10 md:h-10"
                                />
                                <div className="text-gray-700 dark:text-white text-2xl sm:text-3xl lg:text-6xl md:text-5xl">
                                    Rahmenabkommen GPT
                                </div>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-xl max-w-3xl text-center px-6">
                                Stellen Sie Ihre Frage zum neuen Rahmenabkommen zwischen der
                                Schweiz und der EU. Die Antworten sind sachlich, neutral und
                                basieren ausschliesslich auf den offiziellen Verträgen – ohne
                                Meinungen, Bewertungen oder Spekulationen.
                            </div>
                        </div>
                        <div className="h-32 p-2 pt-5 border border-gray-300 dark:border-gray-700 rounded-3xl shadow-sm flex flex-col mx-3">
                            <textarea
                                className="w-full flex-grow px-2 resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-700"
                                placeholder="Stelle deine Frage zum Rahmenabkommen..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            ></textarea>
                            <div className="flex self-end h-10">
                                <button
                                    className="w-10 h-10 rounded-full border-none opacity-100 bg-gray-800 flex items-center justify-center text-white text-2xl disabled:opacity-50 hover:scale-110 transition-transform duration-200"
                                    onClick={handleSendMessage}
                                    disabled={isButtonLoading || !message.trim()}
                                >
                                    {!isButtonLoading && <ArrowUpIcon />}
                                    {isButtonLoading && (
                                        <CircleNotchIcon className="animate-spin" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="text-gray-400 dark:text-gray-600 text-sm text-center">
                            KI kann Fehler machen, bitte überprüfe die Antworten.
                        </div>
                    </div>
                </div>
            )}
            {conversation.length > 0 && (
                <div>
                    <div className="relative z-50"></div>
                    <div className="flex items-center gap-2 p-4 fixed pt-6 bg-gray-100 dark:bg-gray-950 left-0 w-full h-12 justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-3 lg:gap-3">
                            <img
                                src="logo-colored.webp"
                                alt="Logo"
                                width="28px"
                                height="28px"
                            />
                            <div className="text-gray-700 dark:text-white text-lg sm:text-2xl lg:text-3xl md:text-4xl">
                                Rahmenabkommen GPT
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <a
                                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                                target="_blank"
                                className="p-2 rounded-full dark:bg-gray-800 hover:bg-neutral-300 dark:hover:bg-gray-700"
                            >
                                <img
                                    src="github-mark.svg"
                                    alt="GitHub Logo"
                                    className="h-6 w-6 transition hover:brightness-125 dark:invert"
                                />
                            </a>
                            <a
                                href="https://x.com/NicolaRic2"
                                target="_blank"
                                className="p-2 rounded-full dark:bg-gray-800 hover:bg-neutral-300 dark:hover:bg-gray-700"
                            >
                                <img
                                    src="X.svg"
                                    alt="X Logo"
                                    className="h-6 w-6 transition hover:brightness-125 dark:invert"
                                />
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="flex flex-col gap-4 max-w-[48rem] w-11/12">
                            <div className="p-4 rounded-lg space-y-4 pb-40 pt-24">
                                {conversation.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-lg p-4 ${msg.role === "user"
                                                ? "border-gray-800 self-end bg-gray-300 dark:bg-gray-900"
                                                : "self-start p-4 w-full"
                                            }`}
                                        ref={
                                            msg.role === "user" && index === conversation.length - 2
                                                ? lastUserMessageRef
                                                : undefined
                                        }
                                    >
                                        <div className="max-w-none text-gray-700 dark:text-white">
                                            <Markdown>{msg.content}</Markdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="fixed left-0 bottom-0 flex justify-center pb-4 items-center w-full bg-gray-100 dark:bg-gray-950">
                                <div className="w-11/12 max-w-[48rem] h-32 p-2 pt-5 rounded-3xl shadow-sm flex flex-col border border-gray-300 dark:border-gray-700">
                                    <textarea
                                        className="w-full flex-grow px-2 resize-none focus:outline-none"
                                        placeholder="Stelle deine Frage zum Rahmenabkommen..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    ></textarea>
                                    <div className="flex self-end h-10">
                                        <button
                                            className="w-10 h-10 rounded-full border-none bg-gray-800 flex items-center justify-center text-white text-2xl disabled:opacity-50 hover:scale-110 transition-transform duration-200"
                                            onClick={handleSendMessage}
                                            disabled={isButtonLoading || !message.trim()}
                                        >
                                            {!isButtonLoading && <ArrowUpIcon />}
                                            {isButtonLoading && (
                                                <CircleNotchIcon className="animate-spin" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
