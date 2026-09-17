import type { ReactNode } from 'react';

/* Heading for every /pro route except Today. ui-references §A: no motifs
 * on clinical, provider-list, calendar, notes or proforma screens — only
 * the Today banner carries one. */
export function ConsoleHeading({
  kicker,
  title,
  sub,
  actions,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <span className="kicker">
          <span className="sq" /> {kicker}
        </span>
        <h1 className="font-display text-[26px] font-medium leading-tight text-indigo-deep sm:text-[32px]">{title}</h1>
        {sub ? <p className="text-sm text-ink-soft">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
