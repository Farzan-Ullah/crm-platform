import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Globe,
  Trash2,
  UserCheck,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  ExternalLink,
  Flame,
  Upload,
  Download,
} from 'lucide-react';
import { leadsApi } from '../../api/leadsApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { LeadFormModal } from '../../components/forms/LeadFormModal.jsx';
import { LeadAssignModal } from '../../components/modals/LeadAssignModal.jsx';
import { WebToLeadModal } from '../../components/modals/WebToLeadModal.jsx';
import { BulkImportModal } from '../../components/modals/BulkImportModal.jsx';
import { importExportApi } from '../../api/importExportApi.js';
import toast from 'react-hot-toast';

export const LeadsListPage = () => {
  const navigate = useNavigate();

  // Data states
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [scoreRange, setScoreRange] = useState('all');
  const [page, setPage] = useState(1);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningIds, setAssigningIds] = useState([]);
  const [isWebToLeadOpen, setIsWebToLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await leadsApi.getLeads({
        page,
        limit: 15,
        search,
        status,
        source,
        scoreRange,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (res.success) {
        setLeads(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, source, scoreRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus) => {
    try {
      await leadsApi.bulkUpdateStatus(selectedIds, newStatus);
      toast.success(`Updated status for ${selectedIds.length} leads`);
      setSelectedIds([]);
      fetchLeads();
    } catch (err) {
      toast.error(err.message || 'Failed to update leads');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} lead(s)?`)) return;
    try {
      await leadsApi.bulkDelete(selectedIds);
      toast.success(`Deleted ${selectedIds.length} lead(s)`);
      setSelectedIds([]);
      fetchLeads();
    } catch (err) {
      toast.error(err.message || 'Failed to delete leads');
    }
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.deleteLead(id);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead');
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
          {score} · Very Hot
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Flame className="w-3 h-3 text-amber-500" />
          {score} · Hot
        </span>
      );
    }
    if (score >= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {score} · Warm
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {score} · Cold
      </span>
    );
  };

  const getStatusBadge = (st) => {
    const map = {
      New: 'primary',
      Contacted: 'purple',
      Qualified: 'success',
      Unqualified: 'warning',
      Lost: 'danger',
    };
    return <Badge variant={map[st] || 'neutral'} size="sm">{st}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lead Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Capture, score, and qualify prospective opportunities across all channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => setIsImportOpen(true)}
          >
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={async () => {
              try {
                await importExportApi.exportData('leads', 'csv');
                toast.success('Leads exported to CSV');
              } catch (err) {
                toast.error('Failed to export leads');
              }
            }}
          >
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Globe}
            onClick={() => setIsWebToLeadOpen(true)}
          >
            Web-to-Lead
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => {
              setEditingLead(null);
              setIsFormOpen(true);
            }}
          >
            Create Lead
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        source={source}
        onSourceChange={(val) => {
          setSource(val);
          setPage(1);
        }}
        scoreRange={scoreRange}
        onScoreRangeChange={(val) => {
          setScoreRange(val);
          setPage(1);
        }}
        onReset={() => {
          setSearch('');
          setStatus('all');
          setSource('all');
          setScoreRange('all');
          setPage(1);
        }}
      />

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 text-xs">
          <span className="font-semibold">
            {selectedIds.length} lead(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value);
              }}
              defaultValue=""
              className="rounded-lg bg-indigo-700 border border-indigo-500 px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="" disabled>Set Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Lost">Lost</option>
            </select>

            <Button
              size="xs"
              variant="secondary"
              icon={UserCheck}
              onClick={() => {
                setAssigningIds(selectedIds);
                setIsAssignOpen(true);
              }}
            >
              Assign
            </Button>

            <Button
              size="xs"
              variant="danger"
              icon={Trash2}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <Card noPadding className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" count={6} />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="No prospects match your current search or filter criteria. Create a new lead or ingest via Web-to-Lead."
            actionLabel="Create First Lead"
            onAction={() => {
              setEditingLead(null);
              setIsFormOpen(true);
            }}
            actionIcon={UserPlus}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-3">Lead Contact</th>
                  <th className="py-3 px-3">Company & Title</th>
                  <th className="py-3 px-3">Score & Quality</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Assigned Owner</th>
                  <th className="py-3 px-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors group"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead._id)}
                        onChange={() => handleSelectOne(lead._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                      >
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {lead.email || lead.phone || 'No direct contact'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {lead.company || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lead.jobTitle || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {getScoreBadge(lead.score || 0)}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {lead.ownerId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                            {lead.ownerId.firstName?.[0]}
                            {lead.ownerId.lastName?.[0]}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                            {lead.ownerId.firstName} {lead.ownerId.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => navigate(`/leads/${lead._id}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLead(lead);
                            setIsFormOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningIds([lead._id]);
                            setIsAssignOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Assign Lead"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOne(lead._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Card>

      {/* Modals */}
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingLead}
        onSuccess={fetchLeads}
      />

      <LeadAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        leadIds={assigningIds}
        onSuccess={fetchLeads}
      />

      <WebToLeadModal
        isOpen={isWebToLeadOpen}
        onClose={() => setIsWebToLeadOpen(false)}
        onSuccess={fetchLeads}
      />

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultEntity="Lead"
        onSuccess={fetchLeads}
      />
    </div>
  );
};
