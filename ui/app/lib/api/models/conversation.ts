export type Conversation = {
  id: string;
  creation_date: string;
  messages: {
    question: string;
    answer: string;
    timestamp: string;
  }[];
};

export type ConversationShare = {
  id: string;
  shared: boolean;
  posted_in_feed: boolean;
};
