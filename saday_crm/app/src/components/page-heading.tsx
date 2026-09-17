import type { ReactNode } from 'react';
import { Motif, type MotifName } from '@/components/motif/motif';

/* Inner-shell banner, mobile-first (D-033) — the CRM's equivalent of the
 * main site's PageHeader.tsx, kept to the same "kicker / display title /
 * lede" rhythm so the two products read as one family. */
export function PageHeading({
  kicker,
  title,
  sub,
  motif = 'lotus',
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  motif?: MotifName;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-softer bg-card shadow-feather">
      <div className="relative z-10 flex flex-col gap-3 px-5 py-7 sm:px-8 sm:py-10">
        <span className="kicker">
          <span className="sq" /> {kicker}
        </span>
        <h1 className="display">{title}</h1>
        {sub ? <p className="lede">{sub}</p> : null}
      </div>
      <Motif
        name={motif}
        size={128}
        className="pointer-events-none absolute -right-4 -top-4 z-0 h-28 w-28 opacity-70 sm:h-32 sm:w-32"
      />
    </header>
  );
}
