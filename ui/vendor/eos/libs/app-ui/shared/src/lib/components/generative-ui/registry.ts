import type { UiPropValue, UiTag } from './parse';

/**
 * Allowed props per tag and the classes each allowed value maps to. A prop
 * that is missing here, or a value that is not a key of its table, is dropped
 * on its own; the element still renders with its defaults. Class strings are
 * written out in full so Tailwind can see them.
 */

const GAP = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
} satisfies Record<0 | 1 | 2 | 3 | 4 | 5 | 6, string>;

const ALIGN_ITEMS = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
};

const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

const RADIUS = { md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl' };

const SURFACE_TONE = {
  default: '',
  muted: 'bg-muted/60',
  success: 'bg-emerald-50 dark:bg-emerald-500/10',
  warning: 'bg-amber-50 dark:bg-amber-500/10',
  info: 'bg-sky-50 dark:bg-sky-500/10',
};

const TEXT_TONE = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  info: 'text-sky-700 dark:text-sky-300',
};

const BADGE_TONE = {
  default: 'bg-muted text-foreground border-border',
  muted: 'bg-muted text-muted-foreground border-border',
  success:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30',
  warning:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30',
  info: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30',
};

const TEXT_SIZE = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const TEXT_WEIGHT = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

const TEXT_ALIGN = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

const ICON_SIZE = { sm: 'size-4', md: 'size-5', lg: 'size-6' };

// Columns follow the width of the message column (a container query), not the
// window: two tiles side by side from 20rem, the full count once there is room.
const GRID_COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @xs:grid-cols-2',
  3: 'grid-cols-1 @xs:grid-cols-2 @xl:grid-cols-3',
  4: 'grid-cols-1 @xs:grid-cols-2 @2xl:grid-cols-4',
};

// Chart types map to themselves; the chart component picks the renderer.
const CHART_TYPE = { bar: 'bar', line: 'line', area: 'area' };

type Table = Record<string, string>;
type PropSpec =
  | { kind: 'boolean' }
  | { kind: 'string' }
  // Shown to the user; numbers like value={68} are accepted as text.
  | { kind: 'text' }
  | { kind: 'enum'; values: Table };

const PROP_SPECS: Record<UiTag, Partial<Record<PropKey, PropSpec>>> = {
  // Boxes have no border or padding: they lay content out, and dividers
  // separate it. `border` and `padding` in older answers are ignored.
  box: {
    tone: { kind: 'enum', values: SURFACE_TONE },
    gap: { kind: 'enum', values: GAP },
    radius: { kind: 'enum', values: RADIUS },
    align: { kind: 'enum', values: ALIGN_ITEMS },
  },
  row: {
    gap: { kind: 'enum', values: GAP },
    align: { kind: 'enum', values: ALIGN_ITEMS },
    justify: { kind: 'enum', values: JUSTIFY },
  },
  text: {
    size: { kind: 'enum', values: TEXT_SIZE },
    weight: { kind: 'enum', values: TEXT_WEIGHT },
    tone: { kind: 'enum', values: TEXT_TONE },
    align: { kind: 'enum', values: TEXT_ALIGN },
    numeric: { kind: 'boolean' },
  },
  icon: {
    name: { kind: 'string' },
    size: { kind: 'enum', values: ICON_SIZE },
    tone: { kind: 'enum', values: TEXT_TONE },
    tile: { kind: 'boolean' },
  },
  divider: {},
  badge: {
    tone: { kind: 'enum', values: BADGE_TONE },
  },
  grid: {
    columns: { kind: 'enum', values: GRID_COLUMNS },
    gap: { kind: 'enum', values: GAP },
  },
  stat: {
    label: { kind: 'text' },
    value: { kind: 'text' },
    hint: { kind: 'text' },
  },
  chart: {
    type: { kind: 'enum', values: CHART_TYPE },
    x: { kind: 'string' },
    series: { kind: 'string' },
    title: { kind: 'text' },
    caption: { kind: 'text' },
    stacked: { kind: 'boolean' },
  },
  checklist: {
    title: { kind: 'text' },
  },
  resource: {
    title: { kind: 'text' },
    icon: { kind: 'string' },
    href: { kind: 'string' },
    action: { kind: 'text' },
  },
  email: {
    subject: { kind: 'text' },
    to: { kind: 'string' },
  },
};

type PropKey =
  | 'tone'
  | 'gap'
  | 'radius'
  | 'align'
  | 'justify'
  | 'size'
  | 'weight'
  | 'name'
  | 'numeric'
  | 'tile'
  | 'columns'
  | 'label'
  | 'value'
  | 'hint'
  | 'type'
  | 'x'
  | 'series'
  | 'title'
  | 'caption'
  | 'stacked'
  | 'subject'
  | 'icon'
  | 'href'
  | 'action'
  | 'to';

export type ResolvedProps = Partial<Record<PropKey, string | boolean>>;

/** Keeps only documented props with allowed values; everything else is dropped. */
export function resolveProps(
  tag: UiTag,
  props: Record<string, UiPropValue>,
): ResolvedProps {
  const specs = PROP_SPECS[tag];
  const resolved: ResolvedProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!Object.prototype.hasOwnProperty.call(specs, key)) continue;
    const spec = specs[key as PropKey];
    if (!spec) continue;
    if (spec.kind === 'boolean') {
      if (typeof value === 'boolean') resolved[key as PropKey] = value;
    } else if (spec.kind === 'string') {
      if (typeof value === 'string') resolved[key as PropKey] = value;
    } else if (spec.kind === 'text') {
      if (typeof value === 'string' || typeof value === 'number') {
        resolved[key as PropKey] = String(value);
      }
    } else {
      const token = String(value);
      if (Object.prototype.hasOwnProperty.call(spec.values, token)) {
        resolved[key as PropKey] = token;
      }
    }
  }
  return resolved;
}

const pick = (
  table: Table,
  value: string | boolean | undefined,
  fallback: string,
) => (typeof value === 'string' ? table[value] : fallback);

export function boxClasses(props: ResolvedProps): string {
  const tinted = Boolean(props.tone) && props.tone !== 'default';
  return [
    'flex min-w-0 flex-col',
    pick(SURFACE_TONE, props.tone, ''),
    // A tinted callout needs inner space so text does not touch its edge.
    tinted ? 'p-3' : '',
    pick(GAP, props.gap, 'gap-2'),
    pick(RADIUS, props.radius, tinted ? 'rounded-lg' : ''),
    pick(ALIGN_ITEMS, props.align, ''),
  ]
    .filter(Boolean)
    .join(' ');
}

export function rowClasses(
  props: ResolvedProps,
  { iconLed = false }: { iconLed?: boolean } = {},
): string {
  return [
    // An icon followed by one block of content stays on one line: the content
    // takes the remaining width and wraps inside itself, instead of the whole
    // block dropping below the icon.
    iconLed
      ? 'flex min-w-0 flex-row flex-nowrap'
      : 'flex min-w-0 flex-row flex-wrap',
    pick(GAP, props.gap, 'gap-2'),
    pick(ALIGN_ITEMS, props.align, 'items-start'),
    pick(JUSTIFY, props.justify, ''),
  ]
    .filter(Boolean)
    .join(' ');
}

export function textClasses(props: ResolvedProps): string {
  return [
    'min-w-0',
    pick(TEXT_SIZE, props.size, ''),
    pick(TEXT_WEIGHT, props.weight, ''),
    pick(TEXT_TONE, props.tone, ''),
    pick(TEXT_ALIGN, props.align, ''),
    props.numeric === true ? 'tabular-nums' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function iconClasses(props: ResolvedProps): string {
  return [
    'shrink-0',
    pick(ICON_SIZE, props.size, 'size-4'),
    pick(TEXT_TONE, props.tone, 'text-muted-foreground'),
  ].join(' ');
}

/** The muted square an icon sits on with the `tile` prop. */
export const ICON_TILE_CLASSES =
  'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted';

export function gridClasses(props: ResolvedProps): string {
  return [
    'grid min-w-0',
    pick(GRID_COLUMNS, props.columns, GRID_COLUMNS[2]),
    pick(GAP, props.gap, 'gap-3'),
  ].join(' ');
}

export const STAT_CLASSES = {
  tile: 'flex min-w-0 flex-col gap-1 rounded-lg border p-3',
  label: 'text-xs font-medium text-muted-foreground',
  value: 'text-2xl font-semibold leading-tight tabular-nums text-foreground',
  hint: 'text-xs text-muted-foreground',
};

export function badgeClasses(props: ResolvedProps): string {
  return [
    'inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
    pick(BADGE_TONE, props.tone, BADGE_TONE.default),
  ].join(' ');
}
