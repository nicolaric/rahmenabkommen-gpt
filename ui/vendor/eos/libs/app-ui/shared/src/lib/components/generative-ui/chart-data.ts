import { z } from 'zod';
import type { UiPropValue } from './parse';

/**
 * Chart content is a JSON array of rows. It is validated before anything is
 * drawn; data that cannot be a chart falls back to a table, and data that is
 * not even a list of rows falls back to its raw text.
 */

export const CHART_TYPES = ['bar', 'line', 'area'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const MAX_CHART_SERIES = 6;
export const MAX_CHART_POINTS = 200;

export type ChartCell = string | number | null;
export type ChartRow = Record<string, ChartCell>;

export type ChartData = { x: string; series: string[]; rows: ChartRow[] };

export type ChartParseResult =
  | { kind: 'chart'; data: ChartData; columns: string[] }
  | { kind: 'table'; rows: ChartRow[]; columns: string[] }
  | { kind: 'text'; text: string };

const cellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const rowsSchema = z
  .array(z.record(z.string(), cellSchema))
  .min(1)
  .max(MAX_CHART_POINTS * 5);

function columnsOf(rows: ChartRow[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}

function seriesFrom(
  value: UiPropValue | undefined,
  rows: ChartRow[],
  x: string,
  columns: string[],
): string[] {
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
  }
  // Without `series`, every column besides x that holds numbers is a series.
  return columns.filter(
    (key) =>
      key !== x &&
      rows.some((row) => typeof row[key] === 'number') &&
      rows.every((row) => row[key] == null || typeof row[key] === 'number'),
  );
}

export function parseChartData(
  raw: string,
  props: { x?: UiPropValue; series?: UiPropValue },
): ChartParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { kind: 'text', text: raw };
  }
  const parsed = rowsSchema.safeParse(json);
  if (!parsed.success) return { kind: 'text', text: raw };

  const rows = parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === 'boolean' ? String(value) : value,
      ]),
    ),
  ) as ChartRow[];
  const columns = columnsOf(rows);
  const table: ChartParseResult = { kind: 'table', rows, columns };

  const x =
    typeof props.x === 'string' && columns.includes(props.x)
      ? props.x
      : columns[0];
  const series = seriesFrom(props.series, rows, x, columns);
  if (
    series.length === 0 ||
    series.length > MAX_CHART_SERIES ||
    rows.length > MAX_CHART_POINTS
  ) {
    return table;
  }

  const pointSchema = z.object({
    [x]: z.union([z.string(), z.number()]),
    ...Object.fromEntries(
      series.map((key) => [key, z.number().nullable().optional()]),
    ),
  });
  if (!rows.every((row) => pointSchema.safeParse(row).success)) return table;

  return {
    kind: 'chart',
    data: { x, series, rows },
    columns: [x, ...series],
  };
}

const formatCell = (value: ChartCell | undefined) =>
  value == null ? '' : String(value);

export function toCsv(columns: string[], rows: ChartRow[]): string {
  const quote = (value: string) =>
    /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [
    columns,
    ...rows.map((row) => columns.map((key) => formatCell(row[key]))),
  ]
    .map((cells) => cells.map(quote).join(','))
    .join('\n');
}

export function toMarkdownTable(columns: string[], rows: ChartRow[]): string {
  const escape = (value: string) => value.replace(/\|/g, '\\|');
  const line = (cells: string[]) => `| ${cells.map(escape).join(' | ')} |`;
  return [
    line(columns),
    line(columns.map(() => '---')),
    ...rows.map((row) => line(columns.map((key) => formatCell(row[key])))),
  ].join('\n');
}

/** Plain-text version of a chart: its title and a Markdown table of the data. */
export function chartFallbackMarkdown(
  props: Record<string, UiPropValue>,
  raw: string,
): string {
  const result = parseChartData(raw, props);
  if (result.kind === 'text') return result.text;
  const rows = result.kind === 'chart' ? result.data.rows : result.rows;
  const parts = [
    typeof props['title'] === 'string' ? `**${props['title']}**` : '',
    toMarkdownTable(result.columns, rows),
    typeof props['caption'] === 'string' ? props['caption'] : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}
