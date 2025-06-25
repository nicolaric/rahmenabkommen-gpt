import Markdown from 'react-markdown';
import { Message } from '../api/models/conversation';
import { useEffect, useRef } from 'react';

export function Conversation({ messages }: { messages: Message[] }) {
    const lastQuestionRef = useRef<HTMLDivElement>(null);
    //
    // Scroll to the last user message when the conversation changes
    useEffect(() => {
        if (lastQuestionRef.current) {
            const element = lastQuestionRef.current;
            const y = element.getBoundingClientRect().top + window.scrollY - 56;

            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <>
            {messages.map((msg, index) => (
                <div
                    key={index}
                    ref={index === messages.length - 1 ? lastQuestionRef : undefined}
                    className="flex w-full flex-col gap-4"
                >
                    <div className="w-full rounded-lg border-gray-800 bg-gray-300 p-4 dark:bg-gray-900">
                        <div className="prose prose-neutral max-w-none dark:text-white">
                            <Markdown>{msg.question}</Markdown>
                        </div>
                    </div>
                    <div className="w-full self-start rounded-lg p-2 text-gray-800">
                        <div className="prose prose-neutral max-w-none dark:text-white">
                            <Markdown>{msg.answer}</Markdown>
                            <div className="flex flex-row gap-1">
                                {msg.sources?.map((source, sourceIndex) => (
                                    <div key={sourceIndex}>
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-4 w-4 items-center justify-center rounded-md bg-blue-100 text-sm text-blue-600 no-underline"
                                        >
                                            {source.id}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
