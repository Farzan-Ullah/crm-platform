import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { ErrorBoundary } from '../components/common/ErrorBoundary.jsx';
import { useUIStore } from '../store/uiStore.js';

export const AppLayout = () => {
  const { initTheme, isSidebarCollapsed } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
