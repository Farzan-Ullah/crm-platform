import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  contacts: 'Contacts',
  companies: 'Companies',
  deals: 'Deals',
  activities: 'Activities',
  quotes: 'Quotes',
  emails: 'Emails',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
  teams: 'Teams',
  audit: 'Audit Logs',
  new: 'Create New',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return (
      <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
        <Home className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
        <span>Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[value] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
