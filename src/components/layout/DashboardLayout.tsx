import { ReactNode } from 'react';
import { DashboardNavbar } from './DashboardNavbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen geometric-bg">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 animate-liquid-rise">
        {children}
      </main>
    </div>
  );
}
