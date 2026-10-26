import { cn } from '@eos/utils';
import {
  BookOpen,
  Brain,
  ChevronDown,
  ClipboardCheck,
  FileEdit,
  GitFork,
  Globe,
  Layers,
  ListChecks,
  MessageCircleQuestion,
  Search,
  Terminal,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ConversationT = ReturnType<typeof useTranslation<'conversation'>>['t'];

export type StepCategory =
  | 'search'
  | 'read'
  | 'list'
  | 'run'
  | 'edit'
  | 'plan'
  | 'check'
  | 'tool'
  | 'thinking'
  | 'clarification'
  | 'delegate'
  | 'web';

/**
 * Translated label per backend tool name. Tools missing here fall back to a
 * humanized version of their raw name, which reads as untranslated English in
 * a German or French conversation - so every built-in tool belongs in this map.
 * `category` only needs setting where the name-based heuristic guesses wrong.
 */
export const BUILT_IN_TOOL_STEPS: Record<
  string,
  {
    labelKey: string;
    category?: StepCategory;
    iconCategory?: StepCategory;
  }
> = {
  search_knowledge_base: { labelKey: 'thinking.stepSearch' },
  search_brain_knowledge: { labelKey: 'thinking.stepSearchBrain' },
  fetch_full_section: { labelKey: 'thinking.stepRead', category: 'read' },
  fetch_documents: {
    labelKey: 'thinking.stepFetchDocuments',
    category: 'read',
  },
  query_table: { labelKey: 'thinking.stepQueryTable', category: 'read' },
  list_document_templates: { labelKey: 'thinking.stepListTemplates' },
  create_document: {
    labelKey: 'thinking.stepCreateDocument',
    category: 'edit',
  },
  webfetch: {
    labelKey: 'thinking.stepWebfetch',
    category: 'read',
    iconCategory: 'web',
  },
  sandbox_execute: {
    labelKey: 'thinking.stepSandboxExecute',
    category: 'run',
  },
  external_tool: { labelKey: 'thinking.stepExternalTool' },
  ask_user_for_clarification: {
    labelKey: 'thinking.stepAskClarification',
    category: 'clarification',
  },
  delegate_to_subagent: {
    labelKey: 'thinking.stepDelegate',
    category: 'delegate',
  },
  context_check: { labelKey: 'thinking.stepCheck', category: 'check' },
  plan_query: { labelKey: 'thinking.stepPlan', category: 'plan' },
  // No category override: 'thinking' would make the reasoning handler fold
  // subsequent reasoning text into this step.
  synthesize_final_answer: {
    labelKey: 'thinking.stepThink',
    iconCategory: 'thinking',
  },
};

export type ToolStep = {
  label: string;
  detail: string;
  category?: StepCategory;
  iconCategory?: StepCategory;
  logs: string[];
  /** Right-aligned result summary, e.g. "10 results". */
  meta?: string;
  /** Distinct search queries, shown as a chip and listed when expanded. */
  queries?: string[];
};

export const formatTiming = (seconds: number | null | undefined) => {
  if (seconds == null || Number.isNaN(seconds)) {
    return '-';
  }

  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }

  return `${seconds.toFixed(2)}s`;
};

type ThinkingStepOptions = {
  hideWorkingStatus?: boolean;
};

/**
 * Turns raw trace events into the rows a thinking panel shows. Bound to the
 * active translation so every label and placeholder resolves in the
 * conversation's language.
 */
export function createThinkingStepTools(
  t: ConversationT,
  { hideWorkingStatus = false }: ThinkingStepOptions = {},
) {
  const getToolCategory = (event: any) => {
    if (event?.type !== 'tool_start' && event?.type !== 'bash_output') {
      return null;
    }

    if (event?.type === 'bash_output') return 'run';

    const tool = (event?.tool || '').toLowerCase();
    const desc = (event?.short_description || '').toLowerCase();

    if (tool.includes('bash') || tool === 'run_command') return 'run';
    if (tool.includes('edit') || tool.includes('write')) return 'edit';
    if (desc.includes('search') || tool.includes('search')) return 'search';
    if (desc.includes('read') || tool.includes('read')) return 'read';
    if (desc.includes('list') || tool.includes('list')) return 'list';

    return null;
  };

  /**
   * Turns a raw backend tool name into a readable label, so unknown tools read
   * as "Fetch documents" instead of a generic "Using tool".
   */
  const humanizeToolName = (toolName: string) => {
    const words = toolName
      .replace(/[_\-.]+/g, ' ')
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .trim()
      .toLowerCase();
    if (!words) return '';
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  /**
   * `thinking.working` is the placeholder the event builders assign when the
   * backend sent no description. Later events in the same step may replace it
   * with something real, so treat it as "still empty".
   */
  const isPlaceholderDetail = (detail: string | undefined) => {
    const trimmed = (detail ?? '').trim();
    return !trimmed || trimmed === String(t('thinking.working'));
  };

  /**
   * `hideWorkingStatus` exists to keep the bare "Arbeite..." status row out of
   * embedded conversations. It used to drop *every* step still carrying the
   * placeholder, which is every tool step until the backend fills in a
   * description - so a knowledge base search stayed invisible for the whole
   * stream and only surfaced once a later event gave it a detail. A step with
   * its own label reads fine on the label alone, so only labelless ones go.
   */
  const isHiddenWorkingStep = (step: ToolStep) =>
    hideWorkingStatus &&
    isPlaceholderDetail(step.detail) &&
    !(step.label ?? '').trim();

  /**
   * Splits a step into the primary phrase and the monospaced argument beside
   * it. The placeholder must never reach the user, so the label carries the
   * row on its own in that case.
   */
  const getStepPresentation = (step: ToolStep) => {
    const placeholder = String(t('thinking.working'));
    const detail = (step.detail ?? '').trim();
    const isPlaceholder = isPlaceholderDetail(detail);
    const label = (step.label ?? '').trim();

    if (isPlaceholder) {
      return { primary: label || placeholder, argument: '' };
    }
    if (!label || detail === label) {
      return { primary: detail, argument: '' };
    }
    return { primary: label, argument: detail };
  };

  const formatToolStep = (event: any): Omit<ToolStep, 'logs'> => {
    const toolName = event?.tool as string | undefined;
    const rawDescription = (event?.short_description || '').toString().trim();

    const category = (getToolCategory(event) ?? 'tool') as ToolStep['category'];
    const isRun = category === 'run';
    const isEdit = category === 'edit';

    if (isRun) {
      return {
        label: String(t('thinking.stepRun')),
        detail: rawDescription || String(t('thinking.working')),
        category,
      };
    }

    if (isEdit) {
      return {
        label: String(t('thinking.stepEdit')),
        detail: rawDescription || String(t('thinking.working')),
        category,
      };
    }

    const builtInStep = toolName ? BUILT_IN_TOOL_STEPS[toolName] : undefined;
    if (builtInStep) {
      return {
        label: String(t(builtInStep.labelKey as any)),
        detail: rawDescription || String(t('thinking.working')),
        category: builtInStep.category ?? category,
        iconCategory: builtInStep.iconCategory,
      };
    }

    return {
      label: toolName
        ? humanizeToolName(toolName) || String(t('thinking.stepTool'))
        : String(t('thinking.stepTool')),
      detail: rawDescription || String(t('thinking.working')),
      category,
    };
  };

  const buildThinkingSteps = (traceEvents: any[]) => {
    const steps: ToolStep[] = [];

    traceEvents
      .filter((event: any) =>
        [
          'tool_start',
          'tool_end',
          'retrieval_info',
          'fetch_section_info',
          'context_check_info',
          'plan_info',
          'subagent_results',
          'reasoning',
        ].includes(event?.type),
      )
      // Status events ("Agent wird ausgewählt...", "Nächster Schritt wird
      // entschieden...", "Antwort wird erstellt...") are bookkeeping of the
      // pipeline, and the live header already says the model is working, so
      // they never become steps.
      .forEach((event: any) => {
        if (event.type === 'reasoning') {
          const content = String(event.content ?? '').trim();
          if (!content) return;

          const currentStep = steps[steps.length - 1];
          if (currentStep?.category === 'thinking') {
            currentStep.logs.push(content);
          } else {
            steps.push({
              label: String(t('thinking.stepThink')),
              detail: content,
              category: 'thinking',
              logs: [],
            });
          }
          return;
        }

        if (event.type === 'tool_start') {
          const logs: string[] = [];
          const details = event?.details;
          if (details != null) {
            logs.push(
              typeof details === 'string'
                ? details
                : JSON.stringify(details, null, 2),
            );
          }

          steps.push({ ...formatToolStep(event), logs });
          return;
        }

        const currentStep = steps[steps.length - 1];

        if (event.type === 'tool_end' && !currentStep) {
          const toolName = event?.tool ? String(event.tool) : '';
          const builtInStep = BUILT_IN_TOOL_STEPS[toolName];
          const derivedCategory = (getToolCategory({
            ...event,
            type: 'tool_start',
          }) ?? 'tool') as StepCategory;
          const category = builtInStep?.category ?? derivedCategory;
          const label = builtInStep
            ? String(t(builtInStep.labelKey as any))
            : category === 'run'
              ? String(t('thinking.stepRun'))
              : category === 'edit'
                ? String(t('thinking.stepEdit'))
                : toolName
                  ? humanizeToolName(toolName) || String(t('thinking.stepTool'))
                  : String(t('thinking.stepTool'));

          // Collect logs from details
          const logs: string[] = [];

          // For sandbox_execute, add the code that was executed
          if (toolName === 'sandbox_execute' && event?.code) {
            logs.push('Code:');
            logs.push(event.code);
            if (event?.input) {
              logs.push('Input:');
              logs.push(JSON.stringify(event.input, null, 2));
            }
          }

          const details = event?.details;
          if (details && typeof details === 'string' && details.trim()) {
            if (toolName === 'sandbox_execute') {
              logs.push('Result:');
              logs.push(details.trim());
            } else {
              logs.push(details.trim());
            }
          } else if (details) {
            // If details is an object or other non-string, stringify it
            if (toolName === 'sandbox_execute') {
              logs.push('Result:');
              logs.push(String(details));
            } else {
              logs.push(String(details));
            }
          }

          steps.push({
            label,
            detail: String(event?.summary || t('thinking.working')),
            category,
            iconCategory: builtInStep?.iconCategory,
            logs,
          });
          return;
        }

        if (event.type === 'retrieval_info') {
          if (!currentStep) {
            steps.push({
              label: String(t('thinking.stepSearch')),
              // Left as the placeholder so the query below can claim the row.
              detail: String(t('thinking.working')),
              category: 'search',
              logs: [],
            });
          }
          const activeStep = steps[steps.length - 1];
          if (!activeStep) return;
          const queries = Array.isArray(event.queries)
            ? event.queries.filter(Boolean)
            : event.queries
              ? [String(event.queries)]
              : [];
          if (queries.length > 0) {
            // Promote the queries onto the row itself; the search tool_start
            // rarely carries a short_description, so this is the only place
            // the user can see what was actually searched for. The rewrites
            // often repeat a query, so keep each one once.
            const known = activeStep.queries ?? [];
            const seen = new Set(known.map((query) => query.toLowerCase()));
            for (const raw of queries) {
              const query = String(raw).trim();
              if (!query || seen.has(query.toLowerCase())) continue;
              seen.add(query.toLowerCase());
              known.push(query);
            }
            activeStep.queries = known;
            if (isPlaceholderDetail(activeStep.detail)) {
              activeStep.detail = known.join(', ');
            }
          }
          if (event.vector_alpha != null) {
            activeStep.logs.push(
              `${String(t('thinking.alphaLabel'))}: ${event.vector_alpha}`,
            );
          }
          if (event.avg_score != null) {
            activeStep.logs.push(
              `${String(t('thinking.avgScoreLabel'))}: ${event.avg_score}`,
            );
          }

          if (event.count != null) {
            activeStep.meta = `${event.count} ${String(t('thinking.chunksLabel'))}`;
            const files = Array.isArray(event.top_sources)
              ? event.top_sources.filter(Boolean).length
              : 0;
            if (files > 0) {
              activeStep.logs.push(
                String(
                  t('thinking.foundChunksInFiles', {
                    count: event.count,
                    files,
                  }),
                ),
              );
            } else {
              activeStep.logs.push(
                `${String(t('thinking.foundPrefix'))} ${event.count} ${String(t('thinking.chunksLabel'))}`,
              );
            }
          }
          return;
        }

        if (event.type === 'fetch_section_info') {
          if (!currentStep) {
            steps.push({
              label: String(t('thinking.stepRead')),
              detail: String(t('thinking.sectionExpansion')),
              category: 'read',
              logs: [],
            });
          }
          const activeStep = steps[steps.length - 1];
          if (!activeStep) return;
          const isReadStep = activeStep.category === 'read';
          if (
            isReadStep &&
            event.file_filter &&
            (!activeStep.detail ||
              activeStep.detail === String(t('thinking.working')))
          ) {
            activeStep.detail = event.file_filter;
          }

          const addedChunks = event.added_chunks;
          if (addedChunks != null) {
            activeStep.logs.push(
              `${String(t('thinking.sectionExpansion'))}: +${addedChunks} ${String(t('thinking.chunksLabel'))}`,
            );
          }
          if (event.status && event.status !== 'ok') {
            activeStep.logs.push(`Status: ${event.status}`);
          }
          return;
        }

        if (event.type === 'context_check_info') {
          if (!currentStep) {
            steps.push({
              label: String(t('thinking.stepCheck')),
              detail: String(t('thinking.contextCheckPrefix')),
              category: 'check',
              logs: [],
            });
          }
          const activeStep = steps[steps.length - 1];
          if (!activeStep) return;
          activeStep.category = 'check';
          if (event.status) {
            activeStep.logs.push(
              `${String(t('thinking.contextCheckPrefix'))}: ${event.status}`,
            );
          }
          const gaps = Array.isArray(event.gaps)
            ? event.gaps.filter(Boolean)
            : [];
          if (gaps.length > 0) {
            activeStep.logs.push(
              `${String(t('thinking.missingLabel'))}: ${gaps.join(', ')}`,
            );
            activeStep.logs.push(
              `${String(t('thinking.vectorSearch'))} ${String(t('thinking.queriesLabel'))} ${gaps.join(', ')}`,
            );
          }
          return;
        }

        if (event.type === 'plan_info') {
          if (!currentStep) {
            steps.push({
              label: String(t('thinking.stepPlan')),
              detail: event.plan_summary
                ? String(event.plan_summary)
                : String(t('thinking.working')),
              category: 'plan',
              logs: [],
            });
          }
          const activeStep = steps[steps.length - 1];
          if (!activeStep) return;
          activeStep.category = 'plan';
          if (event.plan_summary) {
            const summary = String(event.plan_summary);
            if (
              !activeStep.detail ||
              activeStep.detail === String(t('thinking.working'))
            ) {
              activeStep.detail = summary;
            } else if (activeStep.detail !== summary) {
              activeStep.logs.push(summary);
            }
          }
          const checklist = Array.isArray(event.checklist)
            ? event.checklist.filter(Boolean).map(String)
            : [];
          const checklistStepIndex =
            typeof event.checklist_step_index === 'number'
              ? event.checklist_step_index
              : null;
          const checklistCurrentStep = event.checklist_current_step
            ? String(event.checklist_current_step)
            : null;
          if (checklist.length > 0) {
            activeStep.logs.push('Checklist:');
            checklist.forEach((item: string, index: number) => {
              const isCurrent = checklistStepIndex === index;
              const prefix = isCurrent ? '→ ' : '';
              activeStep.logs.push(`${prefix}${index + 1}. ${item}`);
            });
            if (
              checklistCurrentStep &&
              (checklistStepIndex == null || checklistStepIndex < 0)
            ) {
              activeStep.logs.push(`Current: ${checklistCurrentStep}`);
            }
          }
          if (event.task_graph_length != null) {
            activeStep.logs.push(
              `${String(t('thinking.tasksLabel'))}: ${event.task_graph_length}`,
            );
          }
          return;
        }

        if (event.type === 'subagent_results') {
          if (!currentStep) {
            steps.push({
              label: String(t('thinking.stepDelegate')),
              detail: String(t('thinking.subagentResultsReceived')),
              category: 'delegate',
              logs: [],
            });
          }
          const activeStep = steps[steps.length - 1];
          if (!activeStep) return;
          if (
            !activeStep.detail ||
            activeStep.detail === String(t('thinking.working'))
          ) {
            activeStep.detail = String(
              event.summary || t('thinking.subagentResultsReceived'),
            );
          }
          const results = Array.isArray(event.results)
            ? event.results.filter(Boolean)
            : [];
          results.forEach((result: any) => {
            const question = result?.question ? String(result.question) : null;
            const count = result?.retrieved_count;
            if (question) {
              const suffix =
                count != null
                  ? ` (${count} ${String(t('thinking.chunksLabel'))})`
                  : '';
              activeStep.logs.push(`${question}${suffix}`);
            }
            const queries = Array.isArray(result?.queries)
              ? result.queries.filter(Boolean)
              : [];
            if (queries.length > 0) {
              activeStep.logs.push(
                `${String(t('thinking.queriesLabel'))} ${queries.join(', ')}`,
              );
            }
          });
        }
      });

    return steps;
  };

  return { buildThinkingSteps, isHiddenWorkingStep, getStepPresentation };
}

const ansiRegex = new RegExp(String.raw`\x1b\[[0-9;]*m`, 'g');
const ansiColorMap: Record<number, string> = {
  30: 'text-gray-400',
  31: 'text-rose-400',
  32: 'text-emerald-400',
  33: 'text-amber-400',
  34: 'text-sky-400',
  35: 'text-fuchsia-400',
  36: 'text-cyan-400',
  37: 'text-gray-200',
  90: 'text-gray-500',
  91: 'text-rose-300',
  92: 'text-emerald-300',
  93: 'text-amber-300',
  94: 'text-sky-300',
  95: 'text-fuchsia-300',
  96: 'text-cyan-300',
  97: 'text-white',
};

const renderAnsiText = (input: string) => {
  const parts: Array<{ text: string; className?: string }> = [];
  let lastIndex = 0;
  let currentClass: string | undefined;
  let dimmed = false;
  let isBold = false;

  const regex = new RegExp(ansiRegex);
  let match = regex.exec(input);
  while (match) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const text = input.slice(lastIndex, index);
      const classNames = [
        currentClass,
        dimmed ? 'opacity-70' : '',
        isBold ? 'font-semibold' : '',
      ]
        .filter(Boolean)
        .join(' ');
      parts.push({ text, className: classNames || undefined });
    }

    const codes = match[0]
      .slice(2, -1)
      .split(';')
      .map((value: string) => Number(value));
    for (const code of codes) {
      if (code === 0) {
        currentClass = undefined;
        dimmed = false;
        isBold = false;
      } else if (code === 1) {
        isBold = true;
      } else if (code === 2) {
        dimmed = true;
      } else if (ansiColorMap[code]) {
        currentClass = ansiColorMap[code];
      }
    }

    lastIndex = index + match[0].length;
    match = regex.exec(input);
  }

  if (lastIndex < input.length) {
    const text = input.slice(lastIndex);
    const classNames = [
      currentClass,
      dimmed ? 'opacity-70' : '',
      isBold ? 'font-semibold' : '',
    ]
      .filter(Boolean)
      .join(' ');
    parts.push({ text, className: classNames || undefined });
  }

  return parts.map((part, index) => (
    <span key={`ansi-${index}`} className={part.className}>
      {part.text}
    </span>
  ));
};

function BashLine({ line }: { line: string }) {
  const timingRegex = /(\d+(?:\.\d+)?(?:ms|s))/g;
  const timing = line.match(timingRegex)?.[0];

  return (
    <div className="font-mono text-[12px] leading-relaxed w-full flex justify-between items-baseline opacity-80 group">
      <span className="truncate text-gray-600 dark:text-gray-400">
        {renderAnsiText(line.replace(/^>\s*/, ''))}
      </span>
      {timing && (
        <span className="text-[10px] text-gray-500 dark:text-gray-600 font-mono ml-4 shrink-0">
          {timing}
        </span>
      )}
    </div>
  );
}

export const getStreamingOutput = (traceEvents: any[]) =>
  traceEvents
    .filter((event: any) => event?.type === 'bash_output')
    .map((event: any) => event?.line ?? event?.output ?? event?.data ?? '')
    .filter((line: string) => line && line.trim().length > 0);

export const buildThinkingGroups = (traceEvents: any[]) => {
  const groups: Array<{ id: string; blockId: string | null; events: any[] }> =
    [];
  const groupsById = new Map<string, (typeof groups)[number]>();
  let currentBlockId: string | null = null;

  traceEvents.forEach((event: any, index: number) => {
    const eventBlockId =
      typeof event?.block_id === 'string' ? event.block_id : null;
    if (eventBlockId) currentBlockId = eventBlockId;
    const blockId = eventBlockId ?? currentBlockId;
    const id = blockId ?? 'legacy';
    let group = groupsById.get(id);
    if (!group) {
      group = { id: `${id}-${index}`, blockId, events: [] };
      groupsById.set(id, group);
      groups.push(group);
    }
    group.events.push(event);
  });

  return groups;
};

export type ThinkingPanelPlacement = {
  key: string;
  events: any[];
  /** Output block the panel renders after; null renders it before them all. */
  outputBlockIndex: number | null;
  lastGroupId: string;
};

/**
 * Splits a message's trace into the panels rendered between its output blocks.
 *
 * Answer text is what separates one stretch of work from the next. A run of
 * thinking groups with no text between them is a single stretch, so it renders
 * as one panel with one "worked for" summary covering the whole run, instead of
 * a stack of one-line panels each claiming its own duration. Tool cards between
 * the groups keep their own place; the merged panel lands on the last group's
 * slot, directly before the text that ends the run.
 */
export function buildThinkingPanels(traceEvents: any[], outputBlocks: any[]) {
  const thinkingGroups = buildThinkingGroups(traceEvents);
  const outputBlockIds: Array<string | null> = outputBlocks.map(
    (block: any) => {
      if (block.type === 'text') return block.id;
      if (block.type !== 'tool_call') return null;
      return (
        traceEvents.find(
          (event: any) =>
            (event.type === 'tool_start' || event.type === 'tool_end') &&
            event.tool_call_id &&
            event.tool_call_id === block.id,
        )?.block_id ?? null
      );
    },
  );
  const placements = thinkingGroups.map((group) => {
    const matchingIndexes: number[] = [];
    if (group.blockId) {
      outputBlockIds.forEach((blockId, blockIndex) => {
        if (blockId === group.blockId) matchingIndexes.push(blockIndex);
      });
    }
    return {
      group,
      outputBlockIndex:
        matchingIndexes.length > 0
          ? matchingIndexes[matchingIndexes.length - 1]
          : null,
    };
  });
  const hasInterleavedThinking = placements.some(
    ({ outputBlockIndex }) => outputBlockIndex != null,
  );

  // Only text that actually renders separates two stretches of work. A
  // streamed turn routinely opens an empty text block before the model writes
  // into it; counting that as a separator left two panels stacked with nothing
  // visible between them.
  const isVisibleText = (block: any) =>
    block?.type === 'text' && String(block.text ?? '').trim() !== '';
  const textBlocksThrough = (blockIndex: number) => {
    let count = 0;
    for (let index = 0; index <= blockIndex; index += 1) {
      if (isVisibleText(outputBlocks[index])) count += 1;
    }
    return count;
  };

  const panels: Array<ThinkingPanelPlacement & { segment: number }> = [];
  placements.forEach(({ group, outputBlockIndex }) => {
    const segment =
      outputBlockIndex == null ? 0 : textBlocksThrough(outputBlockIndex);
    const open = panels[panels.length - 1];
    if (open && open.segment === segment) {
      open.events = [...open.events, ...group.events];
      open.outputBlockIndex = outputBlockIndex;
      open.lastGroupId = group.id;
      return;
    }
    panels.push({
      segment,
      key: group.id,
      events: group.events,
      outputBlockIndex,
      lastGroupId: group.id,
    });
  });

  return {
    panels,
    hasInterleavedThinking,
    lastThinkingGroupId: placements[placements.length - 1]?.group.id,
  };
}

/**
 * Seconds a panel itself covers. Every trace event carries the elapsed time
 * since the request started, so a panel spans from the event just before it
 * to its own last timed event. Interleaved panels used to print the whole
 * message's total, which read as every thinking block having taken exactly as
 * long as the full answer.
 */
export function getPanelElapsed(events: any[], traceEvents: any[]) {
  const elapsedAt = (event: any) => {
    const value = event?.timings?.response_time;
    return typeof value === 'number' ? value : null;
  };
  let end: number | null = null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    end = elapsedAt(events[index]);
    if (end != null) break;
  }
  if (end == null) return null;

  let start = 0;
  for (let index = traceEvents.indexOf(events[0]) - 1; index >= 0; index -= 1) {
    const value = elapsedAt(traceEvents[index]);
    if (value != null) {
      start = value;
      break;
    }
  }
  return Math.max(0, end - start);
}

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

/** Each cell lights up as a chevron wavefront driving right. */
const DRIVE_DELAYS = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return (column + Math.abs(row - 1)) * 0.09;
});

/**
 * A 3×3 pixel grid with a chevron wave sweeping through it. The 650ms cycle is
 * shorter than the sweep, so two fronts are always in flight.
 */
function DriveLoader() {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px] text-slate-700 dark:text-slate-200"
    >
      {DRIVE_DELAYS.map((delay, index) => (
        <motion.span
          key={index}
          className="size-[4px] rounded-[1px] bg-current"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{
            duration: 0.65,
            ease: 'easeInOut',
            delay,
            repeat: Infinity,
          }}
        />
      ))}
    </span>
  );
}

/** Seconds since mount, ticking every tenth of a second. */
function LiveElapsed() {
  const [tenths, setTenths] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTenths((value) => value + 1), 100);
    return () => clearInterval(timer);
  }, []);
  const seconds = tenths / 10;
  return (
    <span className="font-mono text-[12px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
      {seconds < 60
        ? `${seconds.toFixed(1)}s`
        : `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(1)}s`}
    </span>
  );
}

/**
 * A highlight sweeping through muted text. The gradient tile is twice the
 * text's width and repeats, so moving it by exactly one tile loops seamlessly.
 */
function ShimmerText({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="whitespace-nowrap bg-[linear-gradient(90deg,var(--shimmer-base)_35%,var(--shimmer-highlight)_50%,var(--shimmer-base)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent [--shimmer-base:var(--color-slate-400)] [--shimmer-highlight:var(--color-slate-800)] dark:[--shimmer-base:var(--color-slate-500)] dark:[--shimmer-highlight:var(--color-slate-100)]"
      initial={{ backgroundPosition: '100% 0' }}
      animate={{ backgroundPosition: '-100% 0' }}
      transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
    >
      {children}
    </motion.span>
  );
}

function StepIcon({
  category,
  active,
}: {
  category: ToolStep['category'];
  active: boolean;
}) {
  if (active) {
    return (
      <span className="size-3 animate-spin rounded-full border-[1.5px] border-slate-300 border-t-slate-600 dark:border-white/15 dark:border-t-slate-300" />
    );
  }
  const cls = 'size-3.5 text-slate-400 dark:text-slate-500';
  switch (category) {
    case 'search':
      return <Search className={cls} />;
    case 'read':
      return <BookOpen className={cls} />;
    case 'list':
      return <Layers className={cls} />;
    case 'run':
      return <Terminal className={cls} />;
    case 'edit':
      return <FileEdit className={cls} />;
    case 'plan':
      return <ListChecks className={cls} />;
    case 'check':
      return <ClipboardCheck className={cls} />;
    case 'thinking':
      return <Brain className={cls} />;
    case 'clarification':
      return <MessageCircleQuestion className={cls} />;
    case 'delegate':
      return <GitFork className={cls} />;
    case 'web':
      return <Globe className={cls} />;
    default:
      return <Wrench className={cls} />;
  }
}

type ThinkingPanelProps = {
  panelKey: string;
  /** The trace events this panel covers. */
  events: any[];
  /** The message's whole trace, used to time where this panel starts. */
  traceEvents: any[];
  /** Whether this is the panel the model is currently working in. */
  isActive: boolean;
  isSending: boolean;
  /**
   * Elapsed time to show when the events carry none. The live status timings
   * keep ticking after the last trace event, so they fit the active panel.
   */
  fallbackElapsed?: number | null;
  hideWorkingStatus?: boolean;
};

/**
 * The agent's trace for one stretch of work: a shimmering "Thinking" header
 * while the model works, then a "Worked for Xs" disclosure over the steps it
 * took. The steps unfold while the panel is live and fold away once it
 * settles; an explicit toggle by the user wins over both.
 */
export function ThinkingPanel({
  panelKey,
  events,
  traceEvents,
  isActive,
  isSending,
  fallbackElapsed = null,
  hideWorkingStatus = false,
}: ThinkingPanelProps) {
  const { t } = useTranslation('conversation');
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>(
    {},
  );
  const { buildThinkingSteps, isHiddenWorkingStep, getStepPresentation } =
    createThinkingStepTools(t, { hideWorkingStatus });
  const steps = buildThinkingSteps(events).filter(
    (step) => !isHiddenWorkingStep(step),
  );
  const working = isActive && isSending;

  if (steps.length === 0) {
    // A finished answer without steps needs no panel at all.
    if (!working) return null;
    return (
      <div
        className="not-prose mb-4 animate-in fade-in duration-300"
        data-testid={`thinking-panel-${panelKey}`}
      >
        <div
          role="status"
          className="flex w-fit items-center gap-2.5 px-0.5 py-1 text-[13px] font-medium"
        >
          <DriveLoader />
          <ShimmerText>{t('thinking.label')}</ShimmerText>
          <LiveElapsed />
        </div>
      </div>
    );
  }

  const lastStepIndex = steps.length - 1;
  const lastRunIndex = steps.reduce(
    (lastIndex, step, stepIndex) =>
      step.category === 'run' ? stepIndex : lastIndex,
    -1,
  );
  const streamingOutput = getStreamingOutput(events);
  const elapsed =
    getPanelElapsed(events, traceEvents) ?? (isActive ? fallbackElapsed : null);
  const isOpen = openOverride ?? working;

  return (
    <div
      className="not-prose mb-4 animate-in fade-in duration-300"
      data-testid={`thinking-panel-${panelKey}`}
    >
      <button
        type="button"
        onClick={() => setOpenOverride(!isOpen)}
        aria-expanded={isOpen}
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-medium transition-colors duration-100 hover:bg-slate-100 dark:hover:bg-white/5"
        data-testid={`thinking-summary-${panelKey}`}
      >
        {working ? (
          <>
            <DriveLoader />
            <ShimmerText>{t('thinking.label')}</ShimmerText>
            <LiveElapsed />
          </>
        ) : (
          <>
            {/* A size-4 box keeps the chevron centred over the step rail. */}
            <span className="flex size-4 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500">
              <ChevronDown
                aria-hidden="true"
                strokeWidth={2.2}
                className={cn(
                  'size-3 transition-transform duration-200',
                  !isOpen && '-rotate-90',
                )}
              />
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="whitespace-nowrap text-slate-600 dark:text-slate-300"
            >
              {elapsed != null
                ? t('thinking.workedFor', {
                    defaultValue: 'Worked for {{duration}}',
                    duration: formatTiming(elapsed),
                  })
                : t('thinking.agentStepsCount', { count: steps.length })}
            </motion.span>
          </>
        )}
      </button>
      {/* Collapsing rows from 1fr to 0fr animates to the content's real
          height, and keeping the steps mounted lets a reopen skip replaying
          every row's entrance. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
        inert={!isOpen}
      >
        <div className="overflow-hidden">
          <div className="relative mt-0.5 ml-[7px] pl-4">
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-1 left-0 w-px bg-slate-200 dark:bg-white/10"
            />
            <div className="flex flex-col gap-0.5 py-1">
              {steps.map((step, stepIndex) => {
                const isActiveStep = working && stepIndex === lastStepIndex;
                const showRunOutput =
                  step.category === 'run' && stepIndex === lastRunIndex;
                const showLogs = expandedSteps[stepIndex] ?? false;
                const queries = step.queries ?? [];
                const isExpandable = step.logs.length > 0 || queries.length > 1;
                const toggleLogs = () =>
                  setExpandedSteps((prev) => ({
                    ...prev,
                    [stepIndex]: !prev[stepIndex],
                  }));
                const presentation = getStepPresentation(step);
                // Several searches collapse into a count; each query then
                // gets its own row when expanded.
                const primary =
                  queries.length > 1
                    ? t('thinking.ranSearches', {
                        count: queries.length,
                        defaultValue: 'Ran {{count}} searches',
                      })
                    : presentation.primary;
                const chip =
                  queries.length === 1
                    ? queries[0]
                    : queries.length > 1
                      ? ''
                      : presentation.argument;
                const monoChip =
                  queries.length === 1 ||
                  ['run', 'edit', 'web'].includes(
                    step.iconCategory ?? step.category ?? '',
                  );

                return (
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
                  >
                    <div
                      className={cn(
                        'group/row -mx-1.5 flex h-7 min-w-0 items-center gap-2 rounded-md px-1.5 text-[12.5px] transition-colors duration-200',
                        isActiveStep
                          ? 'text-slate-800 dark:text-slate-100'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                        isExpandable &&
                          'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5',
                      )}
                      onClick={isExpandable ? toggleLogs : undefined}
                      onKeyDown={
                        isExpandable
                          ? (event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') {
                                return;
                              }
                              event.preventDefault();
                              toggleLogs();
                            }
                          : undefined
                      }
                      role={
                        isExpandable
                          ? 'button'
                          : isActiveStep
                            ? 'status'
                            : undefined
                      }
                      aria-expanded={isExpandable ? showLogs : undefined}
                      tabIndex={isExpandable ? 0 : undefined}
                    >
                      {/* An expandable row trades its icon for a chevron on
                          hover and while open. */}
                      <span
                        aria-hidden="true"
                        className="relative flex size-3.5 shrink-0 items-center justify-center"
                      >
                        <span
                          className={cn(
                            'flex transition-opacity duration-100',
                            isExpandable &&
                              !isActiveStep &&
                              'group-hover/row:opacity-0',
                            isExpandable &&
                              !isActiveStep &&
                              showLogs &&
                              'opacity-0',
                          )}
                        >
                          <StepIcon
                            category={step.iconCategory ?? step.category}
                            active={isActiveStep}
                          />
                        </span>
                        {isExpandable && !isActiveStep ? (
                          <ChevronDown
                            strokeWidth={2.2}
                            className={cn(
                              'absolute size-3 text-slate-400 transition-[opacity,transform] duration-150 group-hover/row:opacity-100 dark:text-slate-500',
                              showLogs ? 'opacity-100' : '-rotate-90 opacity-0',
                            )}
                          />
                        ) : null}
                      </span>
                      <span className="shrink-0 whitespace-nowrap">
                        {primary}
                      </span>
                      {queries.length === 1 ? (
                        <span className="shrink-0 whitespace-nowrap">
                          {t('thinking.searchFor', { defaultValue: 'for' })}
                        </span>
                      ) : null}
                      {chip ? (
                        <span
                          className={cn(
                            'min-w-0 truncate text-[11.5px] text-slate-400 transition-colors group-hover/row:text-slate-500 dark:text-slate-500 dark:group-hover/row:text-slate-400',
                            monoChip && 'font-mono',
                          )}
                          title={chip}
                        >
                          {chip}
                        </span>
                      ) : null}
                      {step.meta ? (
                        <span className="ml-auto shrink-0 pl-2 text-[11.5px] font-normal text-slate-400 tabular-nums dark:text-slate-500">
                          {step.meta}
                        </span>
                      ) : null}
                    </div>
                    <AnimatePresence initial={false}>
                      {isExpandable && showLogs && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
                          className="overflow-hidden"
                        >
                          {queries.length > 1 ? (
                            <div className="mt-0.5 ml-[22px] flex flex-col">
                              {queries.map((query) => (
                                <div
                                  key={query}
                                  className="group/row flex h-6 min-w-0 items-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400"
                                >
                                  <Search
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                                  />
                                  <span className="shrink-0 whitespace-nowrap transition-colors group-hover/row:text-slate-900 dark:group-hover/row:text-slate-100">
                                    {t('thinking.searchedKnowledgeBase', {
                                      defaultValue: 'Searched knowledge base',
                                    })}
                                  </span>
                                  <span className="shrink-0 whitespace-nowrap transition-colors group-hover/row:text-slate-900 dark:group-hover/row:text-slate-100">
                                    {t('thinking.searchFor', {
                                      defaultValue: 'for',
                                    })}
                                  </span>
                                  <span
                                    className="min-w-0 truncate font-mono text-[11.5px] text-slate-400 transition-colors group-hover/row:text-slate-500 dark:text-slate-500 dark:group-hover/row:text-slate-400"
                                    title={query}
                                  >
                                    {query}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              'mt-0.5 mb-1 ml-[7px] flex flex-col gap-0.5 border-l border-slate-200 py-0.5 pl-3.5 dark:border-white/10',
                              step.logs.length === 0 && 'hidden',
                            )}
                          >
                            {step.logs.map((log, logIndex) => (
                              <span
                                key={logIndex}
                                className="font-mono text-[11px] leading-[1.6] break-words text-slate-400 dark:text-slate-500"
                              >
                                {log}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {showRunOutput && streamingOutput.length > 0 ? (
                      <div className="mt-0.5 ml-[22px] space-y-0.5">
                        {streamingOutput.map((line, lineIndex) => (
                          <BashLine key={lineIndex} line={line} />
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
