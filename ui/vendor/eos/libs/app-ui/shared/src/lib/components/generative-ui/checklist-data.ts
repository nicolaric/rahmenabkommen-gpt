/**
 * The content of a `<checklist>` tag: Markdown task items, optionally under
 * plain group lines.
 *
 *   Woche 1
 *   - [ ] Canonicals prüfen
 *   - [x] Sitemap einreichen
 */

export type ChecklistItem = { text: string; checked: boolean };
export type ChecklistGroup = { title: string | null; items: ChecklistItem[] };

const ITEM_PATTERN = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s*)?(.*)$/;

export function parseChecklist(raw: string): ChecklistGroup[] {
  const groups: ChecklistGroup[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const item = line.match(ITEM_PATTERN);
    if (item) {
      const text = item[2].trim();
      if (!text) continue;
      if (groups.length === 0) groups.push({ title: null, items: [] });
      groups[groups.length - 1].items.push({
        text,
        checked: item[1] === 'x' || item[1] === 'X',
      });
      continue;
    }
    const title = line
      .trim()
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\*\*(.*)\*\*:?$/, '$1')
      .replace(/:$/, '');
    if (title) groups.push({ title, items: [] });
  }
  return groups.filter((group) => group.items.length > 0 || group.title);
}

/** A Markdown task list, with each item's state from `isChecked`. */
export function checklistToMarkdown(
  title: string | null,
  groups: ChecklistGroup[],
  isChecked: (groupIndex: number, itemIndex: number) => boolean = (g, i) =>
    groups[g].items[i].checked,
): string {
  const parts: string[] = title ? [`**${title}**`] : [];
  groups.forEach((group, groupIndex) => {
    const lines = group.items.map(
      (item, itemIndex) =>
        `- [${isChecked(groupIndex, itemIndex) ? 'x' : ' '}] ${item.text}`,
    );
    parts.push(
      [group.title ? `**${group.title}**` : null, ...lines]
        .filter(Boolean)
        .join('\n'),
    );
  });
  return parts.join('\n\n');
}
