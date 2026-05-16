import { useLoaderData } from '@remix-run/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyQuestionStat } from '~/lib/api/models/stats';
import { getStats } from '~/lib/api/stats';
import { Header } from '~/lib/components/header';

type LoaderData = {
  hasError: boolean;
  generatedAt: string | null;
  totalQuestions: number;
  totalConversations: number;
  sharedConversations: number;
  feedConversations: number;
  averageQuestionsPerConversation: number;
  dailyQuestions: DailyQuestionStat[];
};

type ChartDataPoint = {
  date: string;
  count: number;
  axisLabel: string;
  tooltipLabel: string;
};

function toUtcDayDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeDailySeries(dailyQuestions: DailyQuestionStat[]): DailyQuestionStat[] {
  if (dailyQuestions.length === 0) {
    return [];
  }

  const countsByDate = new Map(dailyQuestions.map((item) => [item.date, item.count]));
  const normalized: DailyQuestionStat[] = [];

  let cursor = toUtcDayDate(dailyQuestions[0].date);
  const endDate = toUtcDayDate(dailyQuestions[dailyQuestions.length - 1].date);

  while (cursor <= endDate) {
    const date = formatUtcDay(cursor);
    normalized.push({
      date,
      count: countsByDate.get(date) ?? 0,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return normalized;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getUtcWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
  return weekStart;
}

function getIsoWeekNumber(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function buildChartSeries(dailyQuestions: DailyQuestionStat[]): ChartDataPoint[] {
  if (dailyQuestions.length === 0) {
    return [];
  }

  const latestDate = toUtcDayDate(dailyQuestions[dailyQuestions.length - 1].date);
  const dailyThreshold = new Date(latestDate);
  dailyThreshold.setUTCDate(dailyThreshold.getUTCDate() - 60);

  const weeklyBuckets = new Map<string, { weekStart: Date; weekEnd: Date; count: number }>();
  const recentDailyPoints: ChartDataPoint[] = [];

  for (const item of dailyQuestions) {
    const date = toUtcDayDate(item.date);

    if (date >= dailyThreshold) {
      recentDailyPoints.push({
        date: item.date,
        count: item.count,
        axisLabel: formatShortDate(date),
        tooltipLabel: formatLongDate(date),
      });
      continue;
    }

    const weekStart = getUtcWeekStart(date);
    const weekStartKey = formatUtcDay(weekStart);
    const existingBucket = weeklyBuckets.get(weekStartKey);

    if (existingBucket) {
      existingBucket.count += item.count;
      continue;
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weeklyBuckets.set(weekStartKey, {
      weekStart,
      weekEnd,
      count: item.count,
    });
  }

  const weeklyPoints = Array.from(weeklyBuckets.values())
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((bucket) => {
      const weekNumber = getIsoWeekNumber(bucket.weekStart);
      return {
        date: formatUtcDay(bucket.weekStart),
        count: bucket.count,
        axisLabel: `KW ${weekNumber}`,
        tooltipLabel: `KW ${weekNumber} (${formatShortDate(bucket.weekStart)}–${formatShortDate(bucket.weekEnd)})`,
      };
    });

  return [...weeklyPoints, ...recentDailyPoints];
}

function calculateTrend(dailyQuestions: DailyQuestionStat[]): number {
  if (dailyQuestions.length < 8) {
    return 0;
  }

  const previous7 = dailyQuestions.slice(-14, -7).reduce((sum, item) => sum + item.count, 0);
  const last7 = dailyQuestions.slice(-7).reduce((sum, item) => sum + item.count, 0);

  if (previous7 === 0) {
    return last7 > 0 ? 100 : 0;
  }

  return Number((((last7 - previous7) / previous7) * 100).toFixed(2));
}

export async function loader() {
  try {
    const stats = await getStats();
    return Response.json({
      hasError: false,
      generatedAt: stats.generatedAt,
      totalQuestions: stats.totalQuestions,
      totalConversations: stats.totalConversations,
      sharedConversations: stats.sharedConversations,
      feedConversations: stats.feedConversations,
      averageQuestionsPerConversation: stats.averageQuestionsPerConversation,
      dailyQuestions: normalizeDailySeries(stats.dailyQuestions),
    });
  } catch {
    return Response.json({
      hasError: true,
      generatedAt: null,
      totalQuestions: 0,
      totalConversations: 0,
      sharedConversations: 0,
      feedConversations: 0,
      averageQuestionsPerConversation: 0,
      dailyQuestions: [],
    });
  }
}

export default function StatsPage() {
  const {
    hasError,
    generatedAt,
    totalQuestions,
    totalConversations,
    sharedConversations,
    feedConversations,
    averageQuestionsPerConversation,
    dailyQuestions,
  } = useLoaderData<LoaderData>();

  const trend = calculateTrend(dailyQuestions);
  const chartData = buildChartSeries(dailyQuestions);

  return (
    <div className="min-h-screen w-full">
      <Header />
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 font-sans">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistiken</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Überblick über die Fragenaktivität und aktuelle Entwicklung.
        </p>

        {hasError ? (
          <div className="mb-8 rounded-2xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-200">
            Statistiken konnten nicht geladen werden. Bitte später erneut versuchen.
          </div>
        ) : null}

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">Total gestellte Fragen</h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {totalQuestions.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">Total Konversationen</h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {totalConversations.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">Geteilte Konversationen</h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {sharedConversations.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">Ø Fragen pro Konversation</h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {averageQuestionsPerConversation.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">
              Trend (letzte 7 vs. vorherige 7 Tage)
            </h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {trend > 0 ? '+' : ''}
              {trend.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold">Täglich gestellte Fragen</h2>
          {dailyQuestions.length === 0 ? (
            <div className="rounded-lg bg-gray-100 p-4 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Noch keine Fragen vorhanden.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(_, index) => chartData[index]?.axisLabel ?? ''} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as ChartDataPoint | undefined;
                    return point?.tooltipLabel ?? '';
                  }}
                  formatter={(value) => [`${value} Frage(n)`, 'Anzahl']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  animationEasing="ease-in-out"
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {generatedAt ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Generiert am {new Date(generatedAt).toLocaleString('de-CH')}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
