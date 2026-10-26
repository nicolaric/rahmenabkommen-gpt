import type { ConversationListConversation } from '@eos/data-access/api';

export type ConversationGroupKey =
  | 'pinned'
  | 'today'
  | 'yesterday'
  | 'previous7Days'
  | 'previous30Days'
  | 'older';

export type ConversationGroup = {
  key: ConversationGroupKey;
  conversations: ConversationListConversation[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function ageGroup(updatedAt: string, today: number): ConversationGroupKey {
  const time = new Date(updatedAt).getTime();
  if (Number.isNaN(time) || time >= today) return 'today';
  if (time >= today - DAY_MS) return 'yesterday';
  if (time >= today - 7 * DAY_MS) return 'previous7Days';
  if (time >= today - 30 * DAY_MS) return 'previous30Days';
  return 'older';
}

/**
 * Group conversations for the sidebar: pinned ones first, then by how
 * recently they were active, in the user's local calendar days. The order
 * within a group is kept as delivered (newest first).
 */
export function groupConversations(
  conversations: ConversationListConversation[],
  now: Date = new Date(),
): ConversationGroup[] {
  const today = startOfDay(now);
  const order: ConversationGroupKey[] = [
    'pinned',
    'today',
    'yesterday',
    'previous7Days',
    'previous30Days',
    'older',
  ];
  const byKey = new Map<ConversationGroupKey, ConversationListConversation[]>();
  for (const conversation of conversations) {
    const key = conversation.pinned
      ? 'pinned'
      : ageGroup(conversation.updated_at, today);
    byKey.set(key, [...(byKey.get(key) ?? []), conversation]);
  }
  return order
    .filter((key) => byKey.has(key))
    .map((key) => ({ key, conversations: byKey.get(key) ?? [] }));
}
