import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Award,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card } from '../common/Card.jsx';
import { dealsApi } from '../../api/dealsApi.js';

export const RevenueForecastWidget = ({ pipelineId, ownerId }) => {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    dealsApi
      .getForecast({ pipelineId, ownerId })
      .then((res) => {
        if (res.success) {
          setForecast(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [pipelineId, ownerId]);

  if (isLoading || !forecast) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  const { metrics, stageBreakdown, monthlyBreakdown } = forecast;

  return (
    <div className="space-y-4">
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Pipeline */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Open Pipeline
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              ${(metrics.totalOpenValue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.openCount || 0} active opportunities
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Weighted Forecast */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Weighted Forecast
            </p>
            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              ${(metrics.weightedForecastValue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Probability-adjusted revenue
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Closed Won */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Closed Won Deals
            </p>
            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              ${(metrics.totalWonValue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.wonCount || 0} won accounts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Win Rate & Avg Deal */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Win Rate / Avg Deal
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {metrics.winRate || 0}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Avg: ${(metrics.avgDealSize || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Chart & Stage Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Projection Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Monthly Projected Revenue by Expected Close
              </h4>
              <p className="text-[11px] text-slate-400">Total pipeline vs. probability-weighted forecast</p>
            </div>
          </div>

          {monthlyBreakdown && monthlyBreakdown.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="totalValue" name="Total Pipeline ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weightedValue" name="Weighted Forecast ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No projected close dates recorded for current opportunities.
            </div>
          )}
        </div>

        {/* Stage Value Progress Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Stage Distribution
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">Deal value and count across pipeline stages</p>

            <div className="space-y-3">
              {(stageBreakdown || []).map((stage) => {
                const percent = metrics.totalOpenValue > 0
                  ? Math.round((stage.totalValue / metrics.totalOpenValue) * 100)
                  : 0;

                return (
                  <div key={stage.stageId} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {stage.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        ${(stage.totalValue || 0).toLocaleString()} ({stage.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          backgroundColor: stage.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
