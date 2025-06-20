import { ChatIcon } from '@phosphor-icons/react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { MetaFunction, useLoaderData } from '@remix-run/react';
import Markdown from 'react-markdown';
import { getConversation } from '~/lib/api/conversation';

export async function loader({ params }: LoaderFunctionArgs) {
    if (!params.id) {
        throw new Response('Conversation ID is required', { status: 400 });
    }
    return await getConversation(params.id);
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const question = `Rahmenabkommen GPT - ${data?.messages?.at(0)?.question ?? 'Frage zum Rahmenabkommen'}`;
    const url = `https://rahmenabkommen-gpt.ch/conversations/${data?.id}`;
    const image = 'https://rahmenabkommen-gpt.ch/rich-preview.png';

    return [
        { charset: 'utf-8' },
        { title: question },
        {
            name: 'description',
            content:
                'Stelle deine Fragen zum Rahmenabkommen zwischen Schweiz und EU.',
        },
        { property: 'og:title', content: question },
        {
            property: 'og:description',
            content:
                'Stelle deine Fragen zum Rahmenabkommen zwischen Schweiz und EU.',
        },
        { property: 'og:image', content: image },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: question },
        {
            name: 'twitter:description',
            content:
                'Stelle deine Fragen zum Rahmenabkommen zwischen Schweiz und EU.',
        },
        { name: 'twitter:image', content: image },
        { charset: 'utf-8' },
        { viewport: 'width=device-width,initial-scale=1' },
    ];
};

export default function ConversationDetails() {
    const conversation = useLoaderData<typeof loader>();

    return (
        <div>
            <div className="fixed left-0 top-0 flex h-12 w-full items-center justify-between gap-2 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" width="30px" height="30px" />
                    <div className="text-lg text-gray-600">Rahmenabkommen GPT</div>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/nicolaric/rahmenabkommen-gpt"
                        target="_blank"
                    >
                        <img src="/github-mark.svg" alt="GitHub Logo" className="h-6 w-6" />
                    </a>
                    <a href="https://x.com/NicolaRic2" target="_blank">
                        <img src="/x.png" alt="X Logo" className="h-6 w-6" />
                    </a>
                </div>
            </div>
            <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="flex w-11/12 max-w-[48rem] flex-col">
                    <div className="flex flex-col gap-6 space-y-4 pb-16 pt-20">
                        {conversation.messages.map((msg, index) => (
                            <div key={index} className="flex w-full flex-col gap-4">
                                <div className="w-full rounded-lg border-gray-800 bg-gray-200 p-4">
                                    <div className="prose prose-neutral max-w-none">
                                        <Markdown>{msg.question}</Markdown>
                                    </div>
                                </div>
                                <div
                                    key={index}
                                    className="w-full self-start rounded-lg p-2 text-gray-800"
                                >
                                    <div className="prose prose-neutral max-w-none">
                                        <Markdown>{msg.answer}</Markdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 flex h-12 w-full items-center justify-center p-4">
                <a
                    href="/"
                    className="flex items-center gap-2 self-end rounded-lg bg-gray-700 px-4 py-2 text-gray-100 transition-colors hover:bg-gray-800"
                >
                    <ChatIcon size={28} />
                    Stelle deine eigenen Fragen
                </a>
            </div>
        </div>
    );
}
