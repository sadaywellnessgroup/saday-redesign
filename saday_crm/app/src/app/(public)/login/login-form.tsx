'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyOtpAction } from './actions';
import { STUB_OTP_CODE } from '@/lib/adapters/otp-code';

export function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError(t('errorPhone'));
      return;
    }
    setError(null);
    setStep('otp');
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await verifyOtpAction(otp);
      if (!result.ok) {
        setError(t('errorOtp', { code: STUB_OTP_CODE }));
        return;
      }
      router.push('/app');
      router.refresh();
    });
  }

  if (step === 'phone') {
    return (
      <form onSubmit={submitPhone} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t('phoneLabel')}</Label>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-terracotta-deep">{error}</p> : null}
        <Button type="submit" size="lg" className="h-12">
          {t('sendOtp')}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitOtp} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp">{t('otpLabel')}</Label>
        <p className="text-sm text-ink-soft">{t('otpSub', { code: STUB_OTP_CODE })}</p>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder={t('otpPlaceholder')}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-terracotta-deep">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="h-12 flex-1" onClick={() => setStep('phone')}>
          {t('changeNumber')}
        </Button>
        <Button type="submit" className="h-12 flex-1" disabled={isPending}>
          {t('verify')}
        </Button>
      </div>
    </form>
  );
}
