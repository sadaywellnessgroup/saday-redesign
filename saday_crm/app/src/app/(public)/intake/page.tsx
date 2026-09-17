import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { repos, ORG_ID } from '@/lib/repos';
import { IntakeWizard } from './intake-wizard';

/** Route 2 — 3-field intake (D-004: name, age, sex → provider or earliest
 * slot). Progress dots + one field per step per ui-references §B; a
 * faint tree-line watermark only, per the same row's "Saday twist". */
export default async function IntakePage() {
  const t = await getTranslations('intake');
  const org = await repos.organization.getById(ORG_ID);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="namaste" />
      <IntakeWizard orgPhone={org?.whatsappNumber ?? '+91 92352 93990'} />
    </div>
  );
}
