import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activityFormSchema } from '../../validations/activitySchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { activitiesApi } from '../../api/activitiesApi.js';
import { usersApi } from '../../api/usersApi.js';
import { leadsApi } from '../../api/leadsApi.js';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import { dealsApi } from '../../api/dealsApi.js';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Phone,
  Calendar,
  FileText,
  Clock,
  Bell,
  User,
  Link as LinkIcon,
  MapPin,
  Building,
  Briefcase,
  Contact,
  Sparkles,
} from 'lucide-react';

const ACTIVITY_TYPES = [
  { id: 'Task', label: 'Task', icon: CheckSquare, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' },
  { id: 'Call', label: 'Call Log', icon: Phone, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' },
  { id: 'Meeting', label: 'Meeting', icon: Calendar, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' },
  { id: 'Note', label: 'Quick Note', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' },
];

const CALL_OUTCOMES = [
  'Connected',
  'Left Voicemail',
  'No Answer',
  'Wrong Number',
  'Busy',
  'Scheduled Callback',
  'Other',
];

export const ActivityFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  defaultType = 'Task',
  defaultEntityType = null,
  defaultEntityId = null,
  defaultEntityName = null,
}) => {
  const [salesReps, setSalesReps] = useState([]);
  const [entityOptions, setEntityOptions] = useState([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const isEdit = !!initialData?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: defaultType,
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '',
      duration: 30,
      assignedTo: '',
      entityType: defaultEntityType || '',
      entityId: defaultEntityId || '',
      callOutcome: 'Connected',
      callDirection: 'Outbound',
      phoneNumber: '',
      location: '',
      meetingLink: '',
      attendees: '',
      reminderEnabled: true,
      reminderOffsetMinutes: 15,
    },
  });

  const selectedType = watch('type');
  const selectedEntityType = watch('entityType');
  const selectedReminderEnabled = watch('reminderEnabled');

  // Load Sales Reps on open
  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesReps().then((res) => {
        if (res.success && res.data) {
          setSalesReps(res.data);
          if (!isEdit && !watch('assignedTo') && res.data[0]?._id) {
            setValue('assignedTo', res.data[0]._id);
          }
        }
      });
    }
  }, [isOpen]);

  // Load Entities dynamically when entityType changes
  useEffect(() => {
    if (!isOpen) return;

    if (!selectedEntityType) {
      setEntityOptions([]);
      return;
    }

    let isMounted = true;
    setIsLoadingEntities(true);

    const fetchEntityData = async () => {
      try {
        let res;
        if (selectedEntityType === 'Lead') {
          res = await leadsApi.getLeads({ limit: 100, isConverted: false });
          if (isMounted && res.success) {
            setEntityOptions(
              (res.data || []).map((l) => ({
                id: l._id,
                label: `${l.firstName} ${l.lastName} ${l.company ? `(${l.company})` : ''}`,
                phone: l.phone || '',
              }))
            );
          }
        } else if (selectedEntityType === 'Contact') {
          res = await contactsApi.getContacts({ limit: 100 });
          if (isMounted && res.success) {
            setEntityOptions(
              (res.data || []).map((c) => ({
                id: c._id,
                label: `${c.firstName} ${c.lastName} ${c.email ? `(${c.email})` : ''}`,
                phone: c.phone || '',
              }))
            );
          }
        } else if (selectedEntityType === 'Company') {
          res = await companiesApi.getCompanies({ limit: 100 });
          if (isMounted && res.success) {
            setEntityOptions(
              (res.data || []).map((co) => ({
                id: co._id,
                label: `${co.name} ${co.industry ? `· ${co.industry}` : ''}`,
                phone: co.phone || '',
              }))
            );
          }
        } else if (selectedEntityType === 'Deal') {
          res = await dealsApi.getDeals({ limit: 100 });
          if (isMounted && res.success) {
            setEntityOptions(
              (res.data || []).map((d) => ({
                id: d._id,
                label: `${d.title} (${d.currency || '$'}${d.value?.toLocaleString()})`,
                phone: '',
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load entity dropdown options:', err);
      } finally {
        if (isMounted) setIsLoadingEntities(false);
      }
    };

    fetchEntityData();

    return () => {
      isMounted = false;
    };
  }, [selectedEntityType, isOpen]);

  // Sync Form State on Edit / Open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Format ISO date to local input datetime-local string YYYY-MM-DDTHH:mm
        let formattedDate = '';
        if (initialData.dueDate) {
          const d = new Date(initialData.dueDate);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          formattedDate = d.toISOString().slice(0, 16);
        }

        reset({
          type: initialData.type || 'Task',
          title: initialData.title || '',
          description: initialData.description || '',
          status: initialData.status || 'Pending',
          priority: initialData.priority || 'Medium',
          dueDate: formattedDate,
          duration: initialData.duration ?? 30,
          assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
          entityType: initialData.entityType || defaultEntityType || '',
          entityId: initialData.entityId?._id || initialData.entityId || defaultEntityId || '',
          callOutcome: initialData.callOutcome || 'Connected',
          callDirection: initialData.callDirection || 'Outbound',
          phoneNumber: initialData.phoneNumber || '',
          location: initialData.location || '',
          meetingLink: initialData.meetingLink || '',
          attendees: Array.isArray(initialData.attendees)
            ? initialData.attendees.join(', ')
            : initialData.attendees || '',
          reminderEnabled: initialData.reminderEnabled ?? true,
          reminderOffsetMinutes: initialData.reminderOffsetMinutes ?? 15,
        });
      } else {
        // Default Due Date: Next hour rounded
        const defaultDue = new Date();
        defaultDue.setHours(defaultDue.getHours() + 1, 0, 0, 0);
        defaultDue.setMinutes(defaultDue.getMinutes() - defaultDue.getTimezoneOffset());
        const formattedDate = defaultDue.toISOString().slice(0, 16);

        reset({
          type: defaultType,
          title: '',
          description: '',
          status: 'Pending',
          priority: 'Medium',
          dueDate: formattedDate,
          duration: 30,
          assignedTo: salesReps[0]?._id || '',
          entityType: defaultEntityType || '',
          entityId: defaultEntityId || '',
          callOutcome: 'Connected',
          callDirection: 'Outbound',
          phoneNumber: '',
          location: '',
          meetingLink: '',
          attendees: '',
          reminderEnabled: true,
          reminderOffsetMinutes: 15,
        });
      }
    }
  }, [isOpen, initialData, defaultType, defaultEntityType, defaultEntityId]);

  // Autofill phone number if entity is picked
  const handleEntityIdChange = (e) => {
    const selectedId = e.target.value;
    setValue('entityId', selectedId);
    const matched = entityOptions.find((o) => o.id === selectedId);
    if (matched?.phone && !watch('phoneNumber')) {
      setValue('phoneNumber', matched.phone);
    }
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        type: values.type,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : new Date().toISOString(),
        duration: Number(values.duration) || 0,
        assignedTo: values.assignedTo || undefined,
        reminderEnabled: values.reminderEnabled,
        reminderOffsetMinutes: Number(values.reminderOffsetMinutes) || 15,
      };

      // Polymorphic Entity
      if (values.entityType && values.entityId) {
        payload.entityType = values.entityType;
        payload.entityId = values.entityId;
      } else {
        payload.entityType = null;
        payload.entityId = null;
      }

      // Type-specific extras
      if (values.type === 'Call') {
        payload.callOutcome = values.callOutcome || null;
        payload.callDirection = values.callDirection || 'Outbound';
        payload.phoneNumber = values.phoneNumber?.trim() || '';
      } else if (values.type === 'Meeting') {
        payload.location = values.location?.trim() || '';
        payload.meetingLink = values.meetingLink?.trim() || '';
        payload.attendees = values.attendees
          ? values.attendees
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [];
      }

      if (isEdit) {
        await activitiesApi.updateActivity(initialData._id, payload);
        toast.success(`${values.type} updated successfully!`);
      } else {
        await activitiesApi.createActivity(payload);
        toast.success(`${values.type} scheduled successfully!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save activity:', err);
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${selectedType}` : 'Log & Schedule Activity'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Activity Type Selector Tabs */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Activity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setValue('type', t.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? `${t.color} shadow-sm ring-1 ring-offset-1`
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="Subject / Title"
          required
          placeholder={
            selectedType === 'Call'
              ? 'Discovery call regarding Q4 enterprise expansion'
              : selectedType === 'Meeting'
              ? 'Architecture review & security demo'
              : selectedType === 'Note'
              ? 'Executive brief on budget approval timeline'
              : 'Follow up with lead on proposal contract'
          }
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Polymorphic Entity Relationship Section */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Related CRM Entity
            </span>
            {defaultEntityName && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Preset: {defaultEntityName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Entity Category
              </label>
              <select
                {...register('entityType')}
                disabled={!!defaultEntityType}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">None / Standalone</option>
                <option value="Lead">Lead Prospect</option>
                <option value="Contact">Contact Person</option>
                <option value="Company">Company Account</option>
                <option value="Deal">Commercial Deal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Linked Record {isLoadingEntities && '(Loading...)'}
              </label>
              <select
                value={watch('entityId') || ''}
                onChange={handleEntityIdChange}
                disabled={!selectedEntityType || !!defaultEntityId}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">
                  {selectedEntityType ? `-- Select ${selectedEntityType} --` : 'Select category first'}
                </option>
                {entityOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date, Time & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date & Scheduled Time *
            </label>
            <input
              type="datetime-local"
              required
              {...register('dueDate')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.dueDate && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority 🔥</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Pending">Pending / Incomplete</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Type-Specific Details */}
        {selectedType === 'Call' && (
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Call Details & Logging
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Call Direction
                </label>
                <select
                  {...register('callDirection')}
                  className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Outbound">Outbound ↗</option>
                  <option value="Inbound">Inbound ↙</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Call Outcome
                </label>
                <select
                  {...register('callOutcome')}
                  className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {CALL_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Dialed Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  {...register('phoneNumber')}
                  className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {selectedType === 'Meeting' && (
          <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
            <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Meeting Location & Attendees
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Location / Platform
                </label>
                <input
                  type="text"
                  placeholder="Google Meet / Room B"
                  {...register('location')}
                  className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz"
                  {...register('meetingLink')}
                  className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  {...register('duration')}
                  className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Attendees (Comma-separated emails)
              </label>
              <input
                type="text"
                placeholder="alex@client.com, sarah@company.com"
                {...register('attendees')}
                className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Assignee & Reminders Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Sales Rep *
            </label>
            <select
              {...register('assignedTo')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Select Rep --</option>
              {salesReps.map((rep) => (
                <option key={rep._id} value={rep._id}>
                  {rep.firstName} {rep.lastName} ({rep.email})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">BullMQ Reminder</p>
                <p className="text-[10px] text-slate-400">Push notification alert</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reminderEnabled"
                {...register('reminderEnabled')}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              {selectedReminderEnabled && (
                <select
                  {...register('reminderOffsetMinutes')}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value={5}>5m before</option>
                  <option value={15}>15m before</option>
                  <option value={30}>30m before</option>
                  <option value={60}>1h before</option>
                  <option value={1440}>1d before</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Description / Notes text area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Agenda / Discussion Summary
          </label>
          <textarea
            rows={3}
            placeholder="Add context, key talking points, follow-up commitments, or next steps..."
            {...register('description')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : `Schedule ${selectedType}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
