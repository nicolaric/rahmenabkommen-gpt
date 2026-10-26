/**
 * Rehype step for assistant answers: right-aligns table columns that hold only
 * numbers and gives them tabular digits, so values like `249`, `1'274` and
 * `22,09 %` line up. A column whose Markdown sets an alignment is left alone.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const CURRENCY = String.raw`(?:CHF|EUR|USD|€|\$|Fr\.)`;
const AMOUNT = String.raw`[+\-−]?\d[\d'’  .,]*`;
const NUMERIC_CELL = new RegExp(
  String.raw`^(?:${CURRENCY}\s?${AMOUNT}|${AMOUNT}\s?(?:%|${CURRENCY})?)$`,
);
// Citation markers sit next to the number they support; they don't make a
// cell non-numeric.
const CITATION_MARKER = /\s*\[(?:Doc|Brain)[^\]]*\]/g;

const NUMERIC_CLASSES = ['text-right', 'tabular-nums'];

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function elements(node: HastNode, tagName: string): HastNode[] {
  return (node.children ?? []).filter(
    (child) => child.type === 'element' && child.tagName === tagName,
  );
}

export function isNumericCell(text: string): boolean {
  return NUMERIC_CELL.test(text.replace(CITATION_MARKER, '').trim());
}

function alignTable(table: HastNode): void {
  const sections = [...elements(table, 'thead'), ...elements(table, 'tbody')];
  const rows = sections.flatMap((section) => elements(section, 'tr'));
  const cellRows = rows.map((row) => [
    ...(row.children ?? []).filter(
      (cell) =>
        cell.type === 'element' &&
        (cell.tagName === 'th' || cell.tagName === 'td'),
    ),
  ]);
  const columnCount = Math.max(0, ...cellRows.map((cells) => cells.length));

  for (let column = 0; column < columnCount; column += 1) {
    const cells = cellRows
      .map((cellsInRow) => cellsInRow[column])
      .filter(Boolean);
    if (cells.some((cell) => cell.properties?.['align'])) continue;

    const bodyValues = cells
      .filter((cell) => cell.tagName === 'td')
      .map((cell) => textOf(cell).trim())
      .filter(Boolean);
    if (bodyValues.length === 0 || !bodyValues.every(isNumericCell)) continue;

    for (const cell of cells) {
      const properties = (cell.properties ??= {});
      const existing = properties['className'];
      properties['className'] = [
        ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
        ...NUMERIC_CLASSES,
      ];
    }
  }
}

function walk(node: HastNode): void {
  if (node.type === 'element' && node.tagName === 'table') {
    alignTable(node);
    return;
  }
  for (const child of node.children ?? []) walk(child);
}

export function rehypeNumericTableColumns() {
  return (tree: HastNode) => walk(tree);
}
