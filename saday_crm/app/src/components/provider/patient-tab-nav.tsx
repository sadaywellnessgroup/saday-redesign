import Link from 'next/link';
import { cn } from '@/lib/utils';

export const PATIENT_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'notes', label: 'Notes' },
  { value: 'proforma', label: 'Proforma' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'files', label: 'Files' },
  { value: 'messages', label: 'Messages' },
] as const;

export type PatientTab = (typeof PATIENT_TABS)[number]['value'];

export function normaliseTab(value: string | undefined): PatientTab {
  return (PATIENT_TABS.find((t) => t.value === value)?.value ?? 'overview') as PatientTab;
}

/** Sticky tab row. Plain links (the tab is a query param) so each tab is a
 * server render with its own data, deep-linkable and back-button friendly. */
export function PatientTabNav({ patientId, active }: { patientId: string; active: PatientTab }) {
  return (
    <nav
      aria-label="Patient record"
      className="sticky top-16 z-20 -mx-1 flex gap-1.5 overflow-x-auto bg-cream/95 px-1 py-2 backdrop-blur-sm"
    >
      {PATIENT_TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={`/pro/patients/${patientId}?tab=${tab.value}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold no-underline transition-colors',
              isActive ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
