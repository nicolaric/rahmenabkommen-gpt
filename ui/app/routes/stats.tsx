import { useMemo, useState } from 'react';
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

type TimeRange = '7d' | '30d' | '90d' | 'all';
type Interval = 'daily' | 'weekly' | 'monthly';

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

function formatMonthAxisLabel(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    month: '2-digit',
    year: '2-digit',
  });
}

function formatMonthTooltipLabel(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    month: 'long',
    year: 'numeric',
  });
}

function filterByTimeRange(dailyQuestions: DailyQuestionStat[], timeRange: TimeRange): DailyQuestionStat[] {
  if (dailyQuestions.length === 0 || timeRange === 'all') {
    return dailyQuestions;
  }

  const latestDate = toUtcDayDate(dailyQuestions[dailyQuestions.length - 1].date);
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const threshold = new Date(latestDate);
  threshold.setUTCDate(threshold.getUTCDate() - (days - 1));

  return dailyQuestions.filter((item) => toUtcDayDate(item.date) >= threshold);
}

function buildChartSeries(dailyQuestions: DailyQuestionStat[], interval: Interval): ChartDataPoint[] {
  if (dailyQuestions.length === 0) {
    return [];
  }

  if (interval === 'daily') {
    return dailyQuestions.map((item) => {
      const date = toUtcDayDate(item.date);
      return {
        date: item.date,
        count: item.count,
        axisLabel: formatShortDate(date),
        tooltipLabel: formatLongDate(date),
      };
    });
  }

  if (interval === 'weekly') {
    const weeklyBuckets = new Map<string, { weekStart: Date; count: number }>();

    for (const item of dailyQuestions) {
      const date = toUtcDayDate(item.date);
      const weekStart = getUtcWeekStart(date);
      const weekStartKey = formatUtcDay(weekStart);
      const existingBucket = weeklyBuckets.get(weekStartKey);

      if (existingBucket) {
        existingBucket.count += item.count;
      } else {
        weeklyBuckets.set(weekStartKey, {
          weekStart,
          count: item.count,
        });
      }
    }

    return Array.from(weeklyBuckets.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((bucket) => {
        const weekEnd = new Date(bucket.weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
        const weekNumber = getIsoWeekNumber(bucket.weekStart);

        return {
          date: formatUtcDay(bucket.weekStart),
          count: bucket.count,
          axisLabel: `KW ${weekNumber}`,
          tooltipLabel: `KW ${weekNumber} (${formatShortDate(bucket.weekStart)}–${formatShortDate(weekEnd)})`,
        };
      });
  }

  const monthlyBuckets = new Map<string, { monthStart: Date; count: number }>();

  for (const item of dailyQuestions) {
    const date = toUtcDayDate(item.date);
    const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const monthStartKey = formatUtcDay(monthStart);
    const existingBucket = monthlyBuckets.get(monthStartKey);

    if (existingBucket) {
      existingBucket.count += item.count;
    } else {
      monthlyBuckets.set(monthStartKey, {
        monthStart,
        count: item.count,
      });
    }
  }

  return Array.from(monthlyBuckets.values())
    .sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime())
    .map((bucket) => ({
      date: formatUtcDay(bucket.monthStart),
      count: bucket.count,
      axisLabel: formatMonthAxisLabel(bucket.monthStart),
      tooltipLabel: formatMonthTooltipLabel(bucket.monthStart),
    }));
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
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [interval, setInterval] = useState<Interval>('daily');

  const trend = calculateTrend(dailyQuestions);
  const chartData = useMemo(() => {
    const filteredDailyQuestions = filterByTimeRange(dailyQuestions, timeRange);
    return buildChartSeries(filteredDailyQuestions, interval);
  }, [dailyQuestions, timeRange, interval]);

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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestellte Fragen</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1">Zeitraum</span>
                <select
                  value={timeRange}
                  onChange={(event) => setTimeRange(event.target.value as TimeRange)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="7d">7 Tage</option>
                  <option value="30d">30 Tage</option>
                  <option value="90d">90 Tage</option>
                  <option value="all">Alle</option>
                </select>
              </label>
              <label className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1">Intervall</span>
                <select
                  value={interval}
                  onChange={(event) => setInterval(event.target.value as Interval)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </label>
            </div>
          </div>
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
