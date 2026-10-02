import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema } from '../../validations/contactSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import { usersApi } from '../../api/usersApi.js';
import toast from 'react-hot-toast';
import { AlertTriangle, User, Building2 } from 'lucide-react';

export const ContactFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [salesReps, setSalesReps] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const isEdit = !!initialData?._id;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      jobTitle: '',
      companyId: '',
      ownerId: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      tags: '',
      description: '',
    },
  });

  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');

  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesReps().then((res) => {
        if (res.success) setSalesReps(res.data);
      });
      companiesApi.getCompanies({ limit: 100, sortBy: 'name', sortOrder: 'asc' }).then((res) => {
        if (res.success) setCompanies(res.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        jobTitle: initialData.jobTitle || '',
        companyId: initialData.companyId?._id || initialData.companyId || '',
        ownerId: initialData.ownerId?._id || initialData.ownerId || '',
        street: initialData.address?.street || '',
        city: initialData.address?.city || '',
        state: initialData.address?.state || '',
        country: initialData.address?.country || '',
        postalCode: initialData.address?.postalCode || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        description: initialData.description || initialData.notes || '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        jobTitle: '',
        companyId: '',
        ownerId: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        tags: '',
        description: '',
      });
    }
    setDuplicateWarning(null);
  }, [initialData, isOpen, reset]);

  const handleCheckDuplicate = async () => {
    if (!watchedEmail && !watchedPhone) return;
    try {
      const res = await contactsApi.checkDuplicates({
        email: watchedEmail,
        phone: watchedPhone,
        excludeId: initialData?._id,
      });
      if (res.data?.hasDuplicates && res.data.duplicates.contacts.length > 0) {
        setDuplicateWarning(res.data.duplicates.contacts[0]);
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email ? formData.email.toLowerCase().trim() : '',
        phone: formData.phone || '',
        alternatePhone: formData.alternatePhone || '',
        jobTitle: formData.jobTitle || '',
        companyId: formData.companyId || null,
        ownerId: formData.ownerId || null,
        address: {
          street: formData.street || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || '',
          postalCode: formData.postalCode || '',
        },
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        notes: formData.description || '',
      };

      if (isEdit) {
        await contactsApi.updateContact(initialData._id, payload);
        toast.success('Contact updated successfully');
      } else {
        await contactsApi.createContact(payload);
        toast.success('Contact created successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save contact');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Contact Profile' : 'Create Individual Contact'}
      subtitle={isEdit ? 'Update personal details, company affiliation, and account owner.' : 'Add a verified person of interest to your CRM directory.'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Possible Duplicate Contact Found!</p>
              <p className="text-[11px] mt-0.5">
                A contact with this email or phone already exists: <strong>{duplicateWarning.firstName} {duplicateWarning.lastName}</strong> ({duplicateWarning.email || duplicateWarning.phone}).
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            placeholder="e.g. John"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            required
            placeholder="e.g. Doe"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@company.com"
            {...register('email')}
            error={errors.email?.message}
            onBlur={handleCheckDuplicate}
          />
          <Input
            label="Primary Phone"
            placeholder="+1 (555) 019-2834"
            {...register('phone')}
            error={errors.phone?.message}
            onBlur={handleCheckDuplicate}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title / Role"
            placeholder="e.g. Chief Technology Officer"
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
          <Input
            label="Alternate Phone"
            placeholder="+1 (555) 099-1234"
            {...register('alternatePhone')}
            error={errors.alternatePhone?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Associated Company
            </label>
            <select
              {...register('companyId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">No Company Affiliation</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.domain ? `(${c.domain})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Contact Owner (Sales Rep)
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
        </div>

        {/* Address */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Address / Location
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Street Address" placeholder="123 Corporate Blvd" {...register('street')} />
            <Input label="City" placeholder="Austin" {...register('city')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="State / Province" placeholder="TX" {...register('state')} />
            <Input label="Postal Code" placeholder="78701" {...register('postalCode')} />
            <Input label="Country" placeholder="USA" {...register('country')} />
          </div>
        </div>

        <Input label="Tags (comma-separated)" placeholder="vip, decision-maker, engineering" {...register('tags')} />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Internal Notes
          </label>
          <textarea
            rows={3}
            placeholder="Important background notes, preferred communication channel, etc."
            {...register('description')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
