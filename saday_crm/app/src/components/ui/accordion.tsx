'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* A small controlled/uncontrolled accordion. Hand-rolled rather than
 * @radix-ui/react-accordion so the provider console does not add a
 * dependency to the locked P1 package set; the API is the subset the
 * clinical forms use (multiple open sections, controlled value). No
 * borders — an open section lifts on `bg-card` + shadow-feather, closed
 * sections sit flat on cream (D-002/D-028). */

interface AccordionContextValue {
  open: string[];
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  defaultOpen = [],
  open: controlledOpen,
  onOpenChange,
  className,
}: {
  children: React.ReactNode;
  defaultOpen?: string[];
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultOpen);
  const open = controlledOpen ?? uncontrolled;

  const toggle = React.useCallback(
    (value: string) => {
      const next = open.includes(value) ? open.filter((v) => v !== value) : [...open, value];
      if (controlledOpen === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [open, controlledOpen, onOpenChange],
  );

  return (
    <AccordionContext.Provider value={{ open, toggle }}>
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  title,
  meta,
  children,
  id,
}: {
  value: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be used inside <Accordion>');
  const isOpen = ctx.open.includes(value);
  const panelId = `${value}-panel`;

  return (
    <section id={id ?? value} className="scroll-mt-24 overflow-hidden rounded-softer bg-card shadow-feather">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => ctx.toggle(value)}
          className="flex min-h-[56px] w-full items-center gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex-1 font-display text-[16px] font-semibold text-indigo-deep">{title}</span>
          {meta}
          <ChevronDown
            className={cn('h-4.5 w-4.5 flex-none text-indigo transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </h3>
      {isOpen ? (
        <div id={panelId} className="px-5 pb-5 pt-1">
          {children}
        </div>
      ) : null}
    </section>
  );
}
