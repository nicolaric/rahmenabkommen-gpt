import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { maskIncompleteInlineMarkup } from '../streaming-markdown';
import { getUiIcon } from './icons';
import { ChartBlock } from './chart-block';
import { ChecklistBlock } from './checklist-block';
import { EmailBlock } from './email-block';
import { ResourceBlock } from './resource-block';
import { nodeText, parseUiBlock, type UiNode, type UiTextNode } from './parse';
import {
  badgeClasses,
  boxClasses,
  gridClasses,
  ICON_TILE_CLASSES,
  iconClasses,
  resolveProps,
  rowClasses,
  STAT_CLASSES,
  textClasses,
} from './registry';

type MarkdownComponents = React.ComponentProps<typeof Markdown>['components'];

type GenerativeUiBlockProps = {
  source: string;
  components?: MarkdownComponents;
  /** True while the block is still streaming in. */
  streaming?: boolean;
};

function lastTextNode(nodes: UiNode[]): UiTextNode | null {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (node.type === 'text') return node;
    const nested = lastTextNode(node.children);
    if (nested) return nested;
  }
  return null;
}

/**
 * Text inside a block is inline Markdown. Paragraphs are unwrapped so the text
 * sits inside rows and badges, but the message's own paragraph renderer still
 * runs on the children, which is what turns `[Doc 2]` into a citation.
 */
function useInlineComponents(components?: MarkdownComponents) {
  return React.useMemo<MarkdownComponents>(() => {
    const paragraph = components?.p;
    return {
      ...components,
      p: (props: any) => {
        const rendered =
          typeof paragraph === 'function'
            ? (paragraph as (props: any) => React.ReactElement<any>)(props)
            : null;
        return <>{rendered ? rendered.props.children : props.children}</>;
      },
    };
  }, [components]);
}

// Text in a block is inline. A line that starts like a list item, heading or
// quote ("1. Ziele definieren") is meant as text, so its marker is escaped
// before Markdown can turn it into an indented block.
export function escapeBlockMarkdown(text: string): string {
  return text
    .replace(/^(\s*)(\d+)([.)])(?=\s)/gm, '$1$2\\$3')
    .replace(/^(\s*)([-*+>]|#{1,6})(?=\s)/gm, '$1\\$2');
}

function InlineText({
  text,
  components,
}: {
  text: string;
  components: MarkdownComponents;
}) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {escapeBlockMarkdown(text)}
    </Markdown>
  );
}

/** One or more icons followed by exactly one piece of content. */
function isIconLedRow(children: UiNode[]): boolean {
  const content = children.filter(
    (child) => !(child.type === 'element' && child.tag === 'icon'),
  );
  return (
    content.length === 1 &&
    children[0].type === 'element' &&
    children[0].tag === 'icon' &&
    children[children.length - 1] === content[0]
  );
}

function renderNodes(
  nodes: UiNode[],
  context: {
    components: MarkdownComponents;
    maskedNode: UiTextNode | null;
    inRow: boolean;
    streaming: boolean;
  },
): React.ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'text') {
      const text =
        node === context.maskedNode
          ? maskIncompleteInlineMarkup(node.text)
          : node.text;
      const content = (
        <InlineText text={text} components={context.components} />
      );
      return context.inRow ? (
        <span key={index} className="min-w-0">
          {content}
        </span>
      ) : (
        <div key={index} className="min-w-0">
          {content}
        </div>
      );
    }

    const props = resolveProps(node.tag, node.props);
    switch (node.tag) {
      case 'box':
        return (
          <div key={index} className={boxClasses(props)}>
            {renderNodes(node.children, { ...context, inRow: false })}
          </div>
        );
      case 'row': {
        const iconLed = isIconLedRow(node.children);
        const children = renderNodes(node.children, {
          ...context,
          inRow: true,
        });
        return (
          <div key={index} className={rowClasses(props, { iconLed })}>
            {iconLed
              ? children.map((child, position) =>
                  position === children.length - 1 ? (
                    <div key={position} className="min-w-0 flex-1">
                      {child}
                    </div>
                  ) : (
                    child
                  ),
                )
              : children}
          </div>
        );
      }
      case 'text':
        return (
          <div key={index} className={textClasses(props)}>
            {renderNodes(node.children, { ...context, inRow: true })}
          </div>
        );
      case 'badge':
        return (
          <span key={index} className={badgeClasses(props)}>
            {renderNodes(node.children, { ...context, inRow: true })}
          </span>
        );
      case 'icon': {
        const Icon = getUiIcon(props.name);
        // One line tall, so the icon centres on the first line of the text
        // next to it. An unknown icon keeps its slot so rows stay aligned.
        const glyph = Icon ? (
          <Icon className={iconClasses(props)} />
        ) : (
          <span className={iconClasses(props)} />
        );
        return props.tile === true ? (
          <span key={index} aria-hidden className={ICON_TILE_CLASSES}>
            {glyph}
          </span>
        ) : (
          <span
            key={index}
            aria-hidden
            className="inline-flex h-[1lh] shrink-0 items-center"
          >
            {glyph}
          </span>
        );
      }
      case 'chart':
        return (
          <ChartBlock
            key={index}
            props={props}
            raw={nodeText(node.children)}
            pending={Boolean(node.open) && context.streaming}
            inline={(text) => (
              <InlineText text={text} components={context.components} />
            )}
          />
        );
      case 'checklist':
        return (
          <ChecklistBlock
            key={index}
            props={props}
            raw={nodeText(node.children)}
            inline={(text) => (
              <InlineText text={text} components={context.components} />
            )}
          />
        );
      case 'resource':
        return (
          <ResourceBlock
            key={index}
            props={props}
            raw={nodeText(node.children)}
            inline={(text) => (
              <InlineText text={text} components={context.components} />
            )}
          />
        );
      case 'email':
        return (
          <EmailBlock
            key={index}
            props={props}
            raw={nodeText(node.children)}
            pending={Boolean(node.open) && context.streaming}
          />
        );
      case 'grid':
        return (
          <div key={index} className="@container min-w-0">
            <div className={gridClasses(props)}>
              {renderNodes(node.children, { ...context, inRow: false })}
            </div>
          </div>
        );
      case 'stat': {
        const { label, value, hint } = props;
        const inline = (text: string) => (
          <InlineText text={text} components={context.components} />
        );
        // A tile without a value says nothing; its label still reads as text.
        if (typeof value !== 'string' || !value) {
          return typeof label === 'string' && label ? (
            <div key={index} className="min-w-0">
              {inline(label)}
            </div>
          ) : null;
        }
        return (
          <div key={index} className={STAT_CLASSES.tile}>
            {typeof label === 'string' && label ? (
              <div className={STAT_CLASSES.label}>{inline(label)}</div>
            ) : null}
            <div className={STAT_CLASSES.value}>{inline(value)}</div>
            {typeof hint === 'string' && hint ? (
              <div className={STAT_CLASSES.hint}>{inline(hint)}</div>
            ) : null}
          </div>
        );
      }
      case 'divider':
        return (
          <div
            key={index}
            role="separator"
            className="h-px w-full shrink-0 bg-border"
          />
        );
    }
  });
}

/** Renders one UI block from the assistant's message as native components. */
export function GenerativeUiBlock({
  source,
  components,
  streaming = false,
}: GenerativeUiBlockProps) {
  const nodes = React.useMemo(() => parseUiBlock(source), [source]);
  const inlineComponents = useInlineComponents(components);
  const maskedNode = streaming ? lastTextNode(nodes) : null;

  return (
    <div
      data-generative-ui=""
      className="my-4 flex min-w-0 flex-col gap-3 [&_p]:my-0"
    >
      {renderNodes(nodes, {
        components: inlineComponents,
        maskedNode,
        inRow: false,
        streaming,
      })}
    </div>
  );
}
