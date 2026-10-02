import React, { useState, useEffect, useCallback } from 'react';
import { emailsApi } from '../../api/emailsApi.js';
import { SendEmailModal } from '../../components/forms/SendEmailModal.jsx';
import { EmailTemplateModal } from '../../components/forms/EmailTemplateModal.jsx';
import { CampaignWizardModal } from '../../components/forms/CampaignWizardModal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import toast from 'react-hot-toast';
import {
  Mail,
  Send,
  FileText,
  Rocket,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  MousePointer,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ExternalLink,
} from 'lucide-react';

export const EmailsPage = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'templates' | 'logs'

  // Modals
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templateCategory, setTemplateCategory] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsStats, setLogsStats] = useState({ totalSent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 });
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatus, setLogsStatus] = useState('');
  const [logsLoading, setLogsLoading] = useState(true);

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // 1. Fetch Campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const res = await emailsApi.getCampaigns({ limit: 50 });
      if (res.success) {
        setCampaigns(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // 2. Fetch Templates
  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const res = await emailsApi.getTemplates({
        category: templateCategory || undefined,
        limit: 100,
      });
      if (res.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [templateCategory]);

  // 3. Fetch Email Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await emailsApi.getEmails({
        page: logsPagination.page,
        limit: logsPagination.limit,
        search: logsSearch.trim() || undefined,
        status: logsStatus || undefined,
      });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : res.data?.emails || [];
        setLogs(list);
        if (res.pagination) setLogsPagination(res.pagination);
        if (res.data?.stats) setLogsStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPagination.page, logsPagination.limit, logsSearch, logsStatus]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchCampaigns, fetchTemplates, fetchLogs]);

  // Launch campaign
  const handleLaunchCampaign = async (campaignId) => {
    try {
      await emailsApi.launchCampaign(campaignId);
      toast.success('Campaign launched! Outbound queue processing...');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to launch campaign');
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await emailsApi.deleteCampaign(campaignId);
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) return;
    try {
      await emailsApi.deleteTemplate(templateId);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Emails & Marketing Campaigns
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Nodemailer + Pixel Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Outbound email dispatch, variable template designer, 1x1 open pixel tracking, and targeted bulk audience campaigns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={FileText}
            onClick={() => {
              setSelectedTemplate(null);
              setIsTemplateModalOpen(true);
            }}
          >
            New Template
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={Rocket}
            onClick={() => setIsCampaignModalOpen(true)}
          >
            New Campaign
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Send}
            onClick={() => setIsSendEmailOpen(true)}
          >
            Compose Email
          </Button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'campaigns'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Rocket className="w-4 h-4" />
          Email Campaigns ({campaigns.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Template Studio ({templates.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Delivery Logs & Tracking
        </button>
      </div>

      {/* ================= TAB 1: CAMPAIGNS ================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-5">
          {/* KPI Analytics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Campaigns
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {campaigns.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <Rocket className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Dispatched
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {campaigns.reduce((acc, c) => acc + (c.stats?.sentCount || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Send className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Avg Open Rate
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {logsStats.openRate || 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Click-Through Rate
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {logsStats.clickRate || 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <MousePointer className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Campaigns Table Container */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {campaignsLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Rocket className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No marketing campaigns created yet
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Create targeted bulk outreach campaigns filtered by lead score, status, or tags.
                </p>
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsCampaignModalOpen(true)}>
                  Create First Campaign
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Target Audience</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Delivery & Opens</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {campaigns.map((camp) => (
                      <tr key={camp._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{camp.name}</div>
                          <span className="text-[11px] font-normal text-slate-400 truncate max-w-xs block">
                            Subj: {camp.subject}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {camp.targetAudience?.entityType || 'Lead'}s
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {camp.stats?.totalRecipients || 0} total recipients
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {camp.templateId?.name || 'Standard Template'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              camp.status === 'Completed'
                                ? 'success'
                                : camp.status === 'Sending'
                                ? 'primary'
                                : camp.status === 'Scheduled'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {camp.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-slate-600 dark:text-slate-300">
                              Sent: <strong>{camp.stats?.sentCount || 0}</strong>
                            </span>
                            <span className="text-emerald-600 font-medium">
                              Opens: <strong>{camp.stats?.openedCount || 0}</strong>
                            </span>
                            <span className="text-indigo-600 font-medium">
                              Clicks: <strong>{camp.stats?.clickedCount || 0}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {formatDate(camp.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {camp.status === 'Draft' && (
                              <button
                                type="button"
                                onClick={() => handleLaunchCampaign(camp._id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                Launch
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(camp._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: TEMPLATES ================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Category Filter & New Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Category Filter:</span>
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="FollowUp">Follow-Up</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Transactional">Transactional</option>
              </select>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedTemplate(null);
                setIsTemplateModalOpen(true);
              }}
            >
              Create New Template
            </Button>
          </div>

          {/* Templates Grid */}
          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No email templates found
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Design custom templates with dynamic tags like &#123;&#123;firstName&#125;&#125; and &#123;&#123;company&#125;&#125;.
              </p>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsTemplateModalOpen(true)}>
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="primary" size="sm">
                        {tpl.category}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(tpl.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      Subj: {tpl.subject}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {tpl.variables?.length || 0} variables
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setIsTemplateModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DELIVERY LOGS & TRACKING ================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or recipient..."
                value={logsSearch}
                onChange={(e) => {
                  setLogsSearch(e.target.value);
                  setLogsPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={logsStatus}
                onChange={(e) => {
                  setLogsStatus(e.target.value);
                  setLogsPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Opened">Opened (Pixel)</option>
                <option value="Clicked">Clicked (Link)</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {logsLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No outbound email records found
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Send emails to prospects or launch campaigns to observe real-time open and click telemetry.
                </p>
                <Button size="sm" variant="primary" icon={Send} onClick={() => setIsSendEmailOpen(true)}>
                  Send First Email
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Telemetry</th>
                      <th className="py-3 px-4">Sender</th>
                      <th className="py-3 px-4">Dispatched At</th>
                      <th className="py-3 px-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {log.to}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              log.status === 'Clicked'
                                ? 'purple'
                                : log.status === 'Opened'
                                ? 'success'
                                : log.status === 'Sent'
                                ? 'primary'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={log.openCount > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                              {log.openCount} opens
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className={log.clickCount > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                              {log.clickCount} clicks
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {log.sentBy?.firstName || 'System'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Email Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!logsLoading && logs.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={logsPagination.page || 1}
                  totalPages={logsPagination.totalPages || 1}
                  totalItems={logsPagination.total || 0}
                  pageSize={logsPagination.limit || 15}
                  onPageChange={(p) => setLogsPagination((prev) => ({ ...prev, page: p }))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Email Details View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-2xl w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Email Dispatch Details
              </h3>
              <Badge variant={selectedLog.status === 'Opened' ? 'success' : 'primary'} size="sm">
                {selectedLog.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400">To: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.to}</span>
              </div>
              <div>
                <span className="text-slate-400">From: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.from}</span>
              </div>
              <div>
                <span className="text-slate-400">Tracking UUID: </span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{selectedLog.trackingId}</span>
              </div>
              <div>
                <span className="text-slate-400">Sent Date: </span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(selectedLog.createdAt)}</span>
              </div>
            </div>

            {/* Email Body Rendering */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Dispatched HTML Body
              </span>
              <div
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
              />
            </div>

            {/* Telemetry Events History */}
            {selectedLog.opens?.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                  Pixel Open Events ({selectedLog.opens.length}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedLog.opens.map((ev, idx) => (
                    <div key={idx} className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg flex items-center justify-between">
                      <span>Opened at: {formatDate(ev.openedAt)}</span>
                      <span>IP: {ev.ip || 'Local/Proxy'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SendEmailModal
        isOpen={isSendEmailOpen}
        onClose={() => setIsSendEmailOpen(false)}
        onSuccess={() => {
          fetchLogs();
          if (activeTab === 'campaigns') fetchCampaigns();
        }}
      />

      <EmailTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setSelectedTemplate(null);
        }}
        onSuccess={fetchTemplates}
        initialData={selectedTemplate}
      />

      <CampaignWizardModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
};
