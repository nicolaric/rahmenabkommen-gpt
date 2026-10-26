import type { ConversationStreamMessage } from '@eos/app-ui/shared/client';

/**
 * How a yeos answer's sources are stored in the Flask `message.sources`
 * column. Answers from before yeos store a list of `{ id, url }` footnotes.
 */
export type EosSources = {
  format: 'eos';
  sources: ConversationStreamMessage['sources'];
  citations: ConversationStreamMessage['citations'];
};

type LegacySource = { id: number | string; url: string };

export type SharedConversation = {
  id: string;
  creation_date: string;
  messages: {
    question: string;
    answer: string;
    timestamp: string;
    sources: EosSources | LegacySource[] | null;
  }[];
};

function isEosSources(sources: unknown): sources is EosSources {
  return (
    typeof sources === 'object' &&
    sources !== null &&
    (sources as EosSources).format === 'eos'
  );
}

/** Turns legacy `[n]` footnote markers into links to the contract pages. */
function linkLegacyFootnotes(answer: string, sources: LegacySource[]) {
  const urls = new Map(sources.map((source) => [String(source.id), source.url]));
  return answer.replace(/\[(\d+)\]/g, (marker, id: string) => {
    const url = urls.get(id);
    return url ? `[[${id}]](${encodeURI(url)})` : marker;
  });
}

export function toConversationMessages(
  conversation: SharedConversation,
): ConversationStreamMessage[] {
  return conversation.messages.map((message, index) => {
    const eos = isEosSources(message.sources) ? message.sources : null;
    const legacy = Array.isArray(message.sources) ? message.sources : [];

    return {
      id: `${conversation.id}-${index}`,
      question: message.question,
      answer: eos ? message.answer : linkLegacyFootnotes(message.answer, legacy),
      timestamp: message.timestamp,
      sources: eos?.sources ?? [],
      citations: eos?.citations ?? [],
      tool_web_traces: [],
      rating: null,
      agent_id: null,
      agent_name: null,
    } satisfies ConversationStreamMessage;
  });
}
