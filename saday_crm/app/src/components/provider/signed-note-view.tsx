'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FilePlus2, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supersedeNoteAction } from '@/app/(provider)/pro/patients/[id]/notes/actions';

/** "Supersede" on a signed note: creates v2 carrying this content
 * forward, leaves v1 readable and untouched (architecture.md §11.4). */
export function SupersedeButton({ noteId, patientId, version }: { noteId: string; patientId: string; version: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function supersede() {
    startTransition(async () => {
      const result = await supersedeNoteAction(noteId);
      if (result.ok) {
        toast.success(`Version ${version + 1} created as a draft.`);
        setOpen(false);
        router.push(`/pro/patients/${patientId}/notes/${result.noteId}`);
        router.refresh();
      } else {
        toast.error('That note could not be superseded.');
      }
    });
  }

  return (
    <>
      <Button variant="outline" className="h-11" onClick={() => setOpen(true)}>
        <FilePlus2 className="h-4 w-4" /> Supersede
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-softer sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create version {version + 1}?</SheetTitle>
            <SheetDescription>
              This signed note stays exactly as it is and stays visible. A new draft opens with its content copied
              forward, so a correction is always an addition — never an edit.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button size="lg" className="h-12" onClick={supersede} disabled={isPending}>
              <Lock className="h-4 w-4" /> Create version {version + 1}
            </Button>
            <Button variant="ghost" className="h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
