import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { TopBar } from './top-bar';
import { SidebarNav } from './sidebar-nav';
import { BottomTabBar } from './bottom-tab-bar';

/** Shell for the `(client)` route group — patient-facing, bilingual
 * (D-019). Top bar + bottom tab bar on <md, left sidebar >=md, content
 * capped at max-w-wrap like the main site (D-002). */
export async function ClientShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    redirect('/dev/switch-role');
  }

  return (
    <div className="min-h-screen bg-cream">
      <TopBar homeHref="/app" displayName={session.displayName} role={session.role} profileHref="/app/profile" />
      <div className="wrap flex gap-8 py-6">
        <aside className="hidden w-56 flex-none md:block">
          <SidebarNav role="client" />
        </aside>
        <main className="min-w-0 flex-1 pb-tabbar md:pb-6">{children}</main>
      </div>
      <BottomTabBar role="client" />
    </div>
  );
}
