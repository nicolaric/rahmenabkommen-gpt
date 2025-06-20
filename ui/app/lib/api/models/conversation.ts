export type Conversation = {
  id: string;
  creation_date: string;
  messages: {
    question: string;
    answer: string;
    timestamp: string;
  }[];
};
