import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import {
  ArrowUpIcon,
  CircleNotchIcon,
  ShareNetworkIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { shareConversation } from '~/lib/api/conversation';
import { ThemeToggle } from '~/lib/components/ThemeToggle';
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
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );

  const lastUserMessageRef = useRef<HTMLDivElement>(null);

  // Backend URL from .env
  const baseUrl = import.meta.env.VITE_API_URL;

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

  const handleOpenShareDialog = async () => {
    if (!conversationSessionId) {
      showToast('Keine Konversation zum Teilen gefunden.', 'error');
      return;
    }
    setSharingLoading(true);
    const sharing = await shareConversation({
      sessionId: conversationSessionId,
    });
    if (!sharing) {
      showToast('Fehler beim Teilen der Konversation.', 'error');
      setSharingLoading(false);
      return;
    }
    setConversationId(sharing.id);
    setShareDialogOpen(true);
    setSharingLoading(false);
  };

  return (
    <div className="min-h-screen w-full">
      {/* Hintergrundbild am unteren Rand, volle Breite, hinter allem */}
      {/*<div
                className="fixed bottom-0 left-0 w-full h-[60rem] bottom-[-24rem] bg-no-repeat bg-bottom bg-cover opacity-40"
                style={{ backgroundImage: `url('/back.webp')` }}
                aria-hidden="true"
            />*/}
      {!conversation.length && (
        <div className="z-10 flex h-screen w-full items-center justify-center">
          <div className="fixed left-0 top-0 flex h-12 w-full items-center justify-between bg-gray-100 px-4 dark:bg-gray-900 sm:justify-end">
            <div className="flex items-center justify-center gap-2 sm:hidden">
              <img src="logo-colored.webp" alt="Logo" className="h-8 w-8" />
              <div className="text-2xl text-gray-700 dark:text-white sm:text-3xl">
                Rahmenabkommen GPT
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="https://github.com/nicolaric/rahmenabkommen-gpt"
                target="_blank"
                className="rounded-full p-2 hover:bg-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700"
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
                className="rounded-full p-2 hover:bg-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <img
                  src="X.svg"
                  alt="X Logo"
                  className="h-6 w-6 transition hover:brightness-125 dark:invert"
                />
              </a>
            </div>
          </div>
          <div className="-mt-48 flex w-11/12 max-w-[48rem] flex-col gap-8">
            <div className="mb-6 mt-10 flex flex-col items-center justify-center gap-6">
              <div className="hidden items-center justify-center gap-2 sm:flex md:gap-4 lg:gap-6">
                <img
                  src="logo-colored.webp"
                  alt="Logo"
                  className="h-8 w-8 md:h-10 md:w-10 lg:h-14 lg:w-14"
                />
                <div className="text-2xl text-gray-700 dark:text-white sm:text-3xl md:text-5xl lg:text-6xl">
                  Rahmenabkommen GPT
                </div>
              </div>
              <div className="max-w-3xl px-6 text-center text-xl text-gray-600 dark:text-gray-400">
                Stellen Sie Ihre Frage zum neuen Rahmenabkommen zwischen der
                Schweiz und der EU. Die Antworten sind sachlich, neutral und
                basieren ausschliesslich auf den offiziellen Verträgen – ohne
                Meinungen, Bewertungen oder Spekulationen.
              </div>
            </div>
            <div className="mx-3 flex h-32 flex-col rounded-3xl border border-gray-300 p-2 pt-5 shadow-sm dark:border-gray-700">
              <textarea
                className="w-full flex-grow resize-none px-2 placeholder-gray-400 focus:outline-none dark:placeholder-gray-700"
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
            <div className="text-center text-sm text-gray-400 dark:text-gray-600">
              KI kann Fehler machen, bitte überprüfe die Antworten.
            </div>
          </div>
        </div>
      )}
      {conversation.length > 0 && (
        <div>
          <div className="fixed left-0 flex h-12 w-full items-center justify-between gap-2 bg-gray-100 p-4 pt-6 dark:bg-gray-950">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-3 lg:gap-3">
              <img
                src="logo-colored.webp"
                alt="Logo"
                width="28px"
                height="28px"
              />
              <div className="text-lg text-gray-700 dark:text-white sm:text-2xl md:text-4xl lg:text-3xl">
                Rahmenabkommen GPT
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                className="rounded-full p-2 hover:bg-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={handleOpenShareDialog}
              >
                {!sharingLoading && (
                  <ShareNetworkIcon className="h-6 w-6 transition hover:brightness-125 dark:text-gray-100" />
                )}
                {sharingLoading && (
                  <CircleNotchIcon className="h-6 w-6 animate-spin transition hover:brightness-125 dark:text-gray-100" />
                )}
              </button>
            </div>
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="flex w-11/12 max-w-[48rem] flex-col gap-4">
              <div className="space-y-4 rounded-lg p-4 pb-40 pt-24">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'self-end border-gray-800 bg-gray-300 dark:bg-gray-900'
                        : 'w-full self-start p-4'
                    }`}
                    ref={
                      msg.role === 'user' && index === conversation.length - 2
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
              <div className="fixed bottom-0 left-0 flex w-full items-center justify-center bg-gray-100 pb-4 dark:bg-gray-950">
                <div className="flex h-32 w-11/12 max-w-[48rem] flex-col rounded-3xl border border-gray-300 p-2 pt-5 shadow-sm dark:border-gray-700">
                  <textarea
                    className="w-full flex-grow resize-none px-2 focus:outline-none"
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
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        className="relative z-40"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <DialogPanel className="max-w-lg space-y-4 rounded-xl bg-white px-4 py-3 shadow-lg dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold">
                Konversation teilen
              </DialogTitle>
              <button onClick={() => setShareDialogOpen(false)}>
                <XIcon></XIcon>
              </button>
            </div>
            <p>Kopiere den Link und teile ihn mit deinen Freunden.</p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 p-2 dark:border-gray-700">
              <input
                type="text"
                readOnly
                value={`https://rahmenabkommen-gpt.ch/conversations/${conversationId}`}
                className="flex-grow bg-transparent text-gray-700 focus:outline-none dark:text-gray-300"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://rahmenabkommen-gpt.ch/conversations/${conversationId}`,
                  );
                  showToast('Link kopiert!', 'success');
                }}
                className="rounded-lg bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                Kopieren
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
