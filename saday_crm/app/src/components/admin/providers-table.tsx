'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { updateCommissionAction, toggleProviderActiveAction } from '@/app/(admin)/admin/providers/actions';
import { cn } from '@/lib/utils';

export interface ProviderRow {
  id: string;
  name: string;
  title: string;
  regNo: string;
  isActive: boolean;
  commissionPct: number;
  sessionTypesCount: number;
  nextAvailable: string;
}

/* /admin/providers — table (>=md) / cards (<md). Commission % and the
 * active toggle are inline-edited here (D-018), everything else is
 * read-only — full profile + session-type prices live on the detail
 * route. Same soft-card style as /pro/earnings, no grey borders. */
export function ProvidersTable({ rows, labels }: { rows: ProviderRow[]; labels: Record<string, string> }) {
  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <ProviderCard key={row.id} row={row} labels={labels} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-softer bg-card shadow-feather md:block">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead>
            <tr className="bg-lilac-tint text-[11px] uppercase tracking-[0.06em] text-indigo-deep">
              <th className="px-4 py-3 font-bold">{labels.colName}</th>
              <th className="px-3 py-3 font-bold">{labels.colTitle}</th>
              <th className="px-3 py-3 font-bold">{labels.colReg}</th>
              <th className="px-3 py-3 font-bold">{labels.colActive}</th>
              <th className="px-3 py-3 font-bold">{labels.colCommission}</th>
              <th className="px-3 py-3 font-bold">{labels.colSessionTypes}</th>
              <th className="px-3 py-3 font-bold">{labels.colNextAvailable}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
                <td className="px-4 py-3">
                  <Link href={`/admin/providers/${row.id}`} className="font-semibold text-indigo-deep no-underline hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-ink-soft">{row.title}</td>
                <td className="px-3 py-3 text-ink-soft">{row.regNo}</td>
                <td className="px-3 py-3">
                  <ActiveToggle providerId={row.id} initialActive={row.isActive} labels={labels} />
                </td>
                <td className="px-3 py-3">
                  <CommissionEditor providerId={row.id} initialPct={row.commissionPct} labels={labels} />
                </td>
                <td className="px-3 py-3 text-ink-soft">{row.sessionTypesCount}</td>
                <td className="px-3 py-3 text-ink-soft">{row.nextAvailable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProviderCard({ row, labels }: { row: ProviderRow; labels: Record<string, string> }) {
  return (
    <div className="rounded-softer bg-card p-4 shadow-feather">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/providers/${row.id}`} className="font-display text-[17px] text-indigo-deep no-underline hover:underline">
            {row.name}
          </Link>
          <p className="text-xs text-ink-soft">
            {row.title} · {row.regNo}
          </p>
        </div>
        <ActiveToggle providerId={row.id} initialActive={row.isActive} labels={labels} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
        <div>
          <dt className="text-ink-soft">{labels.colCommission}</dt>
          <dd className="mt-1">
            <CommissionEditor providerId={row.id} initialPct={row.commissionPct} labels={labels} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">{labels.colSessionTypes}</dt>
          <dd className="font-semibold text-ink">{row.sessionTypesCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-soft">{labels.colNextAvailable}</dt>
          <dd className="font-semibold text-ink">{row.nextAvailable}</dd>
        </div>
      </dl>
    </div>
  );
}

function ActiveToggle({
  providerId,
  initialActive,
  labels,
}: {
  providerId: string;
  initialActive: boolean;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setActive(next);
    startTransition(async () => {
      const result = await toggleProviderActiveAction(providerId, next);
      if (result.ok) {
        toast.success(labels.activeToggled);
        router.refresh();
      } else {
        setActive(!next);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={active} disabled={isPending} onCheckedChange={onChange} aria-label={labels.colActive} />
      <Badge variant={active ? 'default' : 'secondary'}>{active ? labels.active : labels.inactive}</Badge>
    </div>
  );
}

function CommissionEditor({
  providerId,
  initialPct,
  labels,
}: {
  providerId: string;
  initialPct: number;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialPct));
  const [isPending, startTransition] = useTransition();

  function commit() {
    const pct = Number(value);
    startTransition(async () => {
      const result = await updateCommissionAction(providerId, pct);
      if (result.ok) {
        toast.success(labels.commissionSaved);
        router.refresh();
      } else {
        toast.error(result.error);
        setValue(String(initialPct));
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (Number(value) !== initialPct) commit();
        }}
        className="h-9 w-20 px-2 text-right"
        aria-label={labels.colCommission}
      />
      <span className="text-ink-soft">%</span>
    </div>
  );
}
