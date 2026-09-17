import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { ProfileForm } from '@/components/provider/settings-forms';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { formatPaise } from '@/lib/utils';

/** Route /pro/more/profile — the public profile fields patients see
 * (D-030 registration number included), plus the session types and prices
 * this provider offers. */
export default async function ProviderProfileSettingsPage() {
  const t = await getTranslations('pro.profile');
  const { providerId } = await requireProvider();

  const [provider, sessionTypes] = await Promise.all([
    repos.provider.getById(providerId),
    repos.provider.listSessionTypes(providerId),
  ]);
  if (!provider) notFound();

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      <ProfileForm
        council={provider.registrationCouncil === 'none' ? 'Council' : provider.registrationCouncil}
        initial={{
          professionalTitle: provider.professionalTitle,
          qualifications: provider.qualifications.join(', '),
          specialisations: provider.specialisations.join(', '),
          languagesSpoken: provider.languagesSpoken.join(', '),
          registrationNumber: provider.registrationNumber ?? '',
          bioShort: provider.bioShort ?? '',
          bioLong: provider.bioLong ?? '',
          isAcceptingPatients: provider.isAcceptingPatients,
        }}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">{t('sessionTypes')}</h2>
          <div className="flex flex-col gap-2">
            {sessionTypes.map((type) => (
              <div key={type.id} className="flex flex-wrap items-center gap-3 rounded-soft bg-cream px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-indigo-deep">{type.nameEn}</p>
                  <p className="text-xs text-ink-soft">
                    {type.durationMinutes} min + {type.bufferMinutes} min buffer · {type.mode}
                  </p>
                </div>
                <p className="font-display text-[17px] text-indigo-deep">{formatPaise(type.pricePaise)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-soft">{t('sessionTypesNote')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 pt-5">
          <h2 className="sec-title">{t('commission')}</h2>
          <p className="font-display text-2xl text-indigo-deep">{provider.commissionPct}%</p>
          <p className="text-xs text-ink-soft">{t('commissionNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
