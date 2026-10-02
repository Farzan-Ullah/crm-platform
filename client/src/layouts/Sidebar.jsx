import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  FileText,
  Mail,
  BarChart3,
  Settings,
  ShieldAlert,
  UserCog,
  ChevronLeft,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useUIStore } from '../store/uiStore.js';
import { ROLES } from '../constants/roles.js';

export const Sidebar = () => {
  const { role, tenant } = useAuth();
  const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: UserCheck },
    { name: 'Contacts', to: '/contacts', icon: Users },
    { name: 'Companies', to: '/companies', icon: Building2 },
    { name: 'Deals & Pipeline', to: '/deals', icon: Briefcase },
    { name: 'Activities & Tasks', to: '/activities', icon: CheckSquare },
    { name: 'Quotations', to: '/quotes', icon: FileText },
    { name: 'Emails & Templates', to: '/emails', icon: Mail },
    {
      name: 'Reports & Analytics',
      to: '/reports',
      icon: BarChart3,
      roles: [ROLES.ADMIN, ROLES.SALES_MANAGER],
    },
    {
      name: 'User Management',
      to: '/settings/users',
      icon: UserCog,
      roles: [ROLES.ADMIN, ROLES.SALES_MANAGER],
    },
    {
      name: 'Audit Logs',
      to: '/audit-logs',
      icon: ShieldAlert,
      roles: [ROLES.ADMIN],
    },
    {
      name: 'CRM Settings',
      to: '/settings',
      icon: Settings,
      roles: [ROLES.ADMIN],
    },
  ];

  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="text-base font-bold text-white tracking-tight">NexusCRM</span>
                <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-semibold truncate">
                  {tenant?.name || 'Enterprise'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="py-4 px-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setMobileSidebarOpen(false)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Plan / Version Footer */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-emerald-400">Phase 10 Complete</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono">
              v1.10.0
            </span>
          </div>
          <p className="truncate">Production Ready & Dockerized</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-40 h-full w-inherit transition-all duration-300">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Sidebar Modal/Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
