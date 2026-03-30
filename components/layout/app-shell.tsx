'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar from './sidebar';
import TopBar from './top-bar';
import { CurrentUser, getCurrentUser, logout } from '@/lib/api/client';

interface AppShellProps {
  children: ReactNode;
  userRole?: string;
}

export default function AppShell({ children, userRole = 'ceo' }: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      const user = await getCurrentUser();
      if (!isMounted) return;
      setCurrentUser(user);
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/auth/login');
    router.refresh();
  }

  const effectiveRole = currentUser?.role || userRole;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} userRole={effectiveRole} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userName={currentUser?.name}
          userRole={currentUser?.role}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
