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
import { getDailyQuestions } from '~/lib/api/stats';
import { Header } from '~/lib/components/header';

type LoaderData = {
  totalQuestions: number;
  dailyQuestions: DailyQuestionStat[];
};

export async function loader() {
  const dailyQuestions = await getDailyQuestions();
  return Response.json({
    dailyQuestions,
    totalQuestions: dailyQuestions.reduce((acc, stat) => acc + stat.count, 0),
  });
}

export default function StatsPage() {
  const { totalQuestions, dailyQuestions } = useLoaderData<LoaderData>();

  console.log('Loaded daily questions:', dailyQuestions);
  return (
    <div className="min-h-screen w-full">
      <Header />
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 font-sans">
        <h1 className="mb-6 text-3xl font-bold">Statistiken</h1>

        {/* KPI */}
        <div className="mb-12">
          <div className="rounded-2xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg text-gray-600 dark:text-gray-400">
              Total gestellte Fragen
            </h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {totalQuestions.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold">
            Täglich gestellte Fragen
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyQuestions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('de-CH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                }
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('de-CH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                }
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
        </div>
      </section>
    </div>
  );
}
