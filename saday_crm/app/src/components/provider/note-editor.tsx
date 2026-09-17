'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import {
  AFFECT_OPTIONS,
  INTERVENTION_CHIPS,
  MOOD_OPTIONS,
  NOTE_MODES,
  RISK_CHIPS,
  progressLabel,
} from '@/lib/clinical/note-spec';
import { saveNoteDraftAction, signNoteAction } from '@/app/(provider)/pro/patients/[id]/notes/actions';
import type { RiskChip, SessionNoteMode } from '@/lib/domain';
import { cn } from '@/lib/utils';

export interface NoteDraft {
  id: string;
  patientId: string;
  sessionDate: string;
  durationMinutes: number;
  mode: SessionNoteMode;
  presentingConcern: string;
  mood: string;
  affect: string;
  risk: RiskChip[];
  behaviouralObservation: string;
  narrative: string;
  interventions: string[];
  homework: string;
  goals: string;
  nextFocus: string;
  progressScore: number | null;
  followUpDate: string;
}

const SECTIONS = [
  { id: 'details', label: 'Session details' },
  { id: 'assessment', label: 'Clinical assessment' },
  { id: 'narrative', label: 'Session narrative' },
  { id: 'plan', label: 'Plan & next steps' },
] as const;

const MISSING_LABEL: Record<string, string> = {
  sessionDate: 'Session date',
  durationMinutes: 'Duration',
  mode: 'Mode',
  presentingConcern: 'Presenting concern',
  risk: 'Risk',
  narrative: 'Session narrative',
  progressScore: 'Progress score',
};

/** Section shell: a card on both sizes, collapsible below md (accordion),
 * always open from md up where the left nav does the navigating. */
function Section({
  id,
  label,
  children,
  open,
  onToggle,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section id={id} className="scroll-mt-32 overflow-hidden rounded-softer bg-card shadow-feather">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-[56px] w-full items-center gap-3 px-5 py-3 text-left md:pointer-events-none"
        >
          <span className="flex-1 font-display text-[17px] font-semibold text-indigo-deep">{label}</span>
          <ChevronDown className={cn('h-4 w-4 text-indigo transition-transform md:hidden', open && 'rotate-180')} />
        </button>
      </h2>
      <div className={cn('flex flex-col gap-5 px-5 pb-5', !open && 'hidden md:flex')}>{children}</div>
    </section>
  );
}

/** Route 6 — the D-005 four-section note editor. Autosaves the draft;
 * signing locks it for good (ui-references §E-3, architecture.md §11).
 * No AI drafting anywhere in this form (D-022). */
export function NoteEditor({
  initial,
  therapistName,
  patientName,
}: {
  initial: NoteDraft;
  therapistName: string;
  patientName: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<NoteDraft>(initial);
  const [openSections, setOpenSections] = useState<string[]>(['details']);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const persist = useCallback(
    async (next: NoteDraft) => {
      setSaving(true);
      const result = await saveNoteDraftAction(next.id, {
        sessionDate: next.sessionDate,
        durationMinutes: next.durationMinutes,
        mode: next.mode,
        presentingConcern: next.presentingConcern || null,
        mood: next.mood || null,
        affect: next.affect || null,
        risk: next.risk,
        behaviouralObservation: next.behaviouralObservation || null,
        narrative: next.narrative || null,
        interventions: next.interventions,
        homework: next.homework || null,
        goals: next.goals || null,
        nextFocus: next.nextFocus || null,
        progressScore: next.progressScore,
        followUpDate: next.followUpDate || null,
      });
      setSaving(false);
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      } else if (result.error === 'locked') {
        toast.error('This note is signed and can no longer be edited.');
        router.refresh();
      }
    },
    [router],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(draft), 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, persist]);

  function set<K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function openConfirm() {
    if (timer.current) clearTimeout(timer.current);
    void persist(draft).then(() => setConfirmOpen(true));
  }

  function sign() {
    startTransition(async () => {
      const result = await signNoteAction(draft.id);
      if (result.ok) {
        toast.success('Note signed and locked.');
        setConfirmOpen(false);
        router.refresh();
      } else if (result.error === 'invalid') {
        setMissing(result.missing ?? []);
        toast.error('Some required fields are still empty.');
      } else {
        toast.error('That note could not be signed.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* desktop section nav */}
      <nav aria-label="Note sections" className="hidden w-52 flex-none md:block">
        <div className="sticky top-24 flex flex-col gap-1">
          {SECTIONS.map((section, i) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium text-ink no-underline hover:bg-lilac-tint hover:text-indigo"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-lilac-tint text-[11px] font-bold text-indigo-deep">
                {i + 1}
              </span>
              {section.label}
            </a>
          ))}
          <p className="px-4 pt-3 text-xs text-ink-soft">
            {saving ? 'Saving…' : savedAt ? `Draft saved ${savedAt}` : 'Draft autosaves as you type'}
          </p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-xs text-ink-soft md:hidden">
          {saving ? 'Saving…' : savedAt ? `Draft saved ${savedAt}` : 'Draft autosaves as you type'}
        </p>

        <Section id="details" label="Session details" open={openSections.includes('details')} onToggle={() => toggleSection('details')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <Input type="date" value={draft.sessionDate} onChange={(e) => set('sessionDate', e.target.value)} className="h-11" />
            </Field>
            <Field label="Duration (minutes)" required>
              <Input
                type="number"
                min={10}
                max={240}
                value={draft.durationMinutes}
                onChange={(e) => set('durationMinutes', Number(e.target.value))}
                className="h-11"
              />
            </Field>
          </div>
          <Field label="Mode" required>
            <ChipGroup
              options={NOTE_MODES.map((m) => ({ value: m.value, label: m.label }))}
              value={[draft.mode]}
              onChange={(next) => next[0] && set('mode', next[0] as SessionNoteMode)}
              multiple={false}
              ariaLabel="Mode"
            />
          </Field>
          <Field label="Therapist">
            <p className="rounded-soft bg-cream px-4 py-3 text-[14.5px] text-ink">{therapistName}</p>
          </Field>
        </Section>

        <Section
          id="assessment"
          label="Clinical assessment"
          open={openSections.includes('assessment')}
          onToggle={() => toggleSection('assessment')}
        >
          <Field label="Presenting concern" required>
            <Textarea
              rows={3}
              value={draft.presentingConcern}
              onChange={(e) => set('presentingConcern', e.target.value)}
              placeholder="What the patient brought to this session."
            />
          </Field>
          <Field label="Mood">
            <ChipGroup
              options={MOOD_OPTIONS.map((m) => ({ value: m, label: m }))}
              value={draft.mood ? [draft.mood] : []}
              onChange={(next) => set('mood', next[0] ?? '')}
              multiple={false}
              ariaLabel="Mood"
            />
          </Field>
          <Field label="Affect">
            <ChipGroup
              options={AFFECT_OPTIONS.map((a) => ({ value: a, label: a }))}
              value={draft.affect ? [draft.affect] : []}
              onChange={(next) => set('affect', next[0] ?? '')}
              multiple={false}
              ariaLabel="Affect"
            />
          </Field>
          <Field label="Risk" required hint="Required on every note — this is the platform's only risk record (D-009).">
            <ChipGroup
              options={RISK_CHIPS.map((r) => ({ value: r.value, label: r.label }))}
              value={draft.risk}
              onChange={(next) => set('risk', next as RiskChip[])}
              ariaLabel="Risk"
            />
          </Field>
        </Section>

        <Section
          id="narrative"
          label="Session narrative"
          open={openSections.includes('narrative')}
          onToggle={() => toggleSection('narrative')}
        >
          <Field label="Behavioural observation">
            <Textarea
              rows={3}
              value={draft.behaviouralObservation}
              onChange={(e) => set('behaviouralObservation', e.target.value)}
              placeholder="Appearance, rapport, speech, engagement."
            />
          </Field>
          <Field label="Narrative" required>
            <Textarea
              rows={6}
              value={draft.narrative}
              onChange={(e) => set('narrative', e.target.value)}
              placeholder="What happened in the session, in your own words."
            />
          </Field>
          <Field label="Interventions used">
            <ChipGroup
              options={INTERVENTION_CHIPS}
              value={draft.interventions}
              onChange={(next) => set('interventions', next)}
              ariaLabel="Interventions"
            />
          </Field>
        </Section>

        <Section id="plan" label="Plan & next steps" open={openSections.includes('plan')} onToggle={() => toggleSection('plan')}>
          <Field label="Homework">
            <Textarea rows={2} value={draft.homework} onChange={(e) => set('homework', e.target.value)} />
          </Field>
          <Field label="Goals">
            <Textarea rows={2} value={draft.goals} onChange={(e) => set('goals', e.target.value)} />
          </Field>
          <Field label="Next session focus">
            <Textarea rows={2} value={draft.nextFocus} onChange={(e) => set('nextFocus', e.target.value)} />
          </Field>
          <Field label="Progress" required hint="0 regressed · 5 no change · 10 improved">
            <div className="flex flex-col gap-2">
              <Slider
                min={0}
                max={10}
                step={1}
                value={[draft.progressScore ?? 5]}
                onValueChange={(v) => set('progressScore', v[0] ?? 5)}
                aria-label="Progress score"
              />
              <div className="flex items-center justify-between text-[13px] text-ink-soft">
                <span>Regressed</span>
                <span className="font-semibold text-indigo-deep">
                  {draft.progressScore === null
                    ? 'Not set — drag to score'
                    : `${draft.progressScore} · ${progressLabel(draft.progressScore)}`}
                </span>
                <span>Improved</span>
              </div>
            </div>
          </Field>
          <Field label="Follow-up date">
            <Input type="date" value={draft.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} className="h-11" />
          </Field>
        </Section>

        <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 -mx-1 flex items-center gap-3 bg-cream/95 px-1 py-2 backdrop-blur-sm md:bottom-0">
          <Button size="lg" className="h-12 flex-1 sm:flex-none" onClick={openConfirm} disabled={isPending}>
            <Lock className="h-4 w-4" /> Sign &amp; lock
          </Button>
          <span className="text-xs text-ink-soft">{saving ? 'Saving…' : savedAt ? `Saved ${savedAt}` : ''}</span>
        </div>

        {missing.length > 0 ? (
          <div className="rounded-soft bg-turmeric/18 px-4 py-3 text-[13.5px] text-terracotta-deep">
            Still needed: {missing.map((m) => MISSING_LABEL[m] ?? m).join(', ')}.
          </div>
        ) : null}
      </div>

      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-softer sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Sign and lock this note?</SheetTitle>
            <SheetDescription>
              Signing records the note against {patientName}&apos;s session for good. It cannot be edited afterwards —
              a correction becomes a new version that keeps this one visible.
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
