import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
  Calendar,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { reportsApi } from '../../api/reportsApi.js';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState('30d'); // '7d' | '30d' | '90d' | 'ytd' | 'all'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'funnel' | 'forecast' | 'leaderboard' | 'sources' | 'winloss'

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [sources, setSources] = useState([]);
  const [winLoss, setWinLoss] = useState(null);
  const [activities, setActivities] = useState(null);

  const calculateDateRange = useCallback(() => {
    const now = new Date();
    let start = null;

    if (timeRange === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '90d') {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: start ? now.toISOString() : undefined,
    };
  }, [timeRange]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const dates = calculateDateRange();

      const [
        summaryRes,
        funnelRes,
        forecastRes,
        leaderboardRes,
        sourcesRes,
        winLossRes,
        activitiesRes,
      ] = await Promise.all([
        reportsApi.getSummary(dates),
        reportsApi.getFunnel(dates),
        reportsApi.getForecast(dates),
        reportsApi.getLeaderboard(dates),
        reportsApi.getSources(dates),
        reportsApi.getWinLoss(dates),
        reportsApi.getActivities(dates),
      ]);

      if (summaryRes?.data) setSummary(summaryRes.data);
      if (funnelRes?.data) setFunnel(funnelRes.data);
      if (forecastRes?.data) setForecast(forecastRes.data);
      if (leaderboardRes?.data) setLeaderboard(leaderboardRes.data);
      if (sourcesRes?.data) setSources(sourcesRes.data);
      if (winLossRes?.data) setWinLoss(winLossRes.data);
      if (activitiesRes?.data) setActivities(activitiesRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load analytics dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [calculateDateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      {/* Top Header & Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            Executive Analytics & Forecasting
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline funnel conversions, cohort revenue forecast, rep leaderboard, and source attribution.
          </p>
        </div>

        {/* Time Range Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: 'Quarter' },
            { id: 'ytd', label: 'YTD' },
            { id: 'all', label: 'All Time' },
          ].map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === range.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Closed Revenue Won
            </p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${summary ? summary.revenueWon?.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {summary ? `${summary.winRate}% win rate` : '—'}
            </span>
          </div>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open Pipeline Value
            </p>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${summary ? summary.openPipelineValue?.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              ${summary ? `${summary.weightedForecastValue?.toLocaleString()} weighted` : '—'}
            </span>
          </div>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lead Conversion
            </p>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? `${summary.leadConversionRate}%` : '0%'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {summary?.totalLeads || 0} leads total
            </span>
          </div>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Activity Completion
            </p>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? `${summary.activitiesCompletedRate}%` : '0%'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {summary?.totalActivitiesLogged || 0} activities
            </span>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Executive Overview' },
          { id: 'funnel', label: 'Conversion Funnel' },
          { id: 'forecast', label: 'Revenue Forecast' },
          { id: 'leaderboard', label: 'Rep Leaderboard' },
          { id: 'sources', label: 'Source Attribution & ROI' },
          { id: 'winloss', label: 'Win / Loss Debrief' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Forecast Cohorts Chart */}
              <Card
                title="Revenue Pipeline & Monthly Forecast Cohorts"
                subtitle="Projected revenue cohorts by target expected close date"
              >
                <div className="h-72 w-full pt-4">
                  {forecast?.cohorts?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecast.cohorts}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                        <YAxis
                          fontSize={11}
                          stroke="#94a3b8"
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="openPipeline" name="Open Pipeline ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="weightedForecast" name="Weighted Forecast ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actualWon" name="Actual Closed Won ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-24">No deal cohorts available for this period.</p>
                  )}
                </div>
              </Card>

              {/* 2 Columns: Funnel Summary & Rep Leaderboard Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Progress */}
                <Card
                  title="Lead Lifecycle Funnel"
                  subtitle="Drop-off progression from ingest to closed won"
                  actions={
                    <Button size="xs" variant="outline" onClick={() => setActiveTab('funnel')}>
                      Full Funnel
                    </Button>
                  }
                >
                  <div className="space-y-3.5 pt-2">
                    {funnel?.stages?.map((stage, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">{stage.stage}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {stage.count} ({stage.overallConversionRate}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, stage.overallConversionRate)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top Reps Preview */}
                <Card
                  title="Sales Representative Rankings"
                  subtitle="Performance ranked by closed won contract revenue"
                  actions={
                    <Button size="xs" variant="outline" onClick={() => setActiveTab('leaderboard')}>
                      View All
                    </Button>
                  }
                >
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {leaderboard.slice(0, 4).map((rep) => (
                      <div key={rep.userId} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              rep.rank === 1
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : rep.rank === 2
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                : rep.rank === 3
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {rep.rank}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{rep.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {rep.wonCount} won • {rep.winRate}% win rate
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">
                            ${rep.revenueWon?.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-indigo-500 font-medium">
                            ${rep.openPipeline?.toLocaleString()} open
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: LEAD CONVERSION FUNNEL */}
          {activeTab === 'funnel' && (
            <Card
              title="End-to-End Lead-to-Revenue Funnel"
              subtitle="Detailed stage-by-stage drop-off analytics & conversion velocity"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
                {funnel?.stages?.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2 shadow-sm">
                      {idx + 1}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{stage.stage}</h4>
                    <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                      {stage.count}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1 text-slate-500">
                      <p>
                        Step Efficiency: <strong>{stage.conversionFromPrevious}%</strong>
                      </p>
                      <p>
                        Overall Yield: <strong>{stage.overallConversionRate}%</strong>
                      </p>
                      {stage.dropoff > 0 && (
                        <p className="text-rose-500 font-medium">
                          -{stage.dropoff} drop-off
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conversion Summary Callout */}
              <div className="mt-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                    Funnel Efficiency Benchmark
                  </h4>
                  <p className="text-indigo-700 dark:text-indigo-300 mt-0.5">
                    From {funnel?.summary?.totalLeads || 0} ingested leads, {funnel?.summary?.conversionRate}% were qualified into deal opportunities.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase font-bold text-indigo-400">Total Closed Revenue</p>
                  <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-300">
                    ${funnel?.summary?.totalWonRevenue?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: REVENUE FORECASTING */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <Card
                title="Weighted Revenue Forecast by Close Month"
                subtitle="Comparing unweighted pipeline, probability-adjusted forecast, and closed contracts"
              >
                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast?.cohorts || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                      <YAxis
                        fontSize={11}
                        stroke="#94a3b8"
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#ffffff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="openPipeline" name="Open Pipeline ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="weightedForecast" name="Weighted Forecast ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actualWon" name="Actual Closed Won ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lostAmount" name="Closed Lost ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Forecast Cohorts Data Table */}
              <Card title="Forecast Cohort Breakdown Table" noPadding>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Cohort Month</th>
                        <th className="py-3 px-4 text-center">Deals</th>
                        <th className="py-3 px-4 text-right">Open Pipeline</th>
                        <th className="py-3 px-4 text-right">Weighted Forecast</th>
                        <th className="py-3 px-4 text-right">Closed Won</th>
                        <th className="py-3 px-4 text-right">Closed Lost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {forecast?.cohorts?.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {c.month}
                          </td>
                          <td className="py-3 px-4 text-center">{c.totalDeals}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            ${c.openPipeline?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                            ${c.weightedForecast?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ${c.actualWon?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-500">
                            ${c.lostAmount?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: SALES REP LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <Card title="Sales Representative Performance Leaderboard" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">Rank</th>
                      <th className="py-3 px-4">Sales Representative</th>
                      <th className="py-3 px-4 text-right">Won Revenue</th>
                      <th className="py-3 px-4 text-center">Won / Lost</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-right">Open Pipeline</th>
                      <th className="py-3 px-4 text-center">Avg Cycle (Days)</th>
                      <th className="py-3 px-4 text-center">Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboard.map((rep) => (
                      <tr key={rep.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                        <td className="py-3 px-4 text-center font-bold">
                          {rep.rank === 1 ? '🥇 1' : rep.rank === 2 ? '🥈 2' : rep.rank === 3 ? '🥉 3' : rep.rank}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{rep.name}</p>
                          <p className="text-[11px] text-slate-400">{rep.email}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${rep.revenueWon?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-emerald-600 font-bold">{rep.wonCount}</span> /{' '}
                          <span className="text-rose-500 font-bold">{rep.lostCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              rep.winRate >= 50
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {rep.winRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${rep.openPipeline?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {rep.avgSalesCycleDays || '—'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {rep.completedActivities} completed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: SOURCE ATTRIBUTION & ROI */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart: Revenue by Source */}
                <Card title="Revenue Won by Lead Source Channel" subtitle="Share of closed deals per marketing channel">
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sources}
                          dataKey="revenueWon"
                          nameKey="source"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {sources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Conversion Rate by Source */}
                <Card title="Source Conversion Efficiency" subtitle="Lead-to-deal conversion % per acquisition channel">
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sources} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis type="number" fontSize={11} stroke="#94a3b8" unit="%" />
                        <YAxis dataKey="source" type="category" fontSize={11} stroke="#94a3b8" width={90} />
                        <Tooltip
                          formatter={(val) => [`${val}%`, 'Conversion Rate']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="conversionRate" name="Conversion Rate (%)" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Attribution Table */}
              <Card title="Channel Attribution Breakdown Table" noPadding>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4 text-center">Total Leads</th>
                        <th className="py-3 px-4 text-center">Converted</th>
                        <th className="py-3 px-4 text-center">Conv. Rate</th>
                        <th className="py-3 px-4 text-center">Deals Won</th>
                        <th className="py-3 px-4 text-right">Revenue Won</th>
                        <th className="py-3 px-4 text-right">Avg Deal Size</th>
                        <th className="py-3 px-4 text-center">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sources.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.source}</td>
                          <td className="py-3 px-4 text-center">{s.totalLeads}</td>
                          <td className="py-3 px-4 text-center">{s.convertedLeads}</td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {s.conversionRate}%
                          </td>
                          <td className="py-3 px-4 text-center">{s.wonDeals}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ${s.revenueWon?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">${s.avgDealSize?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center font-semibold">{s.revenueShare}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: WIN / LOSS DEBRIEF */}
          {activeTab === 'winloss' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Decisions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {winLoss?.metrics?.totalClosed || 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Win Rate</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {winLoss?.metrics?.winRate || 0}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {winLoss?.metrics?.wonCount} won contracts
                  </p>
                </Card>

                <Card>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Average Won Deal</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    ${winLoss?.metrics?.avgWonValue?.toLocaleString() || 0}
                  </p>
                </Card>

                <Card>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Lost Revenue Opportunity</p>
                  <p className="text-2xl font-bold text-rose-500 mt-1">
                    ${winLoss?.metrics?.lostValue?.toLocaleString() || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {winLoss?.metrics?.lostCount} lost deals
                  </p>
                </Card>
              </div>

              {/* Lost Reasons Breakdown */}
              <Card
                title="Closed Lost Root Cause Debrief"
                subtitle="Primary disqualification and competitor loss reasons"
              >
                <div className="h-64 w-full pt-4">
                  {winLoss?.lostReasons?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={winLoss.lostReasons}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="reason" fontSize={11} stroke="#94a3b8" />
                        <YAxis fontSize={11} stroke="#94a3b8" />
                        <Tooltip
                          formatter={(value, name) => [value, name === 'count' ? 'Lost Deals' : name]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="count" name="Lost Deals" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-24">No lost reasons recorded.</p>
                  )}
                </div>

                {/* Reasons List */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {winLoss?.lostReasons?.map((r, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.reason}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {r.count} deals ({r.percentage}%)
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          ${r.totalValue?.toLocaleString()} lost
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
