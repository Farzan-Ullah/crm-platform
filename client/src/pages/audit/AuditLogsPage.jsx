import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  X,
  FileCode,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { auditApi } from '../../api/auditApi.js';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  DELETE: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  LOGOUT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  IMPORT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  EXPORT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  CONVERT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  APPROVE: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
};

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  // Selected Log for Diffs Inspection
  const [activeLog, setActiveLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        entity: selectedEntity || undefined,
        action: selectedAction || undefined,
        search: search || undefined,
      });

      setLogs(res.data || []);
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.pagination.total,
          pages: res.pagination.pages,
        }));
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedEntity, selectedAction, search]);

  const fetchStats = async () => {
    try {
      const data = await auditApi.getAuditStats();
      setStats(data);
    } catch (err) {
      // Silently fail stats if error
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportCsv = async () => {
    try {
      await auditApi.exportAuditLogs({
        entity: selectedEntity || undefined,
        action: selectedAction || undefined,
      });
      toast.success('Audit trail CSV exported');
    } catch (err) {
      toast.error('Failed to export audit logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              Admin & Compliance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Security Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof chronological log recording all user access, updates, deletes, and bulk operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export Compliance CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Audit Events</span>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.totalEvents.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Past 24 Hours</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.last24HoursEvents.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Top Action</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.actionsBreakdown?.[0]?.action || 'UPDATE'}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Top Ingested Entity</span>
              <FileCode className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.entitiesBreakdown?.[0]?.entity || 'Lead'}
            </p>
          </Card>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, entity, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="Lead">Leads</option>
              <option value="Contact">Contacts</option>
              <option value="Company">Companies</option>
              <option value="Deal">Deals</option>
              <option value="Quote">Quotes</option>
              <option value="User">Users</option>
              <option value="TenantSettings">Settings</option>
              <option value="Auth">Auth & Logins</option>
            </select>

            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="IMPORT">IMPORT</option>
              <option value="EXPORT">EXPORT</option>
              <option value="CONVERT">CONVERT</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
            </select>

            {(search || selectedEntity || selectedAction) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedEntity('');
                  setSelectedAction('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle =
                    ACTION_COLORS[log.action] ||
                    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss') : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
                            {log.actorId?.firstName?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {log.actorId
                                ? `${log.actorId.firstName} ${log.actorId.lastName}`
                                : 'System Automated'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {log.actorId?.email || 'internal'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionStyle}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {log.entity}
                        </span>
                        {log.entityId && (
                          <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                            #{String(log.entityId).slice(-6)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.ip || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveLog(log)}
                          className="text-xs gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Diffs
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {pagination.total} audit events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="text-xs"
            >
              Previous
            </Button>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Diffs Inspection Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Payload & State Diffs
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {activeLog.action} {activeLog.entity} #{String(activeLog.entityId || '').slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Metadata Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Actor</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {activeLog.actorId ? `${activeLog.actorId.firstName} ${activeLog.actorId.lastName}` : 'System'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">IP Address</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200 truncate">{activeLog.ip || '127.0.0.1'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">User Agent</p>
                  <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate" title={activeLog.userAgent}>
                    {activeLog.userAgent || 'Chrome/V8'}
                  </p>
                </div>
              </div>

              {/* Before vs After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Before State
                    </span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-64 border border-rose-900/30">
                    {activeLog.before ? JSON.stringify(activeLog.before, null, 2) : 'null (None)'}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      After State / Payload
                    </span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64 border border-emerald-900/30">
                    {activeLog.after ? JSON.stringify(activeLog.after, null, 2) : 'null (None)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveLog(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
