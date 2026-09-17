import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProformaEditor, type ProformaState } from '@/components/provider/proforma-editor';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import {
  PROFORMA_SECTIONS,
  SUBSTANCE_COLUMNS,
  overallCompletion,
  sectionCompletion,
  sectionValues,
} from '@/lib/clinical/proforma-spec';
import { icd11Title } from '@/lib/clinical/icd11';
import { formatISTDate, formatISTDateTime } from '@/lib/utils';

const SUBSTANCE_COLUMN_LABEL = Object.fromEntries(SUBSTANCE_COLUMNS.map((c) => [c.key, c.label]));

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== null && v !== '');
    return entries.length
      ? entries.map(([k, v]) => `${SUBSTANCE_COLUMN_LABEL[k] ?? k}: ${String(v)}`).join(' · ')
      : '—';
  }
  return String(value);
}

/** "classesUsed" -> "Substances ever used"; "detail_Alcohol" -> "Alcohol". */
function substanceRowLabel(key: string): string {
  if (key === 'classesUsed') return 'Substances ever used';
  return key.startsWith('detail_') ? key.slice('detail_'.length) : key;
}

/** Route /pro/patients/[id]/proforma/[proformaId] — the editor while the
 * proforma is a draft, a read-only record once it is signed. */
export default async function ProformaPage({ params }: { params: Promise<{ id: string; proformaId: string }> }) {
  const { id, proformaId } = await params;
  const { providerId } = await requireProvider();

  const proforma = await repos.clinical.getProforma(proformaId);
  if (!proforma || proforma.providerId !== providerId || proforma.patientId !== id) notFound();
  const patient = await repos.patient.getById(id);
  if (!patient) notFound();

  const backLink = (
    <Link
      href={`/pro/patients/${id}?tab=proforma`}
      className="inline-flex min-h-11 items-center rounded-full bg-card px-4 text-[13.5px] font-semibold text-indigo no-underline shadow-feather"
    >
      Back to record
    </Link>
  );

  if (!proforma.signedAt) {
    const state: ProformaState = {
      id: proforma.id,
      patientId: proforma.patientId,
      columns: {
        sociodemographic: proforma.sociodemographic,
        informant: proforma.informant,
        presentIllness: proforma.presentIllness,
        biologicalFunctions: proforma.biologicalFunctions,
        substanceUse: proforma.substanceUse,
        pastHistory: proforma.pastHistory,
        familyHistory: proforma.familyHistory,
        personalHistory: proforma.personalHistory,
        premorbidPersonality: proforma.premorbidPersonality,
        mse: proforma.mse,
      },
      diagnosisIcd11: proforma.diagnosisIcd11,
      formulation: proforma.formulation ?? '',
      plan: proforma.plan ?? '',
    };

    return (
      <div className="flex flex-col gap-4">
        <ConsoleHeading
          kicker={`${patient.displayName} · assessment proforma`}
          title={proforma.version > 1 ? `Draft · version ${proforma.version}` : 'Assessment proforma'}
          sub="Fill it in any order and across sittings — every section autosaves."
          actions={backLink}
        />
        <ProformaEditor initial={state} patientName={patient.displayName} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading
        kicker={`${patient.displayName} · assessment proforma`}
        title={`Signed proforma${proforma.version > 1 ? ` · version ${proforma.version}` : ''}`}
        sub={`Signed ${formatISTDateTime(proforma.signedAt)} — locked`}
        actions={backLink}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-soft bg-lilac-tint px-4 py-3 text-[13.5px] text-indigo-deep">
        <Lock className="h-4 w-4" />
        Signed proformas are read-only. Starting a new one supersedes this version and keeps it readable.
        {proforma.supersededAt ? <Badge variant="secondary">Superseded {formatISTDate(proforma.supersededAt)}</Badge> : null}
        <span className="ml-auto font-semibold">{overallCompletion(proforma).pct}% complete</span>
      </div>

      <div className="flex flex-col gap-3">
        {PROFORMA_SECTIONS.map((section) => {
          const values = sectionValues(proforma, section);
          const completion = sectionCompletion(section, values);
          return (
            <Card key={section.id}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center gap-3">
                  <h2 className="flex-1 font-display text-[17px] font-semibold text-indigo-deep">{section.title}</h2>
                  <span className="text-[12px] font-bold text-ink-soft">{completion.pct}%</span>
                </div>

                {section.kind === 'diagnosis' ? (
                  proforma.diagnosisIcd11.length === 0 ? (
                    <p className="text-sm text-ink-soft">Not recorded</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {proforma.diagnosisIcd11.map((code) => (
                        <li key={code} className="text-[14.5px] text-ink">
                          <span className="font-semibold text-indigo-deep">{code}</span> · {icd11Title(code)}
                        </li>
                      ))}
                    </ul>
                  )
                ) : section.kind === 'substance' ? (
                  <div className="flex flex-col gap-1">
                    {Object.entries(values).map(([key, value]) => (
                      <p key={key} className="text-[14.5px] text-ink">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                          {substanceRowLabel(key)}:{' '}
                        </span>
                        {valueText(value)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <dl className="flex flex-col">
                    {section.fields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-4">
                        <dt className="w-64 flex-none text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                          {field.label}
                        </dt>
                        <dd className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-ink">
                          {valueText(values[field.key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
