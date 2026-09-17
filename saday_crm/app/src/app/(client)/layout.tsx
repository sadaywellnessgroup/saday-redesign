import { ClientShell } from '@/components/shell/client-shell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
