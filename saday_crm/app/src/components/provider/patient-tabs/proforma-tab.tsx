import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos } from '@/lib/repos';
import { PROFORMA_SECTIONS, overallCompletion, sectionCompletion, sectionValues } from '@/lib/clinical/proforma-spec';
import { icd11Title } from '@/lib/clinical/icd11';
import type { Patient } from '@/lib/domain';
import { formatISTDate } from '@/lib/utils';

/** Proforma tab — the latest signed proforma's summary, plus "Start
 * proforma" / "Continue draft". History stays readable: a superseded
 * version is never deleted (architecture.md §11). */
export async function ProformaTab({ patient }: { patient: Patient }) {
  const all = await repos.clinical.listProformasForPatient(patient.id);
  const live = all.find((p) => !p.supersededAt) ?? null;
  const signed = all.find((p) => p.signedAt) ?? null;
  const summarySource = signed ?? live;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sec-title">Assessment proforma</h2>
        {live && !live.signedAt ? (
          <Link
            href={`/pro/patients/${patient.id}/proforma/${live.id}`}
            className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream no-underline"
          >
            Continue draft · {overallCompletion(live).pct}%
          </Link>
        ) : (
          <Link
            href={`/pro/patients/${patient.id}/proforma/new`}
            className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream no-underline"
          >
            {signed ? 'Start a new version' : 'Start proforma'}
          </Link>
        )}
      </div>

      {!summarySource ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">
              No proforma yet. The full assessment takes about 20 minutes and can be filled across several sittings —
              it autosaves as a draft until you sign it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={summarySource.signedAt ? 'default' : 'turmeric'}>
                {summarySource.signedAt ? 'Signed' : 'Draft'}
              </Badge>
              {summarySource.version > 1 ? <Badge variant="secondary">v{summarySource.version}</Badge> : null}
              <span className="text-sm text-ink-soft">
                {summarySource.signedAt
                  ? `Signed ${formatISTDate(summarySource.signedAt)}`
                  : `Last saved ${formatISTDate(summarySource.updatedAt)}`}
              </span>
              <Link
                href={`/pro/patients/${patient.id}/proforma/${summarySource.id}`}
                className="ml-auto text-[13.5px] font-semibold text-indigo no-underline"
              >
                Open →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-soft bg-cream px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">Diagnosis (ICD-11)</p>
                {summarySource.diagnosisIcd11.length === 0 ? (
                  <p className="text-sm text-ink-soft">Not recorded</p>
                ) : (
                  <ul className="flex flex-col gap-0.5 pt-1">
                    {summarySource.diagnosisIcd11.map((code) => (
                      <li key={code} className="text-[14.5px] text-ink">
                        <span className="font-semibold text-indigo-deep">{code}</span> · {icd11Title(code)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-soft bg-cream px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">Completion</p>
                <p className="font-display text-2xl text-indigo-deep">{overallCompletion(summarySource).pct}%</p>
              </div>
            </div>

            {summarySource.formulation ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">Formulation</p>
                <p className="text-[14.5px] leading-relaxed text-ink">{summarySource.formulation}</p>
              </div>
            ) : null}
            {summarySource.plan ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">Plan</p>
                <p className="text-[14.5px] leading-relaxed text-ink">{summarySource.plan}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {PROFORMA_SECTIONS.map((section) => {
                const c = sectionCompletion(section, sectionValues(summarySource, section));
                return (
                  <span
                    key={section.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-[11.5px] font-semibold text-ink-soft"
                  >
                    {section.title}
                    <span className="text-indigo-deep">{c.pct}%</span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {all.length > 1 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Version history</h3>
            {all.map((p) => (
              <Link
                key={p.id}
                href={`/pro/patients/${patient.id}/proforma/${p.id}`}
                className="flex items-center gap-3 rounded-soft bg-cream px-4 py-2.5 text-[14px] no-underline"
              >
                <span className="font-semibold text-indigo-deep">v{p.version}</span>
                <span className="text-ink-soft">{formatISTDate(p.createdAt)}</span>
                <span className="ml-auto text-ink-soft">{p.supersededAt ? 'Superseded' : p.signedAt ? 'Signed' : 'Draft'}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
