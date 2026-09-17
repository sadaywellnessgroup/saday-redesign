import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ProviderProfile } from '@/lib/domain';
import { formatISTDateTime, formatPaise, initials } from '@/lib/utils';

const TITLE_LABEL: Record<ProviderProfile['professionalTitle'], string> = {
  psychiatrist: 'Psychiatrist',
  clinical_psychologist: 'Clinical Psychologist',
  counselling_psychologist: 'Counselling Psychologist',
  psychotherapist: 'Psychotherapist',
  counsellor: 'Counsellor',
};

/** Practo-style doctor card (ui-references §B "Provider list") — photo
 * (initials avatar in P1, no `photoPath` fixture yet), name, title, NMC/RCI
 * reg. no. (D-030), language chips, "from ₹X", earliest slot line. Never
 * rendered for a provider with zero slots — the caller filters that out
 * (ui-references §E-1). */
export async function ProviderCard({
  provider,
  earliestSlotISO,
}: {
  provider: ProviderProfile;
  earliestSlotISO: string;
}) {
  const t = await getTranslations('providers');
  const lowestPrice = Math.min(...provider.sessionTypes.map((s) => s.pricePaise));

  return (
    <Link href={`/providers/${provider.slug}`} className="no-underline">
      <Card className="flex flex-col gap-3 p-5 transition-transform hover:-translate-y-1">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 shadow-feather">
            <AvatarFallback className="text-base">{initials(provider.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg text-indigo-deep">{provider.displayName}</h3>
            <p className="text-sm text-ink-soft">{TITLE_LABEL[provider.professionalTitle]}</p>
            {provider.registrationNumber ? (
              <p className="text-xs text-ink-soft">
                {t('yearsExperience', { years: provider.yearsExperience })} · {provider.registrationCouncil} {provider.registrationNumber}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {provider.languagesSpoken.map((lang) => (
            <Badge key={lang} variant="secondary">
              {lang.toUpperCase()}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-terracotta">{t('earliestLabel')}: {formatISTDateTime(earliestSlotISO)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-display text-base text-indigo-deep">{t('fromPrice', { price: formatPaise(lowestPrice) })}</span>
          <span className="btn btn-ghost !px-5 !py-2 text-[13px]">{t('viewProfile')}</span>
        </div>
      </Card>
    </Link>
  );
}
