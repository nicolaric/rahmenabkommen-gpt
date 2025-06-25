export type Message = {
  sources: { id: string; url: string }[];
  question: string;
  answer: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  creation_date: string;
  messages: Message[];
};

export type ConversationShare = {
  id: string;
  shared: boolean;
  posted_in_feed: boolean;
};
