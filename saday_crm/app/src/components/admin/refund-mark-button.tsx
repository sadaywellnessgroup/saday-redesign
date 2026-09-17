'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { markRefundProcessedAction } from '@/app/(admin)/admin/payments/actions';

export function RefundMarkButton({ refundId, label, toast: toastLabel }: { refundId: string; label: string; toast: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function mark() {
    startTransition(async () => {
      const result = await markRefundProcessedAction(refundId);
      if (result.ok) {
        toast.success(toastLabel);
        router.refresh();
      }
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={mark}>
      {label}
    </Button>
  );
}
