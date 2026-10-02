import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { activitiesApi } from '../../api/activitiesApi.js';
import { usersApi } from '../../api/usersApi.js';
import { ActivityFormModal } from '../../components/forms/ActivityFormModal.jsx';
import { CalendarView } from '../../components/activities/CalendarView.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Square,
  Phone,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  Plus,
  Search,
  Filter,
  List,
  LayoutGrid,
  Bell,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  ExternalLink,
  PhoneIncoming,
  PhoneOutgoing,
} from 'lucide-react';

export const ActivitiesPage = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await activitiesApi.getActivities({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });

      if (res.success) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.activities)
          ? res.data.activities
          : [];
        setActivities(list);
        if (res.pagination) setPagination(res.pagination);
        const statsData = res.data?.stats || res.stats;
        if (statsData) setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      toast.error('Failed to load activities list');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchActivities();
    }
  }, [fetchActivities, viewMode]);

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const res = await activitiesApi.toggleComplete(id);
      if (res.success) {
        toast.success(
          res.data?.status === 'Completed'
            ? 'Activity marked as completed! 🚀'
            : 'Activity restored to pending status.'
        );
        fetchActivities();
      }
    } catch (err) {
      toast.error('Failed to update activity status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await activitiesApi.deleteActivity(id);
      toast.success('Activity deleted');
      fetchActivities();
    } catch (err) {
      toast.error('Failed to delete activity');
    }
  };

  const handleEdit = (act) => {
    setSelectedActivity(act);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Meeting':
        return <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Note':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getEntityLink = (act) => {
    if (!act || !act.entityType || !act.entityId) return null;
    let url = '#';
    let label = '';
    const id = typeof act.entityId === 'object' && act.entityId !== null
      ? (act.entityId._id || act.entityId.id || '')
      : String(act.entityId || '');

    if (!id) return null;

    if (act.entityType === 'Lead') {
      url = `/leads/${id}`;
      label = act.leadId
        ? `${act.leadId.firstName || ''} ${act.leadId.lastName || ''}`.trim()
        : 'Lead Record';
    } else if (act.entityType === 'Contact') {
      url = `/contacts/${id}`;
      label = act.contactId
        ? `${act.contactId.firstName || ''} ${act.contactId.lastName || ''}`.trim()
        : 'Contact Record';
    } else if (act.entityType === 'Company') {
      url = `/companies/${id}`;
      label = act.companyId?.name || 'Company Account';
    } else if (act.entityType === 'Deal') {
      url = `/deals/${id}`;
      label = act.dealId?.title || 'Deal Record';
    }

    return (
      <Link
        to={url}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <span className="font-normal text-slate-400">{act.entityType}:</span>
        <span className="truncate max-w-[120px]">{label || 'View'}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Activities & Tasks
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              BullMQ Automated
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schedule customer meetings, log outbound sales calls, track tasks, and configure reminder alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: List vs Calendar */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-850">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>

          <Button size="sm" variant="primary" icon={Plus} onClick={handleCreate}>
            Log Activity
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Overdue Tasks
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.overdue || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Pending Actions
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.pending || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.completed || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.total || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* View Switcher Display */}
      {viewMode === 'calendar' ? (
        <CalendarView onActivityUpdated={fetchActivities} />
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activities, calls or notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Select Dropdown Filters */}
            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="Task">Tasks</option>
                <option value="Call">Call Logs</option>
                <option value="Meeting">Meetings</option>
                <option value="Note">Notes</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Priorities</option>
                <option value="High">High 🔥</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Activities Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No activities found
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Log sales calls, upcoming demos, or tasks to keep deals moving forward.
                </p>
                <Button size="sm" variant="primary" icon={Plus} onClick={handleCreate}>
                  Log First Activity
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-10">Done</th>
                      <th className="py-3 px-4">Activity Title</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Linked Entity</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Reminder</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {activities.map((act) => {
                      if (!act) return null;
                      const isCompleted = act.status === 'Completed';
                      let isOverdue = false;
                      try {
                        isOverdue =
                          act.status === 'Pending' &&
                          act.dueDate &&
                          !isNaN(new Date(act.dueDate).getTime()) &&
                          new Date(act.dueDate) < new Date();
                      } catch {
                        isOverdue = false;
                      }

                      return (
                        <tr
                          key={act._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors"
                        >
                          {/* Done Checkbox */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(act._id, act.status)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title={isCompleted ? 'Mark pending' : 'Mark completed'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                              ) : (
                                <Square className="w-4 h-4 hover:stroke-indigo-600" />
                              )}
                            </button>
                          </td>

                          {/* Title + Meta */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className={isCompleted ? 'line-through text-slate-400' : ''}>
                                {act.title}
                              </span>
                              {act.priority === 'High' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                                  High
                                </span>
                              )}
                            </div>
                            {act.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {act.description}
                              </p>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                              {getTypeIcon(act.type)}
                              <span>{act.type}</span>
                            </span>
                          </td>

                          {/* Linked Entity */}
                          <td className="py-3 px-4">{getEntityLink(act) || '—'}</td>

                          {/* Due Date */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span
                                className={`font-semibold ${
                                  isOverdue
                                    ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {isOverdue && <AlertTriangle className="w-3 h-3 shrink-0" />}
                                {formatDate(act.dueDate)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatTime(act.dueDate)}
                              </span>
                            </div>
                          </td>

                          {/* Assignee */}
                          <td className="py-3 px-4">
                            {act.assignedTo ? (
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                {act.assignedTo.firstName || ''} {act.assignedTo.lastName || ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>

                          {/* BullMQ Reminder Status */}
                          <td className="py-3 px-4">
                            {act.reminderEnabled ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  act.reminderSent
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                <Bell className="w-2.5 h-2.5" />
                                {act.reminderSent ? 'Sent' : `${act.reminderOffsetMinutes || 15}m alert`}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                                Off
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(act)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(act._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!isLoading && activities.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.totalPages || 1}
                  totalItems={pagination.total || 0}
                  pageSize={pagination.limit || 15}
                  onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
        onSuccess={fetchActivities}
        initialData={selectedActivity}
      />
    </div>
  );
};
