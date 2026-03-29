'use client';

import React, { ReactNode } from 'react';
import Sidebar from './sidebar';
import TopBar from './top-bar';

interface AppShellProps {
  children: ReactNode;
  userRole?: string;
}

export default function AppShell({ children, userRole = 'ceo' }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} userRole={userRole} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

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
