export type DailyQuestionStat = {
    date: string;
    count: number;
};

export type StatsResponse = {
    schemaVersion: 2;
    generatedAt: string;
    totalQuestions: number;
    totalConversations: number;
    sharedConversations: number;
    feedConversations: number;
    averageQuestionsPerConversation: number;
    dailyQuestions: DailyQuestionStat[];
};
