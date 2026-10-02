import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Flame,
  Phone,
  CheckSquare,
  FileText,
  Building2,
  Layers,
  Kanban,
  FileCheck,
  PieChart,
  Mail,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { reportsApi } from '../../api/reportsApi.js';
import { dealsApi } from '../../api/dealsApi.js';
import { leadsApi } from '../../api/leadsApi.js';
import { activitiesApi } from '../../api/activitiesApi.js';
import { LeadFormModal } from '../../components/forms/LeadFormModal.jsx';
import { DealFormModal } from '../../components/forms/DealFormModal.jsx';
import { ActivityFormModal } from '../../components/forms/ActivityFormModal.jsx';
import toast from 'react-hot-toast';

const formatCurrency = (val = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const DashboardPage = () => {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [topDeals, setTopDeals] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);

  // Modal states
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [summaryRes, funnelRes, dealsRes, leadsRes, activitiesRes] = await Promise.allSettled([
        reportsApi.getSummary(),
        reportsApi.getFunnel(),
        dealsApi.getDeals({ limit: 5, status: 'Open', sortBy: 'value', sortOrder: 'desc' }),
        leadsApi.getLeads({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        activitiesApi.getActivities({ status: 'Pending', limit: 5, sortBy: 'dueDate', sortOrder: 'asc' }),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setSummary(summaryRes.value.data);
      }
      if (funnelRes.status === 'fulfilled' && funnelRes.value?.data) {
        setFunnel(funnelRes.value.data);
      }
      if (dealsRes.status === 'fulfilled' && dealsRes.value?.data) {
        setTopDeals(Array.isArray(dealsRes.value.data) ? dealsRes.value.data : []);
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setRecentLeads(Array.isArray(leadsRes.value.data) ? leadsRes.value.data : []);
      }
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value?.data) {
        setUpcomingActivities(Array.isArray(activitiesRes.value.data) ? activitiesRes.value.data : []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleToggleActivity = async (activityId) => {
    try {
      await activitiesApi.toggleComplete(activityId);
      toast.success('Activity marked as completed');
      // Update local state smoothly
      setUpcomingActivities((prev) => prev.filter((a) => a._id !== activityId));
      // Refresh summary counts
      reportsApi.getSummary().then((res) => {
        if (res?.data) setSummary(res.data);
      });
    } catch (err) {
      toast.error('Failed to update activity');
    }
  };

  const getLeadScoreBadge = (score = 0) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Flame className="w-3 h-3 fill-emerald-500 text-emerald-500" />
          {score}
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
          {score}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
        {score}
      </span>
    );
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Meeting':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Task':
        return <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* 1. Executive CRM Greeting & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentDateFormatted}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {tenant?.name || 'Enterprise CRM'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your live revenue pipeline, priority tasks, and latest sales activities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsActivityModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Log Activity</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsLeadModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>New Lead</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDealModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      {/* 2. Core Business KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Pipeline */}
        <Card className="hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Pipeline
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(summary?.openPipelineValue || 0)}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Weighted Forecast:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(summary?.weightedForecastValue || 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Revenue Won */}
        <Card className="hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Closed Won Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.revenueWon || 0)}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Won Deals:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {summary?.totalClosedDeals || 0} closed
              </span>
            </div>
          </div>
        </Card>

        {/* Lead Volume & Conversion */}
        <Card className="hover:border-sky-200 dark:hover:border-sky-800/60 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Leads
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {summary?.totalLeads || 0}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {summary?.leadConversionRate || 0}%
              </span>
              <span>lead-to-deal conversion</span>
            </div>
          </div>
        </Card>

        {/* Win Rate */}
        <Card className="hover:border-purple-200 dark:hover:border-purple-800/60 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Deal Win Rate
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {summary?.winRate || 0}%
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Avg Deal:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(summary?.avgWonDealSize || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Visual Sales Funnel Pipeline */}
      {funnel?.stages && funnel.stages.length > 0 && (
        <Card
          title="Sales Pipeline Funnel"
          subtitle="Conversion velocity across lead ingestion, qualification, and closed deals"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/deals')}
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>View Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            {funnel.stages.map((stage, idx) => (
              <div
                key={stage.stage}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium truncate">{stage.stage}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">#{idx + 1}</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {stage.count}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Step Rate:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {stage.conversionFromPrevious}%
                  </span>
                </div>
                {/* Visual conversion bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stage.overallConversionRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Core Operational Grid: Top Open Deals & Pending Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Deals (2 Columns on large screens) */}
        <Card
          className="lg:col-span-2"
          title="Priority Open Deals"
          subtitle="Largest commercial opportunities currently in negotiation"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/deals')}
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>All Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : topDeals.length === 0 ? (
            <EmptyState
              title="No open deals"
              description="Create a deal to start tracking sales pipeline opportunities."
              action={
                <Button size="sm" onClick={() => setIsDealModalOpen(true)}>
                  Create Deal
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topDeals.map((deal) => (
                <div
                  key={deal._id}
                  onClick={() => navigate(`/deals/${deal._id}`)}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {deal.title}
                      </h4>
                      {deal.stageId?.name && (
                        <Badge variant="primary" size="sm">
                          {deal.stageId.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {deal.companyId?.name && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {deal.companyId.name}
                        </span>
                      )}
                      {deal.expectedClose && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Close: {formatDate(deal.expectedClose)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(deal.value)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {deal.probability ? `${deal.probability}% win prob.` : 'In Progress'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Priority Activities & Next Actions */}
        <Card
          title="Scheduled Activities"
          subtitle="Tasks, calls & meetings due"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingActivities.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-xs text-slate-400 mt-0.5">No overdue or pending activities.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsActivityModalOpen(true)}
                className="mt-3 text-xs"
              >
                Schedule Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingActivities.map((act) => {
                const isOverdue = act.dueDate && new Date(act.dueDate) < new Date();
                return (
                  <div
                    key={act._id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleActivity(act._id)}
                      className="mt-0.5 w-5 h-5 rounded border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center text-transparent hover:text-emerald-600 transition-colors shrink-0"
                      title="Mark as completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {getActivityIcon(act.type)}
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {act.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {act.dueDate && (
                          <span
                            className={
                              isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {isOverdue ? 'Overdue: ' : 'Due: '}
                            {formatDate(act.dueDate)}
                          </span>
                        )}
                        {act.priority && (
                          <span className="text-slate-400">• {act.priority} priority</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Bottom Row: Hot Ingested Leads & CRM Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Leads (2 Columns) */}
        <Card
          className="lg:col-span-2"
          title="Recent High-Scoring Leads"
          subtitle="New leads ranked by conversion probability"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/leads')}
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <EmptyState
              title="No leads yet"
              description="Capture leads via web forms or create one manually."
              action={
                <Button size="sm" onClick={() => setIsLeadModalOpen(true)}>
                  Add Lead
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-semibold">Lead Contact</th>
                    <th className="pb-2.5 font-semibold">Company</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-center">Score</th>
                    <th className="pb-2.5 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-slate-700 dark:text-slate-300">
                        {lead.company || '—'}
                      </td>
                      <td className="py-2.5 pr-2">
                        <Badge variant="primary" size="sm">
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-2 text-center">
                        {getLeadScoreBadge(lead.score)}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {lead.source || 'Website'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick CRM Launchpad */}
        <Card title="Quick Navigation Hub" subtitle="Jump to core CRM modules">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/deals')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900/60 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Kanban className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">Kanban Deals</h6>
                  <p className="text-[11px] text-slate-400">Drag & drop revenue stages</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-900/60 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">Quotes & PDF</h6>
                  <p className="text-[11px] text-slate-400">Proposals & discount approvals</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-slate-900/60 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">Sales Analytics</h6>
                  <p className="text-[11px] text-slate-400">Forecasting & conversion reports</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/emails')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-white dark:bg-slate-900/60 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white">Email Campaigns</h6>
                  <p className="text-[11px] text-slate-400">Broadcasts & open tracking</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </button>
          </div>
        </Card>
      </div>

      {/* Embedded Action Modals */}
      {isLeadModalOpen && (
        <LeadFormModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          onSuccess={() => {
            setIsLeadModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {isDealModalOpen && (
        <DealFormModal
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          onSuccess={() => {
            setIsDealModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {isActivityModalOpen && (
        <ActivityFormModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          onSuccess={() => {
            setIsActivityModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};
