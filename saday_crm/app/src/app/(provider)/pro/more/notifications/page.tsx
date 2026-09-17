import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { NotificationForm } from '@/components/provider/settings-forms';
import { requireProvider } from '@/lib/provider/console-data';
import { getNotificationPrefsAction } from '@/app/(provider)/pro/more/actions';

/** Route /pro/more/notifications — real toggles, not a "coming soon" stub
 * (MantraCare digest §12 ships three of those; we don't). */
export default async function NotificationSettingsPage() {
  const t = await getTranslations('pro.notifications');
  await requireProvider();
  const prefs = await getNotificationPrefsAction();

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />
      <NotificationForm initial={prefs} />
      <p className="px-1 text-xs text-ink-soft">{t('note')}</p>
    </div>
  );
}
