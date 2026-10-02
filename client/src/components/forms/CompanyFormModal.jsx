import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema } from '../../validations/companySchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { companiesApi } from '../../api/companiesApi.js';
import { usersApi } from '../../api/usersApi.js';
import toast from 'react-hot-toast';
import { AlertTriangle, Building2 } from 'lucide-react';

export const CompanyFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
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
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      domain: '',
      industry: 'Technology',
      size: '11-50',
      website: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      ownerId: '',
      tags: '',
      notes: '',
    },
  });

  const watchedDomain = watch('domain');
  const watchedName = watch('name');

  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesReps().then((res) => {
        if (res.success) setSalesReps(res.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        domain: initialData.domain || '',
        industry: initialData.industry || 'Technology',
        size: initialData.size || '11-50',
        website: initialData.website || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        street: initialData.address?.street || '',
        city: initialData.address?.city || '',
        state: initialData.address?.state || '',
        country: initialData.address?.country || '',
        postalCode: initialData.address?.postalCode || '',
        ownerId: initialData.ownerId?._id || initialData.ownerId || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        notes: initialData.notes || '',
      });
    } else {
      reset({
        name: '',
        domain: '',
        industry: 'Technology',
        size: '11-50',
        website: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        ownerId: '',
        tags: '',
        notes: '',
      });
    }
    setDuplicateWarning(null);
  }, [initialData, isOpen, reset]);

  const handleCheckDuplicate = async () => {
    if (!watchedDomain && !watchedName) return;
    try {
      const res = await companiesApi.checkDuplicates({
        domain: watchedDomain,
        name: watchedName,
        excludeId: initialData?._id,
      });
      if (res.data?.hasDuplicates && res.data.duplicates.companies.length > 0) {
        setDuplicateWarning(res.data.duplicates.companies[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      // Ignore
    }
  };

  const onSubmit = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        domain: formData.domain,
        industry: formData.industry,
        size: formData.size,
        website: formData.website,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || '',
          postalCode: formData.postalCode || '',
        },
        ownerId: formData.ownerId || null,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        notes: formData.notes || '',
      };

      if (isEdit) {
        await companiesApi.updateCompany(initialData._id, payload);
        toast.success('Company updated successfully');
      } else {
        await companiesApi.createCompany(payload);
        toast.success('Company created successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save company');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Company Profile' : 'Create Organization Account'}
      subtitle={isEdit ? 'Modify corporate profile, addresses, and account ownership.' : 'Register a new enterprise client account in your CRM directory.'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Possible Duplicate Company Found!</p>
              <p className="text-[11px] mt-0.5">
                A company with this domain or name exists: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.domain || 'No domain'}).
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            required
            placeholder="e.g. Acme Corp"
            {...register('name')}
            error={errors.name?.message}
            onBlur={handleCheckDuplicate}
          />
          <Input
            label="Corporate Domain"
            placeholder="e.g. acme.com"
            {...register('domain')}
            error={errors.domain?.message}
            onBlur={handleCheckDuplicate}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Industry Sector
            </label>
            <select
              {...register('industry')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="Technology">Technology</option>
              <option value="Financial Technology">Financial Technology</option>
              <option value="Healthcare & Biotech">Healthcare & Biotech</option>
              <option value="Defense & Aerospace">Defense & Aerospace</option>
              <option value="Retail & Distribution">Retail & Distribution</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Organization Size
            </label>
            <select
              {...register('size')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ enterprise</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Website" placeholder="https://..." {...register('website')} />
          <Input label="Main Phone" placeholder="+1 (555)..." {...register('phone')} />
          <Input label="Corporate Email" type="email" placeholder="contact@..." {...register('email')} />
        </div>

        {/* Address */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Headquarters Location
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Street Address" placeholder="100 Innovation Way" {...register('street')} />
            <Input label="City" placeholder="San Francisco" {...register('city')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="State / Province" placeholder="CA" {...register('state')} />
            <Input label="Postal Code" placeholder="94105" {...register('postalCode')} />
            <Input label="Country" placeholder="USA" {...register('country')} />
          </div>
        </div>

        {/* Owner */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Account Executive (Owner)
          </label>
          <select
            {...register('ownerId')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="">Unassigned</option>
            {salesReps.map((r) => (
              <option key={r._id} value={r._id}>
                {r.firstName} {r.lastName} ({r.role})
              </option>
            ))}
          </select>
        </div>

        <Input label="Tags" placeholder="tier-1, strategic, enterprise" {...register('tags')} />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
