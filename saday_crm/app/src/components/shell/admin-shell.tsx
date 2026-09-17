import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { TopBar } from './top-bar';
import { SidebarNav } from './sidebar-nav';

/** Shell for the `(admin)` route group — sidebar-only, desktop-first, but
 * must not break at 360px (D-033): below md the sidebar becomes a
 * horizontal scrollable pill row instead of disappearing. */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/dev/switch-role');
  }

  return (
    <div className="min-h-screen bg-cream">
      <TopBar homeHref="/admin" displayName={session.displayName} role={session.role} />
      <div className="wrap py-4 md:hidden">
        <SidebarNav role="admin" horizontal />
      </div>
      <div className="wrap flex gap-8 py-2 md:py-6">
        <aside className="hidden w-60 flex-none md:block">
          <SidebarNav role="admin" />
        </aside>
        <main className="min-w-0 flex-1 pb-6">{children}</main>
      </div>
    </div>
  );
}
