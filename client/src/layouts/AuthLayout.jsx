import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useUIStore } from '../store/uiStore.js';

export const AuthLayout = () => {
  const { initTheme } = useUIStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">NexusCRM</h1>
            <p className="text-xs text-indigo-400 font-medium">Enterprise CRM Platform</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 py-8 px-4 shadow-2xl border border-slate-700 sm:rounded-2xl sm:px-10 backdrop-blur-sm">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; 2026 NexusCRM Technologies. Enterprise Grade Security & Multi-Tenancy.
        </p>
      </div>
    </div>
  );
};
