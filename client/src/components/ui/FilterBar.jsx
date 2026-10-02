import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  scoreRange,
  onScoreRangeChange,
  onReset,
}) => {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Search Input */}
      <div className="relative w-full sm:w-72 lg:w-80">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, company, email..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Filter Selects */}
      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Unqualified">Unqualified</option>
          <option value="Lost">Lost</option>
        </select>

        {/* Source Filter */}
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Sources</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
          <option value="Cold Call">Cold Call</option>
          <option value="Email">Email</option>
          <option value="Social Media">Social Media</option>
          <option value="Advertisement">Advertisement</option>
          <option value="Campaign">Campaign</option>
          <option value="Partner">Partner</option>
        </select>

        {/* Score Range Filter */}
        <select
          value={scoreRange}
          onChange={(e) => onScoreRangeChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Scores</option>
          <option value="very-hot">Very Hot (80-100)</option>
          <option value="hot">Hot (60-79)</option>
          <option value="warm">Warm (30-59)</option>
          <option value="cold">Cold (0-29)</option>
        </select>

        {/* Reset Filters */}
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
