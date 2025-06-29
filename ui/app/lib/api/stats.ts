import { api } from './api';
import { DailyQuestionStat } from './models/stats';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function getDailyQuestions(): Promise<DailyQuestionStat[]> {
    return api<DailyQuestionStat[]>(`${backendUrl}stats`, {
        method: 'GET',
    });
}
