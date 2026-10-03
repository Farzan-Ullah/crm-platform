import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  User as UserIcon,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useUIStore } from '../store/uiStore.js';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import { ROLE_LABELS, ROLE_COLORS } from '../constants/roles.js';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown.jsx';

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const { toggleSidebar, theme, toggleTheme, setMobileSidebarOpen } = useUIStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Toggle desktop collapsed sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:flex dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Global Search Trigger */}
        <div className="relative hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads, deals, contacts... (⌘K)"
            className="w-64 lg:w-80 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Interactive Notifications Center */}
        <NotificationDropdown />

        {/* User Profile Dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-xs font-bold text-white shadow-sm">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.fullName || `${user?.firstName} ${user?.lastName}`}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {ROLE_LABELS[role] || role}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 lg:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white py-2 shadow-popover dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1.5">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ROLE_LABELS[role] || role}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile?tab=profile');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors text-left"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span>Account Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile?tab=security');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors text-left"
                >
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span>Security & Sessions</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
