import {
  ArrowUpIcon,
  CircleNotchIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import Markdown from "react-markdown";
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
    const question = message.trim();
    try {
      const askRequest = await fetch("https://rahmenabkommen-gpt.ch/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, sessionId }),
      });
      const askResponse = await askRequest.json();
      setConversation((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: askResponse.answer },
      ]);
      setSessionId(askResponse.sessionId);
      setMessage("");
    } catch (error) {
      console.error("Error creating API key:", error);
      showToast("Etwas hat nicht funktioniert...", "error");
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {!conversation.length && (
        <div className="flex justify-center items-center w-full h-screen">
          <div className="fixed top-0 left-0 bg-gray-50 w-full h-12 flex items-center justify-end px-4">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
              >
                <img
                  src="public/github-mark.svg"
                  alt="GitHub Logo"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://x.com/NicolaRic2" target="_blank">
                <img src="public/x.png" alt="X Logo" className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-8 max-w-[48rem] w-11/12">
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
            <div className="text-gray-300 text-sm text-center">
              Stelle deine Fragen zum Rahmenabkommen. KI kann Fehler machen,
              bitte überprüfe die Antworten.
            </div>
          </div>
        </div>
      )}
      {conversation.length > 0 && (
        <div>
          <div className="flex items-center gap-2 p-4 fixed top-0 left-0 bg-gray-50 w-full h-12 justify-between">
            <div className="flex items-center gap-2">
              <img
                src="public/logo.png"
                alt="Logo"
                width="30px"
                height="30px"
              />
              <div className="text-gray-600 text-lg">Rahmenabkommen GPT</div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
              >
                <img
                  src="public/github-mark.svg"
                  alt="GitHub Logo"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://x.com/NicolaRic2" target="_blank">
                <img src="public/x.png" alt="X Logo" className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex flex-col gap-4 max-w-[48rem] w-11/12">
              <div className="p-4 rounded-lg space-y-4 pb-36 pt-14">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-gray-200 border-gray-800 self-end p-4"
                        : "text-gray-800 self-start p-4 w-full"
                    }`}
                  >
                    <div className="prose prose-neutral max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fixed left-0 bottom-0 flex justify-center bg-gray-50 items-center w-full">
                <div className="w-11/12 max-w-[48rem] h-32 p-2 pt-5 mb-4 bg-white border border-gray-300 rounded-3xl shadow-sm flex flex-col">
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
