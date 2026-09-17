'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Lock, Search } from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import {
  PROFORMA_SECTIONS,
  SUBSTANCE_COLUMNS,
  sectionCompletion,
  type ProformaField,
  type ProformaSection,
  type ProformaValues,
} from '@/lib/clinical/proforma-spec';
import { ICD11_CODES } from '@/lib/clinical/icd11';
import { saveProformaDraftAction, signProformaAction } from '@/app/(provider)/pro/patients/[id]/proforma/actions';
import { cn } from '@/lib/utils';

export type ColumnValues = Record<string, ProformaValues>;

export interface ProformaState {
  id: string;
  patientId: string;
  columns: ColumnValues;
  diagnosisIcd11: string[];
  formulation: string;
  plan: string;
}

function CompletionMeta({ pct }: { pct: number }) {
  return (
    <span className="flex flex-none items-center gap-2">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-lilac-tint sm:block">
        <span className="block h-full rounded-full bg-indigo" style={{ width: `${pct}%` }} />
      </span>
      <span className={cn('text-[12px] font-bold', pct === 100 ? 'text-indigo' : 'text-ink-soft')}>{pct}%</span>
    </span>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ProformaField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.type === 'chips') {
    return (
      <ChipGroup
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={(next) => onChange(next)}
        ariaLabel={field.label}
      />
    );
  }
  if (field.type === 'radio' || field.type === 'select') {
    return (
      <ChipGroup
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        value={typeof value === 'string' && value ? [value] : []}
        onChange={(next) => onChange(next[0] ?? null)}
        multiple={false}
        ariaLabel={field.label}
      />
    );
  }
  if (field.type === 'number') {
    return (
      <Input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-11 max-w-[160px]"
        aria-label={field.label}
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <Textarea
        rows={4}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.label}
      />
    );
  }
  if (field.type === 'scale') {
    const current = typeof value === 'number' ? value : field.min ?? 1;
    return (
      <div className="flex flex-col gap-2">
        <Slider
          min={field.min ?? 1}
          max={field.max ?? 6}
          step={1}
          value={[current]}
          onValueChange={(v) => onChange(v[0])}
          aria-label={field.label}
        />
        <span className="text-[13px] font-semibold text-indigo-deep">
          {typeof value === 'number' ? value : '—'} / {field.max ?? 6}
        </span>
      </div>
    );
  }
  return (
    <Input
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="h-11"
      aria-label={field.label}
    />
  );
}

function DiagnosisPicker({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState('');
  const results = ICD11_CODES.filter((c) =>
    query ? `${c.code} ${c.title} ${c.group}`.toLowerCase().includes(query.toLowerCase()) : true,
  ).slice(0, query ? 40 : 12);

  return (
    <div className="flex flex-col gap-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onChange(selected.filter((c) => c !== code))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo px-4 text-[13px] font-semibold text-cream"
            >
              {code} · {ICD11_CODES.find((c) => c.code === code)?.title ?? ''}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ICD-11 code or title"
          aria-label="Search ICD-11"
          className="h-11 pl-11"
        />
      </div>

      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        {results.map((code) => {
          const isOn = selected.includes(code.code);
          return (
            <button
              key={code.code}
              type="button"
              onClick={() => onChange(isOn ? selected.filter((c) => c !== code.code) : [...selected, code.code])}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-soft px-4 py-2 text-left text-[14px]',
                isOn ? 'bg-lilac-tint text-indigo-deep' : 'bg-cream text-ink hover:bg-lilac-tint',
              )}
            >
              <span className="w-14 flex-none font-semibold text-indigo-deep">{code.code}</span>
              <span className="min-w-0 flex-1">{code.title}</span>
              <span className="hidden flex-none text-[11px] uppercase tracking-[0.06em] text-ink-soft sm:block">
                {code.group}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-soft">
        Seed list of ~45 common chapter-06 codes — Saday to confirm before launch.
      </p>
    </div>
  );
}

function SubstanceGrid({ values, onChange }: { values: ProformaValues; onChange: (next: ProformaValues) => void }) {
  const classesField = PROFORMA_SECTIONS.find((s) => s.id === 'substanceUse')!.fields[0]!;
  const selected = Array.isArray(values.classesUsed) ? (values.classesUsed as string[]) : [];

  return (
    <div className="flex flex-col gap-5">
      <Field label={classesField.label}>
        <ChipGroup
          options={(classesField.options ?? []).map((o) => ({ value: o, label: o }))}
          value={selected}
          onChange={(next) => onChange({ ...values, classesUsed: next })}
          ariaLabel={classesField.label}
        />
      </Field>

      {selected
        .filter((c) => c !== 'None')
        .map((cls) => {
          const detail = (values[`detail_${cls}`] ?? {}) as Record<string, unknown>;
          return (
            <div key={cls} className="flex flex-col gap-3 rounded-soft bg-cream p-3">
              <p className="text-[14px] font-semibold text-indigo-deep">{cls}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SUBSTANCE_COLUMNS.map((column) => (
                  <Field key={column.key} label={column.label}>
                    <FieldInput
                      field={column}
                      value={detail[column.key]}
                      onChange={(next) =>
                        onChange({ ...values, [`detail_${cls}`]: { ...detail, [column.key]: next } })
                      }
                    />
                  </Field>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

/** Route 7 — the online assessment proforma (D-016, BUILD_PLAN §3).
 * Accordion sections with a live completion %, chips and selects over
 * free text, autosaving draft, sign & lock identical to the note. */
export function ProformaEditor({ initial, patientName }: { initial: ProformaState; patientName: string }) {
  const router = useRouter();
  const [state, setState] = useState<ProformaState>(initial);
  const [open, setOpen] = useState<string[]>(['sociodemographic']);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const persist = useCallback(
    async (next: ProformaState) => {
      setSaving(true);
      const result = await saveProformaDraftAction(next.id, {
        sociodemographic: next.columns.sociodemographic ?? {},
        informant: next.columns.informant ?? {},
        presentIllness: next.columns.presentIllness ?? {},
        biologicalFunctions: next.columns.biologicalFunctions ?? {},
        substanceUse: next.columns.substanceUse ?? {},
        pastHistory: next.columns.pastHistory ?? {},
        familyHistory: next.columns.familyHistory ?? {},
        personalHistory: next.columns.personalHistory ?? {},
        premorbidPersonality: next.columns.premorbidPersonality ?? {},
        mse: next.columns.mse ?? {},
        diagnosisIcd11: next.diagnosisIcd11,
        formulation: next.formulation || null,
        plan: next.plan || null,
      });
      setSaving(false);
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      } else if (result.error === 'locked') {
        toast.error('This proforma is signed and can no longer be edited.');
        router.refresh();
      }
    },
    [router],
  );

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(state), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, persist]);

  function valuesFor(section: ProformaSection): ProformaValues {
    if (section.column === 'diagnosis') return { diagnosisIcd11: state.diagnosisIcd11 };
    if (section.column === 'formulation') return { formulation: state.formulation };
    if (section.column === 'plan') return { plan: state.plan };
    return state.columns[section.column] ?? {};
  }

  function setColumnValue(section: ProformaSection, key: string, value: unknown) {
    setState((prev) => {
      if (section.column === 'formulation') return { ...prev, formulation: (value as string) ?? '' };
      if (section.column === 'plan') return { ...prev, plan: (value as string) ?? '' };
      const column = prev.columns[section.column] ?? {};
      return { ...prev, columns: { ...prev.columns, [section.column]: { ...column, [key]: value } } };
    });
  }

  const totals = PROFORMA_SECTIONS.reduce(
    (acc, section) => {
      const c = sectionCompletion(section, valuesFor(section));
      return { answered: acc.answered + c.answered, total: acc.total + c.total };
    },
    { answered: 0, total: 0 },
  );
  const overallPct = totals.total === 0 ? 0 : Math.round((totals.answered / totals.total) * 100);

  function openConfirm() {
    if (timer.current) clearTimeout(timer.current);
    void persist(state).then(() => setConfirmOpen(true));
  }

  function sign() {
    startTransition(async () => {
      const result = await signProformaAction(state.id);
      if (result.ok) {
        toast.success('Proforma signed and locked.');
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error('That proforma could not be signed.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-softer bg-card px-5 py-4 shadow-feather">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Overall completion</p>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-lilac-tint">
            <div className="h-full rounded-full bg-indigo transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
        <span className="font-display text-2xl text-indigo-deep">{overallPct}%</span>
        <span className="w-full text-xs text-ink-soft sm:w-auto">
          {saving ? 'Saving…' : savedAt ? `Draft saved ${savedAt}` : 'Autosaves as you go'}
        </span>
      </div>

      <Accordion open={open} onOpenChange={setOpen}>
        {PROFORMA_SECTIONS.map((section) => {
          const values = valuesFor(section);
          const completion = sectionCompletion(section, values);
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              title={section.title}
              meta={<CompletionMeta pct={completion.pct} />}
            >
              {section.kind === 'diagnosis' ? (
                <DiagnosisPicker
                  selected={state.diagnosisIcd11}
                  onChange={(next) => setState((prev) => ({ ...prev, diagnosisIcd11: next }))}
                />
              ) : section.kind === 'substance' ? (
                <SubstanceGrid
                  values={values}
                  onChange={(next) =>
                    setState((prev) => ({ ...prev, columns: { ...prev.columns, substanceUse: next } }))
                  }
                />
              ) : (
                <div className="flex flex-col gap-5">
                  {section.fields.map((field) => (
                    <Field key={field.key} label={field.label} hint={field.hint}>
                      <FieldInput
                        field={field}
                        value={values[field.key]}
                        onChange={(next) => setColumnValue(section, field.key, next)}
                      />
                    </Field>
                  ))}
                </div>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 -mx-1 flex items-center gap-3 bg-cream/95 px-1 py-2 backdrop-blur-sm md:bottom-0">
        <Button size="lg" className="h-12 flex-1 sm:flex-none" onClick={openConfirm} disabled={isPending}>
          <Lock className="h-4 w-4" /> Sign &amp; lock
        </Button>
        <span className="text-xs text-ink-soft">{overallPct}% complete</span>
      </div>

      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-softer sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Sign and lock this proforma?</SheetTitle>
            <SheetDescription>
              {patientName}&apos;s assessment is {overallPct}% complete. Signing locks it for good — a later change
              becomes a new version that keeps this one visible.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button size="lg" className="h-12" onClick={sign} disabled={isPending}>
              <Check className="h-4 w-4" /> Sign &amp; lock
            </Button>
            <Button variant="ghost" className="h-11" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
