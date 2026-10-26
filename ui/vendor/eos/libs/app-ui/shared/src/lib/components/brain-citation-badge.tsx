import { Brain } from 'lucide-react';

type BrainCitationBadgeProps = {
  displayRef?: string | null;
  fallbackNumber: number;
};

export function BrainCitationBadge({
  displayRef,
  fallbackNumber,
}: BrainCitationBadgeProps) {
  const number = displayRef?.match(/\bbrain\s+(\d+)\b/i)?.[1] ?? fallbackNumber;
  const label = `Brain ${number}`;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-testid="brain-citation-badge"
      className="inline-flex h-5 min-w-[20px] items-center justify-center gap-0.5 align-middle rounded-full border border-primary/20 bg-primary/5 px-1.5 text-[11px] font-semibold text-primary"
    >
      <Brain aria-hidden="true" className="h-3 w-3 shrink-0" />
      <span>{number}</span>
    </span>
  );
}
