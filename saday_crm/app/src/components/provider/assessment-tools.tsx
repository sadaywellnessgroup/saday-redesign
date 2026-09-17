'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ClipboardList, Play } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-dots';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import { assignToolAction, submitClinicianRatedAction } from '@/app/(provider)/pro/patients/[id]/actions';
import { cn } from '@/lib/utils';

export interface ToolRow {
  id: string;
  code: string;
  name: string;
  administeredBy: 'self' | 'clinician' | 'either';
  itemCount: number;
  items: { id: string; prompt: string; options: { label: string; value: number }[] }[];
}

/* Assign a tool. Self-rated tools go to the patient's Track tab;
 * clinician-rated ones are run here (never exposed to the patient —
 * MantraCare digest §0.3 flags that exact mistake). */
export function AssignToolSheet({ patientId, tools }: { patientId: string; tools: ToolRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toolId, setToolId] = useState<string[]>([]);
  const [mode, setMode] = useState<string[]>(['self']);
  const [isPending, startTransition] = useTransition();

  const selected = tools.find((t) => t.id === toolId[0]);
  const modeOptions =
    selected?.administeredBy === 'either'
      ? [
          { value: 'self', label: 'Patient completes it' },
          { value: 'clinician', label: 'You administer it' },
        ]
      : selected?.administeredBy === 'clinician'
        ? [{ value: 'clinician', label: 'You administer it' }]
        : [{ value: 'self', label: 'Patient completes it' }];

  function assign() {
    if (!selected) return;
    const administeredBy = (modeOptions.some((m) => m.value === mode[0]) ? mode[0] : modeOptions[0]!.value) as
      | 'self'
      | 'clinician';
    startTransition(async () => {
      const result = await assignToolAction(patientId, selected.id, administeredBy);
      if (result.ok) {
        toast.success(`${selected.code} assigned.`);
        setOpen(false);
        setToolId([]);
        router.refresh();
      } else {
        toast.error('That tool cannot be assigned that way.');
      }
    });
  }

  return (
    <>
      <Button className="h-11" onClick={() => setOpen(true)}>
        <ClipboardList className="h-4 w-4" /> Assign a tool
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-softer sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Assign an assessment</SheetTitle>
            <SheetDescription>Free and public-domain tools only (D-024).</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 pt-4">
            <Field label="Tool">
              <ChipGroup
                options={tools.map((t) => ({ value: t.id, label: t.code }))}
                value={toolId}
                onChange={(next) => {
                  setToolId(next);
                  const tool = tools.find((t) => t.id === next[0]);
                  setMode([tool?.administeredBy === 'clinician' ? 'clinician' : 'self']);
                }}
                multiple={false}
                ariaLabel="Tool"
              />
            </Field>
            {selected ? (
              <>
                <p className="rounded-soft bg-cream px-4 py-3 text-sm text-ink-soft">
                  {selected.name} · {selected.itemCount} items
                </p>
                <Field label="Administration">
                  <ChipGroup options={modeOptions} value={mode} onChange={setMode} multiple={false} ariaLabel="Administration" />
                </Field>
              </>
            ) : null}
            <Button size="lg" className="h-12" disabled={!selected || isPending} onClick={assign}>
              Assign
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Inline runner for clinician-rated tools — one item at a time, back
 * allowed, progress bar (ui-references §B "Assessment runner"). */
export function ClinicianRunner({ patientId, tool }: { patientId: string; tool: ToolRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  const item = tool.items[index];
  const answered = Object.keys(answers).length;

  function choose(value: number) {
    if (!item) return;
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    if (index < tool.items.length - 1) setIndex(index + 1);
  }

  function submit() {
    startTransition(async () => {
      const result = await submitClinicianRatedAction(patientId, tool.id, answers);
      if (result.ok) {
        toast.success(`${tool.code} recorded.`);
        setOpen(false);
        setIndex(0);
        setAnswers({});
        router.refresh();
      } else {
        toast.error(result.error === 'incomplete' ? 'Answer every item first.' : 'That did not save.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cream px-4 text-[13.5px] font-semibold text-indigo shadow-[inset_0_0_0_1.5px_var(--line)]"
      >
        <Play className="h-3.5 w-3.5" /> Administer
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-softer sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{tool.code}</SheetTitle>
            <SheetDescription>
              Item {Math.min(index + 1, tool.items.length)} of {tool.items.length} · clinician-rated
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 pt-4">
            <ProgressBar total={tool.items.length} current={index} label={`${tool.code} progress`} />

            {item ? (
              <div className="flex flex-col gap-3">
                <p className="font-display text-[19px] leading-snug text-indigo-deep">{item.prompt}</p>
                <div className="flex flex-col gap-2">
                  {item.options.map((option) => {
                    const isSelected = answers[item.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose(option.value)}
                        className={cn(
                          'flex min-h-12 items-center justify-between rounded-soft px-4 text-left text-[14.5px] font-semibold transition-colors',
                          isSelected
                            ? 'bg-indigo text-cream'
                            : 'bg-cream text-ink shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint',
                        )}
                      >
                        {option.label}
                        <span className={cn('text-xs', isSelected ? 'text-cream/80' : 'text-ink-soft')}>{option.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-11" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                Back
              </Button>
              {index < tool.items.length - 1 ? (
                <Button
                  variant="outline"
                  className="ml-auto h-11"
                  disabled={!item || answers[item.id] === undefined}
                  onClick={() => setIndex(index + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="ml-auto h-11"
                  disabled={answered !== tool.items.length || isPending}
                  onClick={submit}
                >
                  Save score
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
