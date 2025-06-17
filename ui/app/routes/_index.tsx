import { ArrowUpIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useToast } from "~/lib/components/toast";

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
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const [conversation, setConversation] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);

    const handleSendMessage = async () => {
        if (isButtonLoading) return;

        setButtonLoading(true);
        const newMessage = message.trim();
        try {
            const askRequest = await fetch("https://rahmenabkommen-gpt/api/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: newMessage, sessionId }),
            });
            const askResponse = await askRequest.json();
            setConversation((prev) => [
                ...prev,
                { role: "user", content: newMessage },
                { role: "assistant", content: askResponse.answer },
            ]);
            setSessionId(askResponse.sessionId);
        } catch (error) {
            console.error("Error creating API key:", error);
            showToast("Etwas hat nicht funktioniert...", "error");
        } finally {
            setButtonLoading(false);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-50">
            {!conversation.length && (
                <div className="flex justify-center items-center w-full h-full">
                    <div className="flex flex-col gap-8 max-w-[48rem] w-10/12">
                        <div className="flex items-center gap-4 justify-center">
                            <img
                                src="public/logo.png"
                                alt="Logo"
                                width="50px"
                                height="50px"
                            />
                            <div className="text-gray-600 text-2xl">Rahmenabkommen GPT</div>
                        </div>
                        <div className="w-full h-32 p-2 pt-5 bg-white border border-gray-300 rounded-3xl shadow-sm flex flex-col">
                            <textarea
                                className="w-full flex-grow px-2 resize-none focus:outline-none"
                                placeholder="Stelle deine Frage zum Rahmenabkommen..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                            <div className="flex self-end h-10">
                                <button
                                    className="w-10 h-10 rounded-full border-none opacity-100 bg-gray-800 flex items-center justify-center text-white text-2xl disabled:opacity-50 hover:scale-110 transition-transform duration-200"
                                    onClick={handleSendMessage}
                                    disabled={isButtonLoading || !message.trim()}
                                >
                                    <ArrowUpIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {conversation.length > 0 && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="flex flex-col gap-4 max-w-[48rem] w-10/12">
                        <div className="flex items-center gap-4 justify-center">
                            <img
                                src="public/logo.png"
                                alt="Logo"
                                width="50px"
                                height="50px"
                            />
                            <div className="text-gray-600 text-2xl">Rahmenabkommen GPT</div>
                        </div>
                        <div className="w-full h-32 p-2 pt-5 bg-white border border-gray-300 rounded-3xl shadow-sm flex flex-col">
                            <textarea
                                className="w-full flex-grow px-2 resize-none focus:outline-none"
                                placeholder="Stelle deine Frage zum Rahmenabkommen..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                            <div className="flex self-end h-10">
                                <button
                                    className="w-10 h-10 rounded-full border-none bg-gray-800 flex items-center justify-center text-white text-2xl disabled:opacity-50 hover:scale-110 transition-transform duration-200"
                                    onClick={handleSendMessage}
                                    disabled={isButtonLoading || !message.trim()}
                                >
                                    <ArrowUpIcon />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                            {conversation.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded-lg ${msg.role === "user"
                                            ? "bg-blue-100 text-blue-800 self-end"
                                            : "bg-gray-100 text-gray-800 self-start"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
