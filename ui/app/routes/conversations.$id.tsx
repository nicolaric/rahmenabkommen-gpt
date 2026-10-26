import { ConversationComponent } from '@eos/app-ui/shared/client';
import {
  Button,
  MessageScroller,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@eos/shared/ui';
import { MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/conversations.$id';
import { getSharedConversation } from '../lib/backend.server';
import { Header } from '../lib/components/header';
import { buildMeta } from '../lib/meta';
import { toConversationMessages } from '../lib/shared-conversation';

const ORGANIZATION_ID = import.meta.env.VITE_YEOS_ORGANIZATION_ID as string;

export async function loader({ params }: Route.LoaderArgs) {
  return getSharedConversation(params.id);
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
  return buildMeta({
    title: `Rahmenabkommen GPT - ${data?.messages?.at(0)?.question ?? 'Frage zum Rahmenabkommen'}`,
    url: `${frontendUrl}/conversations/${data?.id}`,
  });
}

export default function SharedConversation() {
  const conversation = useLoaderData<typeof loader>();
  const { t } = useTranslation('common');
  const messages = useMemo(
    () => toConversationMessages(conversation),
    [conversation],
  );

  return (
    <>
      <Header />
      <div data-chat-page="conversation" className="flex min-w-0 flex-1 flex-col">
        <MessageScrollerProvider>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport>
              <div className="mx-auto w-full max-w-3xl px-2 py-6 pb-28 sm:px-4">
                <ConversationComponent
                  messages={messages}
                  hideWorkingStatus
                  activeTeamId={ORGANIZATION_ID}
                  isSending={false}
                  traceEventsByMessageId={{}}
                  disableEdit
                />
              </div>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
      <div className="fixed inset-x-0 bottom-4 flex justify-center">
        <Button size="lg" nativeButton={false} render={<Link to="/" />}>
          <MessageCircle />
          {t('askYourOwn')}
        </Button>
      </div>
    </>
  );
}
