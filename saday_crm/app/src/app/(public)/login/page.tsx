import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from './login-form';

/** Route 1b — "I have an account" stub login. DEV ONLY (see actions.ts):
 * phone + OTP, code always 000000, lands on /app. */
export default async function LoginPage() {
  const t = await getTranslations('login');
  return (
    <div className="flex flex-col gap-6">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="waves" />
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
