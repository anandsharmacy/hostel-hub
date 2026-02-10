import { ReactNode } from 'react';
import { DashboardNavbar } from './DashboardNavbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
