import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';

/* Same three families as the main site (DECISION_LOG D-002): Fraunces
 * display, Mukta body, Tiro Devanagari Hindi for the .hindi utility. Self-
 * hosted via @fontsource instead of next/font/google — this build runs in
 * a sandbox with no route to fonts.googleapis.com, and self-hosting is
 * also the better choice for the Cloudflare Workers target (architecture.md
 * §1): no build-time fetch, no third-party font CDN at request time. The
 * font family names below are set as CSS variables in globals.css and
 * resolve to these exact same faces. */
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/mukta/latin-400.css';
import '@fontsource/mukta/latin-500.css';
import '@fontsource/mukta/latin-600.css';
import '@fontsource/mukta/latin-700.css';
import '@fontsource/mukta/devanagari-400.css';
import '@fontsource/mukta/devanagari-500.css';
import '@fontsource/mukta/devanagari-600.css';
import '@fontsource/mukta/devanagari-700.css';
import '@fontsource/tiro-devanagari-hindi/devanagari-400.css';
import '@fontsource/tiro-devanagari-hindi/latin-400.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saday Wellness CRM',
  description: 'Consultation and therapy console for Saday Wellness — English and Hindi.',
};

export const viewport: Viewport = {
  themeColor: '#3E2A78',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
