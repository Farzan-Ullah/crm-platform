import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Layers } from 'lucide-react';

export const UpcomingPhaseView = ({ title, phaseNumber, description, features = [] }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <Badge variant="purple" size="sm">Phase {phaseNumber}</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Scheduled for Phase {phaseNumber} Implementation
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Phase 1 (Base Architecture, Authentication, Multi-Tenancy & RBAC) is active and running. This module is queued for Phase {phaseNumber}.
          </p>

          <div className="text-left bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Core Capabilities in this Module:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
