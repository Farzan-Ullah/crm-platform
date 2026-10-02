import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealFormSchema } from '../../validations/dealSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { dealsApi } from '../../api/dealsApi.js';
import { pipelinesApi } from '../../api/pipelinesApi.js';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import { usersApi } from '../../api/usersApi.js';
import toast from 'react-hot-toast';
import { DollarSign, Layers, User, Building2, Calendar, Target } from 'lucide-react';

export const DealFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  defaultPipelineId = null,
  defaultStageId = null,
}) => {
  const [pipelines, setPipelines] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  const isEdit = !!initialData?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: '',
      value: 10000,
      pipelineId: '',
      stageId: '',
      contactId: '',
      companyId: '',
      ownerId: '',
      expectedClose: '',
      probability: 10,
      priority: 'Medium',
      status: 'Open',
      source: 'Outbound',
      tags: '',
      description: '',
    },
  });

  const selectedPipelineId = watch('pipelineId');
  const selectedStageId = watch('stageId');
  const selectedValue = watch('value');
  const selectedProbability = watch('probability');

  // Load auxiliary data on open
  useEffect(() => {
    if (isOpen) {
      pipelinesApi.getPipelines().then((res) => {
        if (res.success && res.data) setPipelines(res.data);
      });
      contactsApi.getContacts({ limit: 100 }).then((res) => {
        if (res.success && res.data) setContacts(res.data);
      });
      companiesApi.getCompanies({ limit: 100 }).then((res) => {
        if (res.success && res.data) setCompanies(res.data);
      });
      usersApi.getSalesReps().then((res) => {
        if (res.success && res.data) setSalesReps(res.data);
      });
    }
  }, [isOpen]);

  // Set form values on edit or create
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const closeDateStr = initialData.expectedClose
          ? new Date(initialData.expectedClose).toISOString().split('T')[0]
          : '';

        reset({
          title: initialData.title || '',
          value: initialData.value || 0,
          pipelineId: initialData.pipelineId?._id || initialData.pipelineId || '',
          stageId: initialData.stageId?._id || initialData.stageId || '',
          contactId: initialData.contactId?._id || initialData.contactId || '',
          companyId: initialData.companyId?._id || initialData.companyId || '',
          ownerId: initialData.ownerId?._id || initialData.ownerId || '',
          expectedClose: closeDateStr,
          probability: initialData.probability ?? 10,
          priority: initialData.priority || 'Medium',
          status: initialData.status || 'Open',
          source: initialData.source || 'Outbound',
          tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
          description: initialData.description || '',
        });
      } else {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        const defaultClose = nextMonth.toISOString().split('T')[0];

        const targetPipelineId = defaultPipelineId || (pipelines[0]?._id ? pipelines[0]._id : '');
        const targetPipeline = pipelines.find((p) => p._id === targetPipelineId) || pipelines[0];
        const targetStage = defaultStageId
          ? targetPipeline?.stages?.find((s) => s._id === defaultStageId)
          : targetPipeline?.stages?.[0];

        reset({
          title: '',
          value: 15000,
          pipelineId: targetPipeline?._id || '',
          stageId: targetStage?._id || '',
          contactId: '',
          companyId: '',
          ownerId: '',
          expectedClose: defaultClose,
          probability: targetStage?.probability ?? 10,
          priority: 'Medium',
          status: 'Open',
          source: 'Outbound',
          tags: '',
          description: '',
        });
      }
    }
  }, [isOpen, initialData, defaultPipelineId, defaultStageId, pipelines, reset]);

  // When pipeline changes, select its first stage if stage not valid
  const currentPipeline = pipelines.find((p) => p._id === selectedPipelineId) || pipelines[0];
  const stages = currentPipeline?.stages || [];

  const handleStageChange = (e) => {
    const stageId = e.target.value;
    setValue('stageId', stageId);
    const stage = stages.find((s) => s._id === stageId);
    if (stage && stage.probability !== undefined) {
      setValue('probability', stage.probability);
    }
  };

  const handleContactChange = (e) => {
    const contId = e.target.value;
    setValue('contactId', contId);
    const cont = contacts.find((c) => c._id === contId);
    if (cont?.companyId) {
      setValue('companyId', cont.companyId._id || cont.companyId);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const payload = {
        title: formData.title,
        value: Number(formData.value) || 0,
        pipelineId: formData.pipelineId || undefined,
        stageId: formData.stageId || undefined,
        contactId: formData.contactId || null,
        companyId: formData.companyId || null,
        ownerId: formData.ownerId || null,
        expectedClose: formData.expectedClose || undefined,
        probability: Number(formData.probability) ?? 10,
        priority: formData.priority,
        status: formData.status,
        source: formData.source || 'Outbound',
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        description: formData.description || '',
      };

      if (isEdit) {
        await dealsApi.updateDeal(initialData._id, payload);
        toast.success('Opportunity updated successfully');
      } else {
        await dealsApi.createDeal(payload);
        toast.success('New opportunity created');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save deal');
    }
  };

  const weightedForecast = Math.round((Number(selectedValue) || 0) * ((Number(selectedProbability) || 0) / 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Opportunity Profile' : 'Create New Commercial Opportunity'}
      subtitle={isEdit ? 'Update deal pipeline progression, win likelihood, and financials.' : 'Record an active sales opportunity in your revenue pipeline.'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title and Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Opportunity Title"
              required
              placeholder="e.g. Acme Corp Enterprise Expansion"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>
          <div>
            <Input
              label="Deal Value ($)"
              type="number"
              required
              placeholder="25000"
              {...register('value')}
              error={errors.value?.message}
            />
          </div>
        </div>

        {/* Pipeline & Stage Selection */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Pipeline
              </label>
              <select
                {...register('pipelineId')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                {pipelines.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                Pipeline Stage
              </label>
              <select
                value={selectedStageId}
                onChange={handleStageChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                {stages.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability & Forecast Badge */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">Win Probability:</label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('probability')}
                className="w-16 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-center font-bold text-indigo-600 dark:text-indigo-400"
              />
              <span className="text-slate-400">%</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[11px] block">Weighted Pipeline Contribution:</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                ${weightedForecast.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Association: Contact & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Associated Company Account
            </label>
            <select
              {...register('companyId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">No Corporate Account</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Primary Contact Stakeholder
            </label>
            <select
              value={watch('contactId')}
              onChange={handleContactChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">No Individual Contact</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.firstName} {c.lastName} {c.jobTitle ? `(${c.jobTitle})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Target Close Date"
            type="date"
            {...register('expectedClose')}
            error={errors.expectedClose?.message}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Deal Priority
            </label>
            <select
              {...register('priority')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority 🔥</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Deal Owner
            </label>
            <select
              {...register('ownerId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Unassigned</option>
              {salesReps.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.firstName} {r.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Lead Source" placeholder="e.g. Inbound Web, Referral" {...register('source')} />
          <Input label="Tags (comma-separated)" placeholder="tier-1, q4-renewal, enterprise" {...register('tags')} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Internal Deal Notes / Next Steps
          </label>
          <textarea
            rows={3}
            placeholder="Context, requirements, competitor presence, negotiation milestones..."
            {...register('description')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
