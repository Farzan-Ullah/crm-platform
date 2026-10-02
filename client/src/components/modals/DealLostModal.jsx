import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { AlertCircle } from 'lucide-react';

export const DealLostModal = ({ isOpen, onClose, onConfirm, dealTitle = 'this deal' }) => {
  const [selectedReason, setSelectedReason] = useState('Competitor Chosen');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Competitor Chosen',
    'Budget Constraints / Price Too High',
    'Feature Gap / Missing Capabilities',
    'Project Postponed / Timing',
    'No Decision / Kept Existing Solution',
    'Unresponsive / Contact Left Company',
    'Other Reason',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const finalReason = customNotes.trim()
        ? `${selectedReason}: ${customNotes.trim()}`
        : selectedReason;
      await onConfirm(finalReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Deal as Closed Lost"
      subtitle={`Please document why "${dealTitle}" was lost for pipeline analytics.`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>
            Closing a deal as Lost sets its probability to 0% and removes it from active revenue forecasts.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Primary Reason for Loss
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Additional Context & Debrief Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Lost to vendor X due to missing SOC2 certification; prospect may reconsider next year..."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            Confirm Closed Lost
          </Button>
        </div>
      </form>
    </Modal>
  );
};
