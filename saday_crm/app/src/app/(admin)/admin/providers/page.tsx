import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { ProvidersTable, type ProviderRow } from '@/components/admin/providers-table';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { formatISTDateTime } from '@/lib/utils';

const TITLE_LABEL: Record<string, string> = {
  psychiatrist: 'Psychiatrist',
  clinical_psychologist: 'Clinical psychologist',
  counselling_psychologist: 'Counselling psychologist',
  psychotherapist: 'Psychotherapist',
  counsellor: 'Counsellor',
};

/** Route /admin/providers — every provider, active or not (D-020). Name,
 * title, reg. no., active toggle and commission % (inline-edit, D-018),
 * session-type count and next available slot; row -> detail route. */
export default async function AdminProvidersPage() {
  const t = await getTranslations('admin.providers');
  await requireAdmin();

  const providers = await repos.provider.listAll(ORG_ID);
  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 86_400_000).toISOString();

  const rows: ProviderRow[] = await Promise.all(
    providers.map(async (p): Promise<ProviderRow> => {
      const firstType = p.sessionTypes[0];
      let nextAvailable = '—';
      if (p.isActive && p.isAcceptingPatients && firstType) {
        const slots = await repos.booking.searchSlots({
          providerId: p.id,
          sessionTypeId: firstType.id,
          fromISO: now.toISOString(),
          toISO: inTwoWeeks,
          now,
        });
        if (slots[0]) nextAvailable = formatISTDateTime(slots[0].slotStart);
      }
      return {
        id: p.id,
        name: p.displayName,
        title: TITLE_LABEL[p.professionalTitle] ?? p.professionalTitle,
        regNo: p.registrationNumber ?? '—',
        isActive: p.isActive,
        commissionPct: p.commissionPct,
        sessionTypesCount: p.sessionTypes.length,
        nextAvailable,
      };
    }),
  );

  const labelMap = {
    colName: t('colName'),
    colTitle: t('colTitle'),
    colReg: t('colReg'),
    colActive: t('colActive'),
    colCommission: t('colCommission'),
    colSessionTypes: t('colSessionTypes'),
    colNextAvailable: t('colNextAvailable'),
    active: t('active'),
    inactive: t('inactive'),
    commissionSaved: t('commissionSaved'),
    activeToggled: t('activeToggled'),
  };

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub', { count: rows.length })} />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <ProvidersTable rows={rows} labels={labelMap} />
      )}
    </div>
  );
}
