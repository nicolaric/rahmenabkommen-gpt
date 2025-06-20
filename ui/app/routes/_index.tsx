import { ArrowUpIcon, CircleNotchIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { useToast } from '~/lib/components/toast';

export const meta = () => {
  return [
    { charset: 'utf-8' },
    {
      title:
        'Stelle deine Fragen an das Rahmenabkommen zwischen der Schweiz und der EU.',
    },
    {
      description: '',
    },
    { viewport: 'width=device-width,initial-scale=1' },
  ];
};

export default function Index() {
  const { showToast } = useToast();

  const [isButtonLoading, setButtonLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<
    { role: 'user' | 'assistant'; content: string }[]
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

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSendMessage = async () => {
    if (isButtonLoading) return;

    setButtonLoading(true);
    const question = message.trim();
    try {
      const askRequest = await fetch(`${baseUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, session_id: conversationSessionId }),
      });
      const askResponse = await askRequest.json();
      setConversationSessionId(askResponse.session_id);
      setMessage('');
      setConversation((prev) => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: askResponse.answer },
      ]);
    } catch (error) {
      console.error('Error creating API key:', error);
      showToast('Etwas hat nicht funktioniert...', 'error');
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {!conversation.length && (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="fixed left-0 top-0 flex h-12 w-full items-center justify-end bg-gray-50 px-4">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
              >
                <img
                  src="github-mark.svg"
                  alt="GitHub Logo"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://x.com/NicolaRic2" target="_blank">
                <img src="x.png" alt="X Logo" className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="flex w-11/12 max-w-[48rem] flex-col gap-8">
            <div className="flex items-center justify-center gap-4">
              <img src="logo.png" alt="Logo" width="50px" height="50px" />
              <div className="text-2xl text-gray-600">Rahmenabkommen GPT</div>
            </div>
            <div className="flex h-32 w-full flex-col rounded-3xl border border-gray-300 bg-white p-2 pt-5 shadow-sm">
              <textarea
                className="w-full flex-grow resize-none bg-white px-2 focus:outline-none"
                placeholder="Stelle deine Frage zum Rahmenabkommen..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              ></textarea>
              <div className="flex h-10 self-end">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-gray-800 text-2xl text-white opacity-100 transition-transform duration-200 hover:scale-110 disabled:opacity-50"
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
            <div className="text-center text-sm text-gray-300">
              KI kann Fehler machen, bitte überprüfe die Antworten.
            </div>
          </div>
        </div>
      )}
      {conversation.length > 0 && (
        <div>
          <div className="fixed left-0 top-0 flex h-12 w-full items-center justify-between gap-2 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <img src="logo.png" alt="Logo" width="30px" height="30px" />
              <div className="text-lg text-gray-600">Rahmenabkommen GPT</div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
              >
                <img
                  src="github-mark.svg"
                  alt="GitHub Logo"
                  className="h-6 w-6"
                />
              </a>
              <a href="https://x.com/NicolaRic2" target="_blank">
                <img src="x.png" alt="X Logo" className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="flex w-11/12 max-w-[48rem] flex-col gap-4">
              <div className="space-y-4 rounded-lg p-4 pb-36 pt-14">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-2 ${
                      msg.role === 'user'
                        ? 'self-end border-gray-800 bg-gray-200 p-4'
                        : 'w-full self-start p-4 text-gray-800'
                    }`}
                    ref={
                      msg.role === 'user' && index === conversation.length - 2
                        ? lastUserMessageRef
                        : undefined
                    }
                  >
                    <div className="prose prose-neutral max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fixed bottom-0 left-0 flex w-full items-center justify-center bg-gray-50">
                <div className="mb-4 flex h-32 w-11/12 max-w-[48rem] flex-col rounded-3xl border border-gray-300 bg-white p-2 pt-5 shadow-sm">
                  <textarea
                    className="w-full flex-grow resize-none bg-white px-2 focus:outline-none"
                    placeholder="Stelle deine Frage zum Rahmenabkommen..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  ></textarea>
                  <div className="flex h-10 self-end">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-gray-800 text-2xl text-white transition-transform duration-200 hover:scale-110 disabled:opacity-50"
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
