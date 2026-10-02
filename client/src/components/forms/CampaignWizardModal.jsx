import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignFormSchema } from '../../validations/emailSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { emailsApi } from '../../api/emailsApi.js';
import toast from 'react-hot-toast';
import {
  Users,
  Send,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified'];

export const CampaignWizardModal = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState([]);
  const [audienceEstimate, setAudienceEstimate] = useState({ totalCount: 0, samples: [] });
  const [isEstimating, setIsEstimating] = useState(false);
  const [scheduleOption, setScheduleOption] = useState('now'); // 'now' | 'schedule'

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      subject: '',
      templateId: '',
      entityType: 'Lead',
      statusFilter: '',
      scoreMin: 0,
      scoreMax: 100,
      scheduledAt: '',
    },
  });

  const selectedTemplateId = watch('templateId');
  const selectedEntityType = watch('entityType');
  const selectedStatus = watch('statusFilter');
  const selectedScoreMin = watch('scoreMin');
  const selectedScoreMax = watch('scoreMax');

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      emailsApi.getTemplates({ limit: 100 }).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
          if (res.data.length > 0) {
            setValue('templateId', res.data[0]._id);
            setValue('subject', res.data[0].subject);
          }
        }
      });
      reset({
        name: '',
        subject: '',
        templateId: '',
        entityType: 'Lead',
        statusFilter: '',
        scoreMin: 0,
        scoreMax: 100,
        scheduledAt: '',
      });
      setScheduleOption('now');
    }
  }, [isOpen, reset, setValue]);

  // Update subject automatically when template changes
  const handleTemplateChange = (e) => {
    const tId = e.target.value;
    setValue('templateId', tId);
    const matched = templates.find((t) => t._id === tId);
    if (matched && !watch('subject')) {
      setValue('subject', matched.subject);
    }
  };

  // Re-estimate audience on criteria change
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsEstimating(true);

    const payload = {
      targetAudience: {
        entityType: selectedEntityType,
        filters: {
          status: selectedStatus ? [selectedStatus] : [],
          scoreMin: Number(selectedScoreMin) || 0,
          scoreMax: Number(selectedScoreMax) || 100,
        },
      },
    };

    emailsApi.estimateAudience(payload)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setAudienceEstimate(res.data);
        }
      })
      .catch((err) => console.error('Estimate audience error:', err))
      .finally(() => {
        if (isMounted) setIsEstimating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedEntityType, selectedStatus, selectedScoreMin, selectedScoreMax]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        subject: values.subject?.trim() || undefined,
        templateId: values.templateId,
        targetAudience: {
          entityType: values.entityType,
          filters: {
            status: values.statusFilter ? [values.statusFilter] : [],
            scoreMin: Number(values.scoreMin) || 0,
            scoreMax: Number(values.scoreMax) || 100,
          },
        },
        scheduledAt: scheduleOption === 'schedule' && values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
      };

      const res = await emailsApi.createCampaign(payload);
      if (res.success) {
        if (scheduleOption === 'now') {
          await emailsApi.launchCampaign(res.data._id);
          toast.success(`Campaign '${values.name}' launched to ${audienceEstimate.totalCount} recipients! 🚀`);
        } else {
          toast.success(`Campaign scheduled for ${new Date(values.scheduledAt).toLocaleString()}`);
        }
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Campaign creation error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create campaign';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Email Campaign"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Campaign Basics */}
        <div className="space-y-3">
          <Input
            label="Campaign Title"
            required
            placeholder="e.g. Q4 Executive Decision-Maker Outreach"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Email Template *
              </label>
              <select
                value={selectedTemplateId || ''}
                onChange={handleTemplateChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {templates.map((tpl) => (
                  <option key={tpl._id} value={tpl._id}>
                    {tpl.name} ({tpl.category})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject Line Override (Optional)"
              placeholder="Leave blank to use template default"
              {...register('subject')}
            />
          </div>
        </div>

        {/* Step 2: Target Audience Filtering */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Target Audience Filter
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {isEstimating ? 'Estimating...' : `Estimated: ${audienceEstimate.totalCount} recipients`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Audience Type
              </label>
              <select
                {...register('entityType')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Lead">Leads (Unconverted)</option>
                <option value="Contact">Contacts</option>
              </select>
            </div>

            {selectedEntityType === 'Lead' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Lead Status Filter
                </label>
                <select
                  {...register('statusFilter')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedEntityType === 'Lead' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Min Lead Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('scoreMin')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {audienceEstimate.samples?.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sample targets: </span>
              {audienceEstimate.samples.map((s, idx) => (
                <span key={idx} className="mr-2 text-slate-600 dark:text-slate-400">
                  {s.firstName} {s.lastName} ({s.email})
                  {idx < audienceEstimate.samples.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Launch vs Schedule */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Dispatch Timing
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScheduleOption('now')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                scheduleOption === 'now'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Send className="w-4 h-4" />
              Launch Immediately
            </button>
            <button
              type="button"
              onClick={() => setScheduleOption('schedule')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                scheduleOption === 'schedule'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedule for Later
            </button>
          </div>

          {scheduleOption === 'schedule' && (
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Select Execution Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                {...register('scheduledAt')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={scheduleOption === 'now' ? Send : Calendar}
            isLoading={isSubmitting}
            disabled={audienceEstimate.totalCount === 0}
          >
            {scheduleOption === 'now' ? 'Launch Campaign' : 'Confirm Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
