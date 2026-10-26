import * as React from 'react';
import {
  parseChartData,
  toCsv,
  type ChartCell,
  type ChartRow,
  type ChartType,
} from './chart-data';
import type { ResolvedProps } from './registry';

// recharts is only fetched when a chart is actually drawn.
const ChartCanvas = React.lazy(() => import('./chart-canvas'));

export type ChartLabels = {
  showData: string;
  hideData: string;
  copyCsv: string;
  copied: string;
  label: string;
};

const DEFAULT_CHART_LABELS: ChartLabels = {
  showData: 'Show data',
  hideData: 'Hide data',
  copyCsv: 'Copy CSV',
  copied: 'Copied',
  label: 'Chart',
};

/** Translated chart toolbar labels, provided by the conversation. */
export const ChartLabelsContext =
  React.createContext<ChartLabels>(DEFAULT_CHART_LABELS);

const CHART_HEIGHT = 'h-72';

const formatCell = (value: ChartCell | undefined) =>
  value == null ? '' : String(value);

function DataTable({ columns, rows }: { columns: string[]; rows: ChartRow[] }) {
  const numeric = columns.map((key) =>
    rows.every((row) => row[key] == null || typeof row[key] === 'number'),
  );
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            {columns.map((key, index) => (
              <th
                key={key}
                scope="col"
                className={`px-3 py-2 text-left text-xs font-medium text-muted-foreground ${numeric[index] ? 'text-right' : ''}`}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((key, index) => (
                <td
                  key={key}
                  className={`px-3 py-1.5 ${numeric[index] ? 'text-right tabular-nums' : ''}`}
                >
                  {formatCell(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      data-testid="chart-skeleton"
      aria-hidden
      className={`${CHART_HEIGHT} w-full animate-pulse rounded-lg bg-muted/60`}
    />
  );
}

const toolbarButton =
  'rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none';

export function ChartBlock({
  props,
  raw,
  pending,
  inline,
}: {
  props: ResolvedProps;
  raw: string;
  /** The chart's JSON is still streaming in. */
  pending: boolean;
  /** Renders model text (title, caption) as inline Markdown with citations. */
  inline: (text: string) => React.ReactNode;
}) {
  const labels = React.useContext(ChartLabelsContext);
  const [showData, setShowData] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { x, series } = props;
  const result = React.useMemo(
    () => (pending ? null : parseChartData(raw, { x, series })),
    [pending, raw, x, series],
  );
  const title = typeof props.title === 'string' ? props.title : null;
  const caption = typeof props.caption === 'string' ? props.caption : null;

  const header = title ? (
    <div className="min-w-0 text-sm font-medium">{inline(title)}</div>
  ) : null;

  if (!result) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        {header}
        <ChartSkeleton />
      </div>
    );
  }
  if (result.kind === 'text') {
    return (
      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
        {result.text}
      </p>
    );
  }
  if (result.kind === 'table') {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        {header}
        <DataTable columns={result.columns} rows={result.rows} />
        {caption ? (
          <div className="text-xs text-muted-foreground">{inline(caption)}</div>
        ) : null}
      </div>
    );
  }

  const { data, columns } = result;
  const type = (props.type as ChartType | undefined) ?? 'bar';
  const copyCsv = async () => {
    try {
      await navigator.clipboard.writeText(toCsv(columns, data.rows));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the data table stays available.
    }
  };

  return (
    <figure
      className="group/chart m-0 flex min-w-0 flex-col gap-2"
      aria-label={title ?? labels.label}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">{header}</div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/chart:opacity-100 [@media(hover:none)]:opacity-100">
          <button
            type="button"
            className={toolbarButton}
            aria-pressed={showData}
            onClick={() => setShowData((value) => !value)}
          >
            {showData ? labels.hideData : labels.showData}
          </button>
          <button type="button" className={toolbarButton} onClick={copyCsv}>
            {copied ? labels.copied : labels.copyCsv}
          </button>
        </div>
      </div>
      <div className={`${CHART_HEIGHT} w-full min-w-0`} aria-hidden>
        <React.Suspense fallback={<ChartSkeleton />}>
          <ChartCanvas
            type={type}
            data={data}
            stacked={props.stacked === true && type !== 'line'}
          />
        </React.Suspense>
      </div>
      <ul className="sr-only">
        {data.rows.map((row, index) => (
          <li key={index}>
            {formatCell(row[data.x])}:{' '}
            {data.series
              .map((key) => `${key} ${formatCell(row[key])}`)
              .join(', ')}
          </li>
        ))}
      </ul>
      {showData ? <DataTable columns={columns} rows={data.rows} /> : null}
      {caption ? (
        <figcaption className="text-xs text-muted-foreground">
          {inline(caption)}
        </figcaption>
      ) : null}
    </figure>
  );
}
