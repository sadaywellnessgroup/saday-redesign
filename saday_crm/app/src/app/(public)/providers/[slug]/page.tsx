import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { repos, ORG_ID } from '@/lib/repos';
import { formatPaise, initials } from '@/lib/utils';

const TITLE_LABEL: Record<string, string> = {
  psychiatrist: 'Psychiatrist',
  clinical_psychologist: 'Clinical Psychologist',
  counselling_psychologist: 'Counselling Psychologist',
  psychotherapist: 'Psychotherapist',
  counsellor: 'Counsellor',
};

/** Route 4 — provider profile (ui-references §B "Provider profile"):
 * credentials block with a terracotta strip, About, Specialisations,
 * Session types + prices, sticky bottom Book bar (MobileBookBar pattern
 * from _refs). No motif — provider/clinical screens are excluded
 * (ui-references §A/§E-6). */
export default async function ProviderProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations('providerProfile');
  const tList = await getTranslations('providers');

  const provider = await repos.provider.getBySlug(ORG_ID, slug);
  if (!provider) notFound();
  const sessionTypes = await repos.provider.listSessionTypes(provider.id);
  const lowestPrice = sessionTypes.length ? Math.min(...sessionTypes.map((s) => s.pricePaise)) : null;

  return (
    <div className="flex flex-col gap-5 pb-24">
      <Link href="/providers" className="text-sm font-semibold text-indigo no-underline">
        ← {t('back')}
      </Link>

      <Card className="overflow-hidden">
        <div className="h-2 bg-terracotta" aria-hidden="true" />
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shadow-feather">
              <AvatarFallback className="text-2xl">{initials(provider.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl text-indigo-deep">{provider.displayName}</h1>
              <p className="text-sm text-ink-soft">{TITLE_LABEL[provider.professionalTitle] ?? provider.professionalTitle}</p>
              <p className="text-sm text-ink-soft">{tList('yearsExperience', { years: provider.yearsExperience })}</p>
              {provider.registrationNumber ? (
                <p className="mt-1 text-xs font-semibold text-terracotta-deep">
                  {t('regNumber')}: {provider.registrationCouncil} {provider.registrationNumber}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t('languages')}:</span>
            {provider.languagesSpoken.map((lang) => (
              <Badge key={lang} variant="secondary">
                {lang.toUpperCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {provider.bioLong ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h2 className="sec-title">{t('about')}</h2>
            <p className="lede">{provider.bioLong}</p>
          </CardContent>
        </Card>
      ) : null}

      {provider.specialisations.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h2 className="sec-title">{t('specialisations')}</h2>
            <div className="flex flex-wrap gap-1.5">
              {provider.specialisations.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('sessionTypes')}</h2>
          <div className="flex flex-col gap-2.5">
            {sessionTypes.map((st) => (
              <div key={st.id} className="flex items-center justify-between rounded-soft bg-cream px-4 py-3">
                <div>
                  <p className="text-[14.5px] font-semibold text-ink">{st.nameEn}</p>
                  <p className="text-xs text-ink-soft">{st.durationMinutes} min</p>
                </div>
                <span className="font-display text-base text-indigo-deep">{formatPaise(st.pricePaise)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-wrap px-4 md:bottom-4"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center justify-between gap-4 rounded-full bg-card px-5 py-3 shadow-feather-lg" style={{ pointerEvents: 'auto' }}>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-indigo-deep">{provider.displayName}</p>
            {lowestPrice !== null ? <p className="text-xs text-ink-soft">{tList('fromPrice', { price: formatPaise(lowestPrice) })}</p> : null}
          </div>
          <Link href={`/book/${provider.id}`} className="btn btn-primary !px-7">
            {t('book')}
          </Link>
        </div>
      </div>
    </div>
  );
}
