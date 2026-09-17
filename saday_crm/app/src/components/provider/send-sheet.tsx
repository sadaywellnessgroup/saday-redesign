'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import { sendFileAction, sendMaterialAction, sendUrlAction } from '@/app/(provider)/pro/patients/[id]/actions';
import { cn } from '@/lib/utils';

export interface MaterialRow {
  id: string;
  title: string;
  description: string;
  kind: string;
  category: string;
}

const MODES = [
  { value: 'library', label: 'Materials library' },
  { value: 'upload', label: 'Upload a file' },
  { value: 'link', label: 'Paste a URL' },
];

const FILE_KINDS = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'report', label: 'Report' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'other', label: 'Other' },
];

/** One Sheet, three ways to send (D-007: PDF / image / video / URL, 25 MB;
 * D-017: a prescription photo is an upload, not a generated PDF). */
export function SendSheet({ patientId, materials }: { patientId: string; materials: MaterialRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<string[]>(['library']);
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<string[]>(['prescription']);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = materials.filter((m) =>
    query ? `${m.title} ${m.description} ${m.category}`.toLowerCase().includes(query.toLowerCase()) : true,
  );

  function close() {
    setOpen(false);
    setFile(null);
    setUrl('');
    setLabel('');
    setQuery('');
  }

  function sendMaterial(materialId: string) {
    startTransition(async () => {
      const result = await sendMaterialAction(patientId, materialId);
      if (result.ok) {
        toast.success('Sent to the patient.');
        close();
        router.refresh();
      } else {
        toast.error('That material could not be sent.');
      }
    });
  }

  function upload() {
    if (!file) return;
    startTransition(async () => {
      const result = await sendFileAction(patientId, {
        name: file.name,
        mime: file.type,
        bytes: file.size,
        kind: (kind[0] ?? 'other') as 'prescription' | 'report' | 'worksheet' | 'other',
      });
      if (result.ok) {
        toast.success('File shared.');
        close();
        router.refresh();
      } else {
        toast.error(result.error === 'too_large' ? 'Files must be 25 MB or smaller.' : 'That file type is not allowed.');
      }
    });
  }

  function share() {
    startTransition(async () => {
      const result = await sendUrlAction(patientId, url, label);
      if (result.ok) {
        toast.success('Link shared.');
        close();
        router.refresh();
      } else {
        toast.error('Enter a full URL, including https://');
      }
    });
  }

  return (
    <>
      <Button className="h-11" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> Send
      </Button>

      <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-softer sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Send to patient</SheetTitle>
            <SheetDescription>Brochures and worksheets, an upload, or a link. Max 25 MB per file.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 pt-4">
            <ChipGroup options={MODES} value={mode} onChange={setMode} multiple={false} ariaLabel="What to send" />

            {mode[0] === 'library' ? (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search brochures and worksheets"
                    aria-label="Search materials"
                    className="h-11 pl-11"
                  />
                </div>
                <div className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="py-4 text-sm text-ink-soft">Nothing matches that search.</p>
                  ) : (
                    filtered.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => sendMaterial(material.id)}
                        className="flex flex-col items-start gap-0.5 rounded-soft bg-cream px-4 py-3 text-left hover:bg-lilac-tint"
                      >
                        <span className="text-[14.5px] font-semibold text-indigo-deep">{material.title}</span>
                        <span className="text-xs text-ink-soft">{material.description}</span>
                        <span className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">{material.kind}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {mode[0] === 'upload' ? (
              <div className="flex flex-col gap-4">
                <Field label="What is it?">
                  <ChipGroup options={FILE_KINDS} value={kind} onChange={setKind} multiple={false} ariaLabel="File kind" />
                </Field>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex min-h-14 items-center justify-center rounded-soft bg-cream px-4 text-sm font-semibold text-indigo shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint"
                >
                  {file ? file.name : 'Choose a PDF, photo or video'}
                </button>
                <Button size="lg" className={cn('h-12', !file && 'opacity-60')} disabled={!file || isPending} onClick={upload}>
                  Share file
                </Button>
              </div>
            ) : null}

            {mode[0] === 'link' ? (
              <div className="flex flex-col gap-4">
                <Field label="URL">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                    className="h-11"
                  />
                </Field>
                <Field label="Label (optional)">
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Grounding exercise" className="h-11" />
                </Field>
                <Button size="lg" className={cn('h-12', !url && 'opacity-60')} disabled={!url || isPending} onClick={share}>
                  Share link
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
