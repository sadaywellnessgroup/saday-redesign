'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/provider/chip-group';
import { saveFlowAction, sendTestAction, type FlowFormInput } from '@/app/(admin)/admin/follow-ups/actions';
import type { FollowUpFlowKind, FollowUpQuestion } from '@/lib/domain';

type DraftQuestion = FollowUpQuestion & { optionsText?: string };

/** One org-wide flow editor (D-023) — check-in and feedback are two
 * instances of the same shape. Questions here are restricted to text /
 * single-choice per D-020's brief; existing scale/boolean questions from
 * the fixture data are shown read-only-typed but still editable in text. */
export function FlowEditor({
  kind,
  title,
  hoursHint,
  initial,
  labels,
}: {
  kind: FollowUpFlowKind;
  title: string;
  hoursHint: string;
  initial: FlowFormInput;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FlowFormInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [isSendingTest, startTest] = useTransition();

  function set<K extends keyof FlowFormInput>(key: K, value: FlowFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }

  function addQuestion() {
    const q: FollowUpQuestion = {
      id: `q_${Date.now()}`,
      promptEn: '',
      promptHi: '',
      responseType: 'text',
    };
    setForm((prev) => ({ ...prev, questions: [...prev.questions, q] }));
  }

  function removeQuestion(index: number) {
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveFlowAction(kind, form);
      if (result.ok) {
        toast.success(labels.saved);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function sendTest() {
    startTest(async () => {
      const result = await sendTestAction(kind);
      if (result.ok) toast.success(labels.sendTestSent);
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="sec-title">{title}</h2>
          <div className="flex items-center gap-2">
            <Switch id={`${kind}-enabled`} checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
            <label htmlFor={`${kind}-enabled`} className="text-[13.5px] font-semibold text-ink">
              {labels.enabledLabel}
            </label>
          </div>
        </div>

        <Field label={labels.hoursLabel} hint={hoursHint}>
          <Input
            type="number"
            min={1}
            max={720}
            step={1}
            value={form.offsetHours}
            onChange={(e) => set('offsetHours', Number(e.target.value))}
            className="h-11 w-32"
          />
        </Field>

        <Field label={labels.messageEnLabel} hint={labels.messageHint}>
          <Textarea rows={2} value={form.messageBodyEn} onChange={(e) => set('messageBodyEn', e.target.value)} />
        </Field>
        <Field label={labels.messageHiLabel}>
          <Textarea rows={2} className="font-hindi" value={form.messageBodyHi} onChange={(e) => set('messageBodyHi', e.target.value)} />
        </Field>

        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">{labels.questionsLabel}</span>
          {form.questions.map((q, index) => (
            <div key={q.id} className="flex flex-col gap-2 rounded-soft bg-cream px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Input
                    value={q.promptEn}
                    onChange={(e) => updateQuestion(index, { promptEn: e.target.value })}
                    placeholder={labels.questionPromptEn}
                    className="h-10"
                    aria-label={labels.questionPromptEn}
                  />
                  <Input
                    value={q.promptHi}
                    onChange={(e) => updateQuestion(index, { promptHi: e.target.value })}
                    placeholder={labels.questionPromptHi}
                    className="h-10 font-hindi"
                    aria-label={labels.questionPromptHi}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  aria-label={labels.removeQuestion}
                  className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full text-terracotta-deep hover:bg-lilac-tint"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={q.responseType === 'choice' ? 'choice' : 'text'}
                  onChange={(e) =>
                    updateQuestion(index, { responseType: e.target.value === 'choice' ? 'choice' : 'text' })
                  }
                  className="h-9 rounded-full bg-card px-3 text-[13px] text-ink shadow-[inset_0_0_0_1.5px_var(--line)]"
                  aria-label={labels.questionType}
                >
                  <option value="text">{labels.questionTypeText}</option>
                  <option value="choice">{labels.questionTypeChoice}</option>
                </select>
                {q.responseType === 'choice' ? (
                  <Input
                    value={q.options?.join(', ') ?? ''}
                    onChange={(e) =>
                      updateQuestion(index, {
                        options: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder={labels.questionOptions}
                    className="h-9 min-w-0 flex-1"
                    aria-label={labels.questionOptions}
                  />
                ) : null}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="self-start" onClick={addQuestion}>
            <Plus className="h-4 w-4" /> {labels.addQuestion}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="lg" className="h-12" disabled={isPending} onClick={save}>
            {labels.save}
          </Button>
          <Button size="lg" variant="outline" className="h-12" disabled={isSendingTest} onClick={sendTest}>
            {labels.sendTest}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
