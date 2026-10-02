import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { useNavigate } from 'react-router-dom';

export const RoleRoute = ({ roles = [], children }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (roles.length > 0 && !roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Your current role (<span className="font-semibold text-slate-700 dark:text-slate-300">{role}</span>) does not have sufficient permissions to view this section.
        </p>
        <Button onClick={() => navigate('/dashboard')} variant="primary" size="md">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return children;
};
