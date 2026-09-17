import { ProviderShell } from '@/components/shell/provider-shell';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderShell>{children}</ProviderShell>;
}
