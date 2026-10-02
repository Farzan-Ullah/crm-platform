import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { contactsApi } from '../../api/contactsApi.js';
import toast from 'react-hot-toast';
import { GitMerge, ArrowRight, AlertCircle, Check } from 'lucide-react';

export const ContactMergeModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialPrimary = null,
  initialSecondary = null,
}) => {
  const [contacts, setContacts] = useState([]);
  const [primaryId, setPrimaryId] = useState('');
  const [secondaryId, setSecondaryId] = useState('');
  const [fieldChoices, setFieldChoices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      contactsApi.getContacts({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }).then((res) => {
        if (res.success) setContacts(res.data);
      });
      if (initialPrimary?._id) setPrimaryId(initialPrimary._id);
      if (initialSecondary?._id) setSecondaryId(initialSecondary._id);
    }
  }, [isOpen, initialPrimary, initialSecondary]);

  const primary = contacts.find((c) => c._id === primaryId) || (initialPrimary?._id === primaryId ? initialPrimary : null);
  const secondary = contacts.find((c) => c._id === secondaryId) || (initialSecondary?._id === secondaryId ? initialSecondary : null);

  // Initialize field choices whenever primary and secondary change
  useEffect(() => {
    if (primary && secondary) {
      setFieldChoices({
        firstName: primary.firstName ? 'primary' : 'secondary',
        lastName: primary.lastName ? 'primary' : 'secondary',
        email: primary.email ? 'primary' : 'secondary',
        phone: primary.phone ? 'primary' : 'secondary',
        jobTitle: primary.jobTitle ? 'primary' : 'secondary',
        companyId: primary.companyId ? 'primary' : 'secondary',
        ownerId: primary.ownerId ? 'primary' : 'secondary',
        street: primary.address?.street ? 'primary' : 'secondary',
        city: primary.address?.city ? 'primary' : 'secondary',
        state: primary.address?.state ? 'primary' : 'secondary',
        country: primary.address?.country ? 'primary' : 'secondary',
        notes: primary.notes ? 'primary' : 'secondary',
      });
    }
  }, [primary, secondary]);

  const handleFieldChoice = (field, source) => {
    setFieldChoices((prev) => ({ ...prev, [field]: source }));
  };

  const handleMergeSubmit = async () => {
    if (!primaryId || !secondaryId) {
      toast.error('Please select both a primary and a secondary contact.');
      return;
    }
    if (primaryId === secondaryId) {
      toast.error('Primary and secondary contact cannot be the same person.');
      return;
    }

    try {
      setIsSubmitting(true);

      const getVal = (field) => {
        const source = fieldChoices[field];
        const record = source === 'primary' ? primary : secondary;
        if (!record) return undefined;

        if (['street', 'city', 'state', 'country'].includes(field)) {
          return record.address?.[field] || '';
        }
        if (field === 'companyId') {
          return record.companyId?._id || record.companyId || null;
        }
        if (field === 'ownerId') {
          return record.ownerId?._id || record.ownerId || null;
        }
        return record[field] || '';
      };

      const mergedFields = {
        firstName: getVal('firstName'),
        lastName: getVal('lastName'),
        email: getVal('email'),
        phone: getVal('phone'),
        jobTitle: getVal('jobTitle'),
        companyId: getVal('companyId'),
        ownerId: getVal('ownerId'),
        address: {
          street: getVal('street'),
          city: getVal('city'),
          state: getVal('state'),
          country: getVal('country'),
          postalCode: (fieldChoices.street === 'primary' ? primary.address?.postalCode : secondary.address?.postalCode) || '',
        },
        notes: getVal('notes'),
      };

      const res = await contactsApi.mergeContacts({
        primaryContactId: primaryId,
        secondaryContactId: secondaryId,
        mergedFields,
      });

      if (res.success) {
        toast.success('Contacts successfully merged and deduplicated!');
        onSuccess?.(res.data);
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to merge contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { key: 'firstName', label: 'First Name', getVal: (c) => c?.firstName },
    { key: 'lastName', label: 'Last Name', getVal: (c) => c?.lastName },
    { key: 'email', label: 'Email Address', getVal: (c) => c?.email },
    { key: 'phone', label: 'Phone Number', getVal: (c) => c?.phone },
    { key: 'jobTitle', label: 'Job Title', getVal: (c) => c?.jobTitle },
    { key: 'companyId', label: 'Company', getVal: (c) => c?.companyId?.name || (c?.companyId ? 'Associated Org' : '—') },
    { key: 'street', label: 'Street', getVal: (c) => c?.address?.street },
    { key: 'city', label: 'City', getVal: (c) => c?.address?.city },
    { key: 'notes', label: 'Notes', getVal: (c) => c?.notes },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge & Deduplicate Contacts"
      subtitle="Combine duplicate records into a single consolidated contact with preserved deals and timeline."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Contact Selection Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Primary Record (Surviving Contact)
            </label>
            <select
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Select Primary Contact...</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id} disabled={c._id === secondaryId}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">This contact record will remain active and retain its ID.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Secondary Record (To Be Merged)
            </label>
            <select
              value={secondaryId}
              onChange={(e) => setSecondaryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Select Duplicate Contact...</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id} disabled={c._id === primaryId}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Will be soft-merged; linked deals will move to Primary.</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Interactive Field-by-Field Reconciliation</p>
            <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
              Select which value to preserve on the surviving primary contact. All historical deals belonging to the secondary contact will automatically be re-linked to the primary contact.
            </p>
          </div>
        </div>

        {/* Side-by-side Field Comparison Table */}
        {primary && secondary ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Field</th>
                  <th className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400 w-3/8">
                    Primary: {primary.firstName} {primary.lastName}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-3/8">
                    Secondary: {secondary.firstName} {secondary.lastName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fields.map(({ key, label, getVal }) => {
                  const valA = getVal(primary) || '—';
                  const valB = getVal(secondary) || '—';
                  const isChosenPrimary = fieldChoices[key] === 'primary';

                  return (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{label}</td>

                      {/* Option A (Primary) */}
                      <td
                        className={`py-2 px-3 cursor-pointer transition-colors ${
                          isChosenPrimary
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'text-slate-500'
                        }`}
                        onClick={() => handleFieldChoice(key, 'primary')}
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge_${key}`}
                            checked={isChosenPrimary}
                            onChange={() => handleFieldChoice(key, 'primary')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="truncate">{valA}</span>
                        </label>
                      </td>

                      {/* Option B (Secondary) */}
                      <td
                        className={`py-2 px-3 cursor-pointer transition-colors ${
                          !isChosenPrimary
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'text-slate-500'
                        }`}
                        onClick={() => handleFieldChoice(key, 'secondary')}
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge_${key}`}
                            checked={!isChosenPrimary}
                            onChange={() => handleFieldChoice(key, 'secondary')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="truncate">{valB}</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Select both a primary and secondary contact above to begin interactive field reconciliation.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={GitMerge}
            disabled={!primary || !secondary || primaryId === secondaryId}
            isLoading={isSubmitting}
            onClick={handleMergeSubmit}
          >
            Confirm & Execute Merge
          </Button>
        </div>
      </div>
    </Modal>
  );
};
