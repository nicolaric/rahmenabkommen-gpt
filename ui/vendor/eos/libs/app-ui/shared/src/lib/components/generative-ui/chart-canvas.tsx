import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartData, ChartType } from './chart-data';

/**
 * The recharts part of a chart. It is loaded lazily by `ChartBlock`, so the
 * library is only downloaded once a chart is actually shown.
 */

// The theme's --chart-n tokens: soft slate, logo coral, then muted hues, with
// separate light and dark values.
export const SERIES_COLORS = [1, 2, 3, 4, 5, 6].map((n) => `var(--chart-${n})`);
const color = (index: number) => SERIES_COLORS[index % SERIES_COLORS.length];

const MAX_LABEL_LENGTH = 16;
const shortLabel = (value: unknown) => {
  const label = String(value ?? '');
  return label.length > MAX_LABEL_LENGTH
    ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…`
    : label;
};

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});
const compactFormat = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const axisProps = {
  stroke: 'var(--muted-foreground)',
  tick: { fontSize: 12, fill: 'var(--muted-foreground)' },
  tickLine: false,
  axisLine: false,
} as const;

export default function ChartCanvas({
  type,
  data,
  stacked = false,
}: {
  type: ChartType;
  data: ChartData;
  stacked?: boolean;
}) {
  const { x, series, rows } = data;
  // Bars stand for categories, so every bar gets its (shortened) label;
  // many categories tilt their labels instead of dropping some.
  const isCategorical = type === 'bar';
  const tiltLabels = isCategorical && rows.length > 6;
  const children = [
    <CartesianGrid
      key="grid"
      vertical={false}
      strokeDasharray="3 3"
      stroke="var(--border)"
    />,
    <XAxis
      key="x"
      dataKey={x}
      {...axisProps}
      interval={isCategorical ? 0 : 'preserveStartEnd'}
      tickFormatter={shortLabel}
      angle={tiltLabels ? -35 : 0}
      textAnchor={tiltLabels ? 'end' : 'middle'}
      height={tiltLabels ? 64 : 30}
    />,
    <YAxis
      key="y"
      {...axisProps}
      width={48}
      tickFormatter={(value: number) => compactFormat.format(value)}
    />,
    <Tooltip
      key="tooltip"
      cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
      formatter={(value) =>
        typeof value === 'number' ? numberFormat.format(value) : value
      }
      contentStyle={{
        background: 'var(--popover)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--popover-foreground)',
        fontSize: 12,
      }}
    />,
    series.length > 1 ? (
      <Legend
        key="legend"
        wrapperStyle={{ fontSize: 12 }}
        formatter={(value) => (
          <span style={{ color: 'var(--foreground)' }}>{value}</span>
        )}
      />
    ) : null,
  ];
  const stackId = stacked ? 'stack' : undefined;

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'line' ? (
        <LineChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          {children}
          {series.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color(index)}
              strokeWidth={2}
              dot={rows.length <= 24}
              connectNulls
            />
          ))}
        </LineChart>
      ) : type === 'area' ? (
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          {children}
          {series.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={stackId}
              stroke={color(index)}
              fill={color(index)}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {children}
          {series.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId={stackId}
              fill={color(index)}
              radius={stacked ? 0 : [6, 6, 0, 0]}
              maxBarSize={56}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
