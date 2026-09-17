import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { TopBar } from './top-bar';
import { SidebarNav } from './sidebar-nav';
import { BottomTabBar } from './bottom-tab-bar';

/** Shell for the `(provider)` route group — EN-only console (D-019), same
 * responsive pattern as the client shell. */
export async function ProviderShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'provider') {
    redirect('/dev/switch-role');
  }

  return (
    <div className="min-h-screen bg-cream">
      <TopBar homeHref="/pro" displayName={session.displayName} role={session.role} />
      <div className="wrap flex gap-8 py-6">
        <aside className="hidden w-56 flex-none md:block">
          <SidebarNav role="provider" />
        </aside>
        <main className="min-w-0 flex-1 pb-tabbar md:pb-6">{children}</main>
      </div>
      <BottomTabBar role="provider" />
    </div>
  );
}
