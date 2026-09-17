'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { markPayoutPaidAction } from '@/app/(admin)/admin/payments/actions';

export function PayoutMarkPaid({
  providerId,
  referencePlaceholder,
  buttonLabel,
  toastLabel,
}: {
  providerId: string;
  referencePlaceholder: string;
  buttonLabel: string;
  toastLabel: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await markPayoutPaidAction(providerId, reference);
      if (result.ok) {
        toast.success(toastLabel);
        setReference('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder={referencePlaceholder}
        className="h-9 w-full min-w-0 flex-1 sm:w-40 sm:flex-none"
        aria-label={referencePlaceholder}
      />
      <Button size="sm" disabled={isPending || reference.trim().length === 0} onClick={submit}>
        {buttonLabel}
      </Button>
    </div>
  );
}
