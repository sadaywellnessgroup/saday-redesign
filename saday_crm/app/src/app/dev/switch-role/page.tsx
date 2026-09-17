import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEV_ROLE_COOKIE } from '@/lib/auth/session';
import { setAdminRole, setPatientRole, setProviderRole, clearRole } from './actions';

/** DEV ONLY. Sets the saday_dev_role cookie so every shell (`(client)`,
 * `(provider)`, `(admin)`) can be previewed without real auth. Replaced by
 * Supabase phone-OTP / email+TOTP auth in P2 (architecture.md §2). */
export default async function SwitchRolePage() {
  const t = await getTranslations('dev.switchRole');
  const cookieStore = await cookies();
  const current = cookieStore.get(DEV_ROLE_COOKIE)?.value ?? null;

  return (
    <div className="wrap flex flex-col gap-6 py-8">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="chandra" />

      <Card>
        <CardHeader>
          <CardTitle>
            {t('current')}: <Badge variant="turmeric">{current ?? t('none')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action={setPatientRole}>
            <Button type="submit">{t('goHome')}</Button>
          </form>
          <form action={setProviderRole}>
            <Button type="submit" variant="secondary">
              {t('goProvider')}
            </Button>
          </form>
          <form action={setAdminRole}>
            <Button type="submit" variant="secondary">
              {t('goAdmin')}
            </Button>
          </form>
          <form action={clearRole}>
            <Button type="submit" variant="ghost">
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
