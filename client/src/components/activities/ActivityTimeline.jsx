import React, { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '../../api/activitiesApi.js';
import { ActivityFormModal } from '../forms/ActivityFormModal.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { Skeleton } from '../common/Skeleton.jsx';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Square,
  Phone,
  Calendar,
  FileText,
  Shield,
  Plus,
  Clock,
  ExternalLink,
  MapPin,
  Trash2,
  Edit2,
  ChevronDown,
  Filter,
  CheckCircle2,
} from 'lucide-react';

const TYPE_CONFIG = {
  Task: {
    icon: CheckSquare,
    badgeVariant: 'primary',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
    nodeColor: 'bg-indigo-600 text-white ring-indigo-200 dark:ring-indigo-900',
  },
  Call: {
    icon: Phone,
    badgeVariant: 'success',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    nodeColor: 'bg-emerald-600 text-white ring-emerald-200 dark:ring-emerald-900',
  },
  Meeting: {
    icon: Calendar,
    badgeVariant: 'purple',
    border: 'border-purple-200 dark:border-purple-800/80',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    nodeColor: 'bg-purple-600 text-white ring-purple-200 dark:ring-purple-900',
  },
  Note: {
    icon: FileText,
    badgeVariant: 'warning',
    border: 'border-amber-200 dark:border-amber-800/80',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    nodeColor: 'bg-amber-600 text-white ring-amber-200 dark:ring-amber-900',
  },
  Audit: {
    icon: Shield,
    badgeVariant: 'neutral',
    border: 'border-slate-200 dark:border-slate-800',
    bg: 'bg-slate-50/50 dark:bg-slate-900/40',
    nodeColor: 'bg-slate-600 text-white ring-slate-200 dark:ring-slate-800',
  },
};

export const ActivityTimeline = ({
  entityType,
  entityId,
  entityName,
  className = '',
}) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'Task',
    editData: null,
  });

  const loadTimeline = useCallback(async () => {
    if (!entityType || !entityId) return;
    try {
      setIsLoading(true);
      const res = await activitiesApi.getTimeline(entityType, entityId);
      if (res.success && Array.isArray(res.data)) {
        setTimelineItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load activity timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const handleToggleComplete = async (activityId, e) => {
    e.stopPropagation();
    try {
      const res = await activitiesApi.toggleComplete(activityId);
      if (res.success) {
        toast.success(
          res.data.status === 'Completed'
            ? 'Task marked as completed! 🎉'
            : 'Task marked as pending.'
        );
        // Optimistic / update state
        setTimelineItems((prev) =>
          prev.map((item) =>
            item.id === activityId
              ? {
                  ...item,
                  status: res.data.status,
                  completedAt: res.data.completedAt,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Toggle complete failed:', err);
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteActivity = async (activityId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await activitiesApi.deleteActivity(activityId);
      toast.success('Activity removed');
      setTimelineItems((prev) => prev.filter((item) => item.id !== activityId));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete activity');
    }
  };

  const openLogModal = (type = 'Task') => {
    setModalState({
      isOpen: true,
      type,
      editData: null,
    });
  };

  const openEditModal = async (item) => {
    try {
      const res = await activitiesApi.getActivity(item.id);
      if (res.success && res.data) {
        setModalState({
          isOpen: true,
          type: res.data.type,
          editData: res.data,
        });
      }
    } catch (err) {
      toast.error('Failed to load activity details');
    }
  };

  // Filtered entries
  const filtered = timelineItems.filter((item) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'AUDIT') return item.timelineType === 'audit';
    return item.activityType === filterType;
  });

  // Calculate counts
  const counts = {
    all: timelineItems.length,
    Task: timelineItems.filter((i) => i.activityType === 'Task').length,
    Call: timelineItems.filter((i) => i.activityType === 'Call').length,
    Meeting: timelineItems.filter((i) => i.activityType === 'Meeting').length,
    Note: timelineItems.filter((i) => i.activityType === 'Note').length,
    Audit: timelineItems.filter((i) => i.timelineType === 'audit').length,
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Activity & Timeline Feed
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Calls, tasks, meetings, notes & system audit trail
            </p>
          </div>
        </div>

        {/* Action Buttons to quickly log */}
        <div className="flex items-center flex-wrap gap-1.5">
          <Button
            size="xs"
            variant="outline"
            icon={Phone}
            onClick={() => openLogModal('Call')}
          >
            Log Call
          </Button>
          <Button
            size="xs"
            variant="outline"
            icon={Calendar}
            onClick={() => openLogModal('Meeting')}
          >
            Schedule Meet
          </Button>
          <Button
            size="xs"
            variant="outline"
            icon={FileText}
            onClick={() => openLogModal('Note')}
          >
            Add Note
          </Button>
          <Button
            size="xs"
            variant="primary"
            icon={Plus}
            onClick={() => openLogModal('Task')}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('Task')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'Task'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Tasks ({counts.Task})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('Call')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'Call'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Calls ({counts.Call})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('Meeting')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'Meeting'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Meetings ({counts.Meeting})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('Note')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'Note'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Notes ({counts.Note})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('AUDIT')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filterType === 'AUDIT'
              ? 'bg-slate-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Audit History ({counts.Audit})
        </button>
      </div>

      {/* Timeline Feed Container */}
      <div className="relative pl-6 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-4">
        {isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No activity logs recorded yet
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any of the buttons above to log calls, schedule meetings, or create tasks.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isActivity = item.timelineType === 'activity';
            const config = TYPE_CONFIG[item.activityType] || TYPE_CONFIG.Audit;
            const Icon = isActivity ? config.icon : Shield;

            return (
              <div key={item.id} className="relative group">
                {/* Node circle on vertical timeline line */}
                <div
                  className={`absolute -left-6 top-3.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] ring-4 ring-white dark:ring-slate-950 ${
                    isActivity ? config.nodeColor : 'bg-slate-500 text-white ring-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Timeline Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-150 hover:shadow-sm ${
                    isActivity
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60'
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center flex-wrap gap-2">
                      {isActivity && item.activityType === 'Task' && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleComplete(item.id, e)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title={
                            item.status === 'Completed'
                              ? 'Mark pending'
                              : 'Mark completed'
                          }
                        >
                          {item.status === 'Completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                          ) : (
                            <Square className="w-4 h-4 hover:stroke-indigo-600" />
                          )}
                        </button>
                      )}

                      <h4
                        className={`text-xs font-bold ${
                          item.status === 'Completed'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isActivity ? item.title : `Audit: ${item.action}`}
                      </h4>

                      {isActivity ? (
                        <>
                          <Badge variant={config.badgeVariant} size="sm">
                            {item.activityType}
                          </Badge>
                          {item.status && (
                            <Badge
                              variant={
                                item.status === 'Completed'
                                  ? 'success'
                                  : item.status === 'Cancelled'
                                  ? 'danger'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                          )}
                          {item.priority === 'High' && (
                            <Badge variant="danger" size="sm">
                              High Priority
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {item.entity}
                        </Badge>
                      )}
                    </div>

                    {/* Right Side: Timestamp & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {formatTimestamp(item.timestamp || item.dueDate)}
                      </span>
                      {isActivity && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit activity"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteActivity(item.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Details for specific activity types */}
                  {isActivity && (
                    <div className="mt-2 space-y-2">
                      {item.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Call specific details */}
                      {item.activityType === 'Call' && (
                        <div className="flex items-center flex-wrap gap-2 pt-1 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/60">
                            {item.callDirection || 'Outbound'} Call
                          </span>
                          {item.callOutcome && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              Outcome: {item.callOutcome}
                            </span>
                          )}
                          {item.duration > 0 && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.duration} min
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meeting specific details */}
                      {item.activityType === 'Meeting' && (
                        <div className="flex items-center flex-wrap gap-2 pt-1 text-[11px]">
                          {item.location && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                              <MapPin className="w-3 h-3 text-purple-500" />
                              {item.location}
                            </span>
                          )}
                          {item.meetingLink && (
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                              Join Call <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {item.duration > 0 && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.duration} min
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit details */}
                  {!isActivity && item.details && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {typeof item.details === 'object' ? (
                        <p className="font-mono text-[11px] bg-slate-100 dark:bg-slate-850 p-2 rounded-lg truncate">
                          {JSON.stringify(item.details)}
                        </p>
                      ) : (
                        <p>{item.details}</p>
                      )}
                    </div>
                  )}

                  {/* Footer Actor attribution */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>Recorded by</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.actor
                          ? `${item.actor.firstName || ''} ${item.actor.lastName || ''}`.trim() || item.actor.email
                          : 'System'}
                      </span>
                    </div>

                    {isActivity && item.dueDate && (
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled: {new Date(item.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity Create / Edit Modal */}
      <ActivityFormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: 'Task', editData: null })}
        onSuccess={loadTimeline}
        initialData={modalState.editData}
        defaultType={modalState.type}
        defaultEntityType={entityType}
        defaultEntityId={entityId}
        defaultEntityName={entityName}
      />
    </div>
  );
};
