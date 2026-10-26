import type { ClarificationQuestion } from '@eos/data-access/api';
import {
  Button,
  Checkbox,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@eos/shared/ui';
import { ArrowRight } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Sentinel value for the free-text choice every question offers. */
const OTHER = '__other__';

type Answer = { selected: string[]; other: string };

type ClarificationFormProps = {
  questions: ClarificationQuestion[];
  onSubmit: (message: string) => void;
};

function answerLabels(answer: Answer | undefined): string[] {
  if (!answer) return [];
  return answer.selected.flatMap((value) => {
    if (value !== OTHER) return [value];
    const other = answer.other.trim();
    return other ? [other] : [];
  });
}

/**
 * Builds the user's reply as plain text. The form itself is never persisted,
 * so each answer repeats its question for the agent's next turn.
 */
export function formatClarificationAnswers(
  questions: ClarificationQuestion[],
  answers: Record<string, Answer>,
): string {
  return questions
    .map(
      (question) =>
        `${question.question}\n→ ${answerLabels(answers[question.id]).join(', ')}`,
    )
    .join('\n\n');
}

export function ClarificationForm({
  questions,
  onSubmit,
}: ClarificationFormProps) {
  const { t } = useTranslation('conversation');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const setAnswer = (questionId: string, next: Partial<Answer>) =>
    setAnswers((current) => {
      const previous = current[questionId] ?? { selected: [], other: '' };
      return { ...current, [questionId]: { ...previous, ...next } };
    });

  const complete = questions.every(
    (question) => answerLabels(answers[question.id]).length > 0,
  );

  return (
    <form
      aria-label={t('actions.clarificationForm')}
      className="mt-3 flex w-full flex-col gap-3 rounded-xl border p-3 animate-in fade-in duration-500"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) onSubmit(formatClarificationAnswers(questions, answers));
      }}
    >
      {questions.map((question, index) => {
        const answer = answers[question.id];
        const selected = answer?.selected ?? [];
        const otherSelected = selected.includes(OTHER);
        const choices = [
          ...question.options.map((option) => ({
            value: option.label,
            label: option.label,
            description: option.description,
          })),
          {
            value: OTHER,
            label: t('actions.clarificationOther'),
            description: null,
          },
        ];

        return (
          <Fragment key={question.id}>
            {index > 0 && <div aria-hidden className="h-px bg-border" />}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                {question.question}
              </legend>
              {question.multi_select ? (
                <div className="grid gap-2">
                  {choices.map((choice) => (
                    <label
                      key={choice.value}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={selected.includes(choice.value)}
                        onCheckedChange={(checked) =>
                          setAnswer(question.id, {
                            selected: checked
                              ? [...selected, choice.value]
                              : selected.filter((v) => v !== choice.value),
                          })
                        }
                      />
                      <ChoiceLabel {...choice} />
                    </label>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selected[0] ?? null}
                  onValueChange={(value) =>
                    setAnswer(question.id, { selected: [String(value)] })
                  }
                >
                  {choices.map((choice) => (
                    <label
                      key={choice.value}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <RadioGroupItem value={choice.value} className="mt-0.5" />
                      <ChoiceLabel {...choice} />
                    </label>
                  ))}
                </RadioGroup>
              )}
              {otherSelected && (
                <Input
                  autoFocus
                  aria-label={t('actions.clarificationOther')}
                  placeholder={t('actions.clarificationOtherPlaceholder')}
                  value={answer?.other ?? ''}
                  onChange={(event) =>
                    setAnswer(question.id, { other: event.target.value })
                  }
                />
              )}
            </fieldset>
          </Fragment>
        );
      })}
      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={!complete}
      >
        {t('actions.clarificationSubmit')}
        <ArrowRight aria-hidden className="size-4" />
      </Button>
    </form>
  );
}

function ChoiceLabel({
  label,
  description,
}: {
  label: string;
  description?: string | null;
}) {
  return (
    <span className="flex flex-col">
      <span>{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </span>
  );
}
