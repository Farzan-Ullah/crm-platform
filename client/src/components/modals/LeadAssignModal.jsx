import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { usersApi } from '../../api/usersApi.js';
import { leadsApi } from '../../api/leadsApi.js';
import toast from 'react-hot-toast';
import { RefreshCw, UserCheck } from 'lucide-react';

export const LeadAssignModal = ({
  isOpen,
  onClose,
  leadIds = [],
  onSuccess,
}) => {
  const [salesReps, setSalesReps] = useState([]);
  const [selectedRep, setSelectedRep] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesReps().then((res) => {
        if (res.success) setSalesReps(res.data);
      });
      setSelectedRep('');
    }
  }, [isOpen]);

  const handleAssign = async (targetRepId) => {
    const repToAssign = targetRepId || selectedRep;
    if (!repToAssign) {
      toast.error('Please select a representative or click Round-Robin');
      return;
    }

    try {
      setIsLoading(true);
      if (leadIds.length === 1 && repToAssign !== 'round-robin') {
        await leadsApi.assignLead(leadIds[0], repToAssign);
      } else {
        await leadsApi.bulkAssign(leadIds, repToAssign);
      }

      toast.success(
        repToAssign === 'round-robin'
          ? `Round-robin assigned ${leadIds.length} lead(s) successfully`
          : `Assigned ${leadIds.length} lead(s) to representative`
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to assign leads');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Lead Ownership"
      subtitle={`Choose a sales representative for ${leadIds.length} selected lead(s).`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Automatic Round-Robin Card */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Automated Round-Robin
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
              Distributes equally based on representative workload.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            isLoading={isLoading}
            onClick={() => handleAssign('round-robin')}
          >
            Auto Assign
          </Button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or Manual Assignment
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Manual Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Select Sales Executive
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {salesReps.map((rep) => (
              <div
                key={rep._id}
                onClick={() => setSelectedRep(rep._id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRep === rep._id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    {rep.firstName[0]}
                    {rep.lastName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {rep.firstName} {rep.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{rep.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{rep.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedRep}
            isLoading={isLoading}
            onClick={() => handleAssign()}
          >
            Assign Selected
          </Button>
        </div>
      </div>
    </Modal>
  );
};
