import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeading } from '@/components/page-heading';
import { Button } from '@/components/ui/button';

/* Route 1 — public entry point (no auth chrome). Wordmark + one-line
 * promise (EN/HI) live in PageHeading, two CTAs sit below, and a static
 * urgent-help line closes the page per D-009 (no safety screen/helpline
 * module — just this footer text). Motif is allowed here (ui-references
 * §A: welcome/empty states only). */
export default function PublicHomePage() {
  const t = useTranslations('home');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('promise')} motif="tree-hero" />

      <p className="hindi-accent px-1">{t('titleHindi')}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-14 flex-1 text-base">
          <Link href="/intake">{t('ctaBook')}</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14 flex-1 text-base">
          <Link href="/login">{t('ctaLogin')}</Link>
        </Button>
      </div>

      <p className="px-1 text-[13px] leading-relaxed text-ink-soft">{t('urgentHelp')}</p>
    </div>
  );
}
