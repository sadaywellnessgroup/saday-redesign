import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { ProviderDetailForm } from '@/components/admin/provider-detail-form';
import { repos } from '@/lib/repos';
import { requireAdmin, providerOnboardingStatus } from '@/lib/admin/console-data';

/** Route /admin/providers/[id] — profile fields (read/edit), commission %
 * (D-018), session types + prices (edit — the one place D-020 says prices
 * are set), active/inactive and onboarding status. */
export default async function AdminProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('admin.providerDetail');
  await requireAdmin();
  const { id } = await params;

  const [provider, sessionTypes] = await Promise.all([
    repos.provider.getById(id),
    repos.provider.listAllSessionTypes(id),
  ]);
  if (!provider) notFound();

  const onboarding = providerOnboardingStatus(provider);

  const labels = {
    onboardingStatus: t('onboardingStatus'),
    verified: t('verified'),
    pendingVerification: t('pendingVerification'),
    profileSection: t('profileSection'),
    professionalTitle: t('professionalTitle'),
    qualifications: t('qualifications'),
    qualificationsHint: t('qualificationsHint'),
    specialisations: t('specialisations'),
    specialisationsHint: t('specialisationsHint'),
    languagesSpoken: t('languagesSpoken'),
    languagesSpokenHint: t('languagesSpokenHint'),
    registrationNumber: t('registrationNumber'),
    registrationNumberHint: t('registrationNumberHint'),
    bioShort: t('bioShort'),
    bioLong: t('bioLong'),
    commissionLabel: t('commissionLabel'),
    commissionHint: t('commissionHint'),
    activeLabel: t('activeLabel'),
    acceptingLabel: t('acceptingLabel'),
    sessionTypesSection: t('sessionTypesSection'),
    sessionTypesNote: t('sessionTypesNote'),
    priceLabel: t('priceLabel'),
    sessionTypeActive: t('sessionTypeActive'),
    save: t('save'),
    saved: t('saved'),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/providers" className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo no-underline hover:underline">
        <ChevronLeft className="h-4 w-4" /> {t('back')}
      </Link>
      <ConsoleHeading kicker={t('kicker')} title={provider.displayName} sub={provider.bioShort ?? undefined} />

      <ProviderDetailForm
        providerId={provider.id}
        council={provider.registrationCouncil === 'none' ? 'Registration' : provider.registrationCouncil}
        onboardingLabel={onboarding === 'verified' ? labels.verified : labels.pendingVerification}
        initial={{
          professionalTitle: provider.professionalTitle,
          qualifications: provider.qualifications.join(', '),
          specialisations: provider.specialisations.join(', '),
          languagesSpoken: provider.languagesSpoken.join(', '),
          registrationNumber: provider.registrationNumber ?? '',
          bioShort: provider.bioShort ?? '',
          bioLong: provider.bioLong ?? '',
          isAcceptingPatients: provider.isAcceptingPatients,
          isActive: provider.isActive,
          commissionPct: provider.commissionPct,
        }}
        sessionTypes={sessionTypes.map((s) => ({
          id: s.id,
          nameEn: s.nameEn,
          durationMinutes: s.durationMinutes,
          bufferMinutes: s.bufferMinutes,
          pricePaise: s.pricePaise,
          isActive: s.isActive,
        }))}
        labels={labels}
      />
    </div>
  );
}
