import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema } from '../../validations/leadSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { usersApi } from '../../api/usersApi.js';
import { leadsApi } from '../../api/leadsApi.js';
import toast from 'react-hot-toast';
import { Sparkles, AlertTriangle } from 'lucide-react';

export const LeadFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) => {
  const [salesReps, setSalesReps] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const isEdit = !!initialData?._id;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      company: '',
      jobTitle: '',
      source: 'Website',
      status: 'New',
      ownerId: '',
      tags: '',
      notes: '',
    },
  });

  // Watch fields for live score estimation
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedCompany = watch('company');
  const watchedSource = watch('source');
  const watchedTitle = watch('jobTitle');

  // Calculate live predicted score
  let estimatedScore = 0;
  if (watchedEmail?.includes('@')) estimatedScore += 10;
  if (watchedPhone?.length >= 7) estimatedScore += 10;
  if (watchedCompany?.trim()?.length > 1) estimatedScore += 10;
  if (watchedSource === 'Website') estimatedScore += 20;
  else if (watchedSource === 'Referral') estimatedScore += 25;
  const lowerTitle = (watchedTitle || '').toLowerCase();
  if (['director', 'vp', 'ceo', 'cfo', 'cto', 'founder', 'head'].some((k) => lowerTitle.includes(k))) {
    estimatedScore += 15;
  }
  estimatedScore = Math.min(100, estimatedScore);

  // Fetch sales reps for owner select
  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesReps().then((res) => {
        if (res.success) setSalesReps(res.data);
      });
    }
  }, [isOpen]);

  // Set or reset form fields on open
  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        company: initialData.company || '',
        jobTitle: initialData.jobTitle || '',
        source: initialData.source || 'Website',
        status: initialData.status || 'New',
        ownerId: initialData.ownerId?._id || initialData.ownerId || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        notes: initialData.notes || '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        company: '',
        jobTitle: '',
        source: 'Website',
        status: 'New',
        ownerId: '',
        tags: '',
        notes: '',
      });
    }
    setDuplicateWarning(null);
  }, [initialData, isOpen, reset]);

  // Check duplicate on blur
  const handleCheckDuplicate = async () => {
    if (!watchedEmail && !watchedPhone) return;
    try {
      const res = await leadsApi.checkDuplicate({
        email: watchedEmail,
        phone: watchedPhone,
        excludeId: initialData?._id,
      });
      if (res.data?.isDuplicate) {
        setDuplicateWarning(res.data.lead);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      // Ignore background check failure
    }
  };

  const onSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        ownerId: formData.ownerId ? formData.ownerId : null,
      };

      if (isEdit) {
        await leadsApi.updateLead(initialData._id, payload);
        toast.success('Lead updated successfully!');
      } else {
        await leadsApi.createLead(payload);
        toast.success('Lead created and scored successfully!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save lead');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead Profile' : 'Create New Lead'}
      subtitle={
        isEdit
          ? 'Modify contact attributes, status, and assignment.'
          : 'Enter prospect details. System will calculate score and apply assignment rules.'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Estimated Score Live Meter */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI Automated Lead Score Prediction:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-indigo-900 dark:text-indigo-100">
              {estimatedScore} / 100
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-200/70 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {estimatedScore >= 80 ? 'Very Hot' : estimatedScore >= 60 ? 'Hot' : estimatedScore >= 30 ? 'Warm' : 'Cold'}
            </span>
          </div>
        </div>

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Possible Duplicate Lead Detected!</p>
              <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                A lead with this email or phone exists: <strong>{duplicateWarning.firstName} {duplicateWarning.lastName}</strong> ({duplicateWarning.company || 'No Company'}).
              </p>
            </div>
          </div>
        )}

        {/* Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            placeholder="e.g. Alex"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            required
            placeholder="e.g. Mercer"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        {/* Contact Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="alex.mercer@company.com"
            {...register('email')}
            error={errors.email?.message}
            onBlur={handleCheckDuplicate}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register('phone')}
            error={errors.phone?.message}
            onBlur={handleCheckDuplicate}
          />
        </div>

        {/* Company & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            placeholder="e.g. Apex Global Tech"
            {...register('company')}
            error={errors.company?.message}
          />
          <Input
            label="Job Title"
            placeholder="e.g. VP of Engineering"
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
        </div>

        {/* Source & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Lead Source
            </label>
            <select
              {...register('source')}
              className="block w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 py-2.5 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Email">Email</option>
              <option value="Social Media">Social Media</option>
              <option value="Advertisement">Advertisement</option>
              <option value="Campaign">Campaign</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Lead Status
            </label>
            <select
              {...register('status')}
              className="block w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 py-2.5 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Owner Assignment Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Assign To Sales Representative
          </label>
          <select
            {...register('ownerId')}
            className="block w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 py-2.5 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">⚡ Automatic Round-Robin Assignment</option>
            {salesReps.map((rep) => (
              <option key={rep._id} value={rep._id}>
                {rep.firstName} {rep.lastName} ({rep.role})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            Leave blank to automatically balance workload across available sales reps.
          </p>
        </div>

        {/* Tags */}
        <Input
          label="Tags (Comma Separated)"
          placeholder="enterprise, high-priority, q4-budget"
          {...register('tags')}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Notes & Context
          </label>
          <textarea
            rows={3}
            placeholder="Enter initial discovery notes or meeting takeaways..."
            {...register('notes')}
            className="block w-full rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 py-2.5 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create & Score Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
