import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuoteRejectModal = ({ isOpen, onClose, onConfirm, quoteNumber = 'this quotation' }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Discount exceeds allowable margin threshold',
    'Payment terms do not meet finance policy',
    'Custom SLA requires executive signoff',
    'Line items or deliverables need revision',
    'Customer credit check requires review',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify why this quotation is being rejected');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to reject quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Quotation"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>
            Rejecting <strong>{quoteNumber}</strong> will return it to the sales representative with your feedback for revision.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Quick Reason Select:
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {predefinedReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Detailed Reason / Guidance for Sales Rep <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Maximum discount allowed for standard cloud hosting is 15%. Please adjust line item 1 to 15%."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" isLoading={isSubmitting} icon={XCircle}>
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
