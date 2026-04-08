'use client';

import React, { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Sidebar from './sidebar';
import TopBar from './top-bar';
import { CurrentUser, getCurrentUser, logout } from '@/lib/api/client';
import { canRoleAccessPath, getDefaultRouteForRole } from '@/lib/auth/rbac';

interface AppShellProps {
  children: ReactNode;
  userRole?: string;
}

export default function AppShell({ children, userRole }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [authResolved, setAuthResolved] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      const user = await getCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setAuthResolved(true);
        router.replace('/auth/login');
        return;
      }

      setCurrentUser(user);
      setAuthResolved(true);
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!authResolved || !currentUser) return;
    if (!canRoleAccessPath(currentUser.role, pathname)) {
      router.replace(getDefaultRouteForRole(currentUser.role));
    }
  }, [authResolved, currentUser, pathname, router]);

  async function handleLogout() {
    await logout();
    router.push('/auth/login');
    router.refresh();
  }

  if (!authResolved || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  const effectiveRole = currentUser.role || userRole || 'worker';

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
