import { PublicHeader } from '@/components/shell/public-header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <PublicHeader />
      <main className="wrap py-8">{children}</main>
    </div>
  );
}
