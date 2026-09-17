import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';
import { formatISTDate } from '@/lib/utils';
import { signOutAction } from './actions';

const SEX_LABEL_KEY: Record<string, string> = {
  female: 'sexFemale',
  male: 'sexMale',
  other: 'sexOther',
  prefer_not: 'sexPreferNot',
};

/** Route 14 — name/age/sex, language, read-only phone (D-031: phone is an
 * attribute, not identity — "contact us to change"), consent history, sign
 * out. */
export default async function ProfilePage() {
  const t = await getTranslations('appProfile');
  const tIntake = await getTranslations('intake');
  const session = await getSession();
  const patient = session?.patientId ? await repos.patient.getById(session.patientId) : null;
  const user = session?.userId ? await repos.user.getById(session.userId) : null;
  const consents = session?.userId ? await repos.consent.listForUser(session.userId) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} motif="lotus" />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <Field label={t('name')} value={patient?.displayName ?? '—'} />
          <Field label={t('age')} value={patient ? String(patient.ageYears) : '—'} />
          <Field label={t('sex')} value={patient ? tIntake(SEX_LABEL_KEY[patient.sex] ?? 'sexPreferNot') : '—'} />
          <Field label={t('language')} value={patient?.preferredLanguage === 'hi' ? 'हिन्दी' : 'English'} />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">{t('phone')}</span>
            <span className="font-medium text-ink">{user?.phoneLast4 ? `•••• ${user.phoneLast4}` : '—'}</span>
          </div>
          <p className="text-xs text-ink-soft">{t('phoneNote')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('consentHistory')}</h2>
          {consents.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('noConsents')}</p>
          ) : (
            consents.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{c.consentType.replace(/_/g, ' ')}</span>
                <Badge variant="secondary">{t('consentAccepted', { date: formatISTDate(c.acceptedAt) })}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="lg" className="h-12 w-full">
          {t('signOut')}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
