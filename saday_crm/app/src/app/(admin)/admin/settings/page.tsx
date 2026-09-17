import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SettingsForm } from '@/components/admin/settings-form';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { cn } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'turmeric'> = {
  approved: 'default',
  draft: 'secondary',
  submitted: 'turmeric',
  paused: 'turmeric',
  rejected: 'destructive',
};

const LANGUAGE_LABEL: Record<string, string> = { en: 'English', hi: 'Hindi' };

/** Route /admin/settings — organisation name/contacts, cancellation/
 * reschedule policy (architecture §14 Q4, editable), consent text
 * version, and a read-only WhatsApp template list (D-020). */
export default async function AdminSettingsPage() {
  const t = await getTranslations('admin.settings');
  await requireAdmin();

  const [organization, policies] = await Promise.all([
    repos.organization.getById(ORG_ID),
    repos.organization.getPolicies(ORG_ID),
  ]);
  if (!organization || !policies) notFound();

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      <SettingsForm
        initial={{
          orgName: organization.name,
          whatsappNumber: organization.whatsappNumber ?? '',
          supportEmail: organization.supportEmail ?? '',
          cancellationMinNoticeHours: policies.cancellationMinNoticeHours,
          cancellationRefundPct: policies.cancellationRefundPct,
          rescheduleMinNoticeHours: policies.rescheduleMinNoticeHours,
          rescheduleMaxCount: policies.rescheduleMaxCount,
          telemedicineConsentVersion: policies.telemedicineConsentVersion,
        }}
        labels={{
          orgSection: t('orgSection'),
          orgName: t('orgName'),
          orgWhatsapp: t('orgWhatsapp'),
          orgSupportEmail: t('orgSupportEmail'),
          policiesSection: t('policiesSection'),
          policiesNote: t('policiesNote'),
          cancellationMinNoticeHours: t('cancellationMinNoticeHours'),
          cancellationRefundPct: t('cancellationRefundPct'),
          rescheduleMinNoticeHours: t('rescheduleMinNoticeHours'),
          rescheduleMaxCount: t('rescheduleMaxCount'),
          consentSection: t('consentSection'),
          consentVersion: t('consentVersion'),
          save: t('save'),
          saved: t('saved'),
        }}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <div>
            <h2 className="sec-title">{t('templatesSection')}</h2>
            <p className="text-xs text-ink-soft">{t('templatesNote')}</p>
          </div>
          <TemplatesList t={t} />
        </CardContent>
      </Card>
    </div>
  );
}

async function TemplatesList({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const templates = await repos.organization.listWhatsAppTemplates(ORG_ID);

  if (templates.length === 0) {
    return <p className="text-sm text-ink-soft">{t('templatesEmpty')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">
            <th className="py-2 pr-3 font-bold">{t('colCode')}</th>
            <th className="py-2 pr-3 font-bold">{t('colLanguage')}</th>
            <th className="py-2 font-bold">{t('colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((tpl, i) => (
            <tr key={tpl.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
              <td className="py-2.5 pr-3 font-semibold text-indigo-deep">{tpl.code}</td>
              <td className="py-2.5 pr-3 text-ink-soft">{LANGUAGE_LABEL[tpl.language] ?? tpl.language}</td>
              <td className="py-2.5">
                <Badge variant={STATUS_VARIANT[tpl.status] ?? 'secondary'}>{tpl.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
