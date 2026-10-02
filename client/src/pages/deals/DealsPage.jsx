import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Search,
  TrendingUp,
  Filter,
  Flame,
  Calendar,
  Building2,
  User,
  Edit2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { dealsApi } from '../../api/dealsApi.js';
import { pipelinesApi } from '../../api/pipelinesApi.js';
import { usersApi } from '../../api/usersApi.js';
import { KanbanBoard } from '../../components/deals/KanbanBoard.jsx';
import { RevenueForecastWidget } from '../../components/deals/RevenueForecastWidget.jsx';
import { DealFormModal } from '../../components/forms/DealFormModal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

export const DealsPage = () => {
  const navigate = useNavigate();

  // View mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('kanban');
  const [showForecast, setShowForecast] = useState(true);

  // Data states
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [search, setSearch] = useState('');
  const [salesReps, setSalesReps] = useState([]);

  // Kanban state
  const [kanbanData, setKanbanData] = useState(null);
  const [isKanbanLoading, setIsKanbanLoading] = useState(true);

  // Table state
  const [tableDeals, setTableDeals] = useState([]);
  const [tablePagination, setTablePagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [targetStageIdForNewDeal, setTargetStageIdForNewDeal] = useState(null);

  // Initial load: Pipelines & Sales reps
  useEffect(() => {
    pipelinesApi.getPipelines().then((res) => {
      if (res.success && res.data?.length > 0) {
        setPipelines(res.data);
        const defaultPipe = res.data.find((p) => p.isDefault) || res.data[0];
        setSelectedPipelineId(defaultPipe._id);
      }
    });

    usersApi.getSalesReps().then((res) => {
      if (res.success) setSalesReps(res.data);
    });
  }, []);

  // Fetch Kanban data
  const fetchKanban = async () => {
    if (!selectedPipelineId) return;
    try {
      setIsKanbanLoading(true);
      const res = await dealsApi.getKanban({
        pipelineId: selectedPipelineId,
        ownerId: selectedOwnerId || undefined,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setKanbanData(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load pipeline board');
    } finally {
      setIsKanbanLoading(false);
    }
  };

  // Fetch Table data
  const fetchTable = async (page = 1) => {
    try {
      setIsTableLoading(true);
      const res = await dealsApi.getDeals({
        page,
        limit: tablePagination.limit,
        pipelineId: selectedPipelineId || undefined,
        ownerId: selectedOwnerId || undefined,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setTableDeals(res.data);
        if (res.pagination) {
          setTablePagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch deals list');
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPipelineId) {
      if (viewMode === 'kanban') {
        fetchKanban();
      } else {
        fetchTable(1);
      }
    }
  }, [selectedPipelineId, selectedOwnerId, search, viewMode]);

  // Optimistic stage transition handler for drag & drop
  const handleOptimisticStageChange = ({ dealId, sourceStageId, destStageId, sourceIndex, destIndex }) => {
    if (!kanbanData?.stages) return;

    setKanbanData((prev) => {
      if (!prev) return prev;
      const newStages = prev.stages.map((st) => ({
        ...st,
        deals: [...st.deals],
      }));

      const sourceStage = newStages.find((s) => s._id.toString() === sourceStageId.toString());
      const destStage = newStages.find((s) => s._id.toString() === destStageId.toString());

      if (!sourceStage || !destStage) return prev;

      const [movedDeal] = sourceStage.deals.splice(sourceIndex, 1);
      if (!movedDeal) return prev;

      movedDeal.stageId = destStage._id;
      movedDeal.probability = destStage.isWon ? 100 : destStage.isLost ? 0 : destStage.probability;
      movedDeal.status = destStage.isWon ? 'Won' : destStage.isLost ? 'Lost' : 'Open';

      destStage.deals.splice(destIndex, 0, movedDeal);

      // Recalculate column totals
      sourceStage.count = sourceStage.deals.length;
      sourceStage.totalValue = sourceStage.deals.reduce((sum, d) => sum + (d.value || 0), 0);

      destStage.count = destStage.deals.length;
      destStage.totalValue = destStage.deals.reduce((sum, d) => sum + (d.value || 0), 0);

      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  const handleOpenAddInStage = (stageId) => {
    setEditingDeal(null);
    setTargetStageIdForNewDeal(stageId);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (deal, e) => {
    e?.stopPropagation?.();
    setEditingDeal(deal);
    setTargetStageIdForNewDeal(null);
    setIsFormOpen(true);
  };

  const handleDeleteDeal = async (dealId, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await dealsApi.deleteDeal(dealId);
      toast.success('Opportunity deleted');
      if (viewMode === 'kanban') fetchKanban();
      else fetchTable(tablePagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete deal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Deals & Sales Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual revenue pipeline, stage velocity, and probability-weighted revenue forecast.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Forecast Toggle */}
          <Button
            variant={showForecast ? 'secondary' : 'outline'}
            icon={TrendingUp}
            onClick={() => setShowForecast(!showForecast)}
          >
            {showForecast ? 'Hide Forecast' : 'Show Forecast'}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingDeal(null);
              setTargetStageIdForNewDeal(null);
              setIsFormOpen(true);
            }}
          >
            New Deal
          </Button>
        </div>
      </div>

      {/* Revenue Forecast Widget */}
      {showForecast && (
        <RevenueForecastWidget
          pipelineId={selectedPipelineId}
          ownerId={selectedOwnerId}
        />
      )}

      {/* Filter and Pipeline Selector Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center flex-wrap gap-2.5 flex-1">
          {/* Pipeline Switcher */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
            >
              {pipelines.map((p) => (
                <option key={p._id} value={p._id}>
                  Pipeline: {p.name} {p.isDefault ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Rep Filter */}
          <select
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Account Owners</option>
            {salesReps.map((r) => (
              <option key={r._id} value={r._id}>
                Owner: {r.firstName} {r.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals by title or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main Content: Kanban or Table */}
      {viewMode === 'kanban' ? (
        isKanbanLoading || !kanbanData ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-72 sm:w-80 h-96 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : (
          <KanbanBoard
            stages={kanbanData.stages}
            onStageChange={handleOptimisticStageChange}
            onAddDealToStage={handleOpenAddInStage}
            onEditDeal={handleOpenEdit}
            onDeleteDeal={handleDeleteDeal}
            onRefresh={fetchKanban}
          />
        )
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {isTableLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : tableDeals.length === 0 ? (
            <EmptyState
              title="No opportunities found"
              description="No deals match your criteria. Create your first opportunity to begin tracking."
              actionLabel="Create Opportunity"
              onAction={() => {
                setEditingDeal(null);
                setIsFormOpen(true);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Value & Forecast</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Account / Contact</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Target Close</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tableDeals.map((deal) => {
                    const currentStage = deal.pipelineId?.stages?.find(
                      (s) => s._id?.toString() === deal.stageId?.toString()
                    );

                    return (
                      <tr
                        key={deal._id}
                        onClick={() => navigate(`/deals/${deal._id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Title & Priority */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {deal.priority === 'High' && <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {deal.title}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {deal.source || 'Outbound'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Value & Weighted Forecast */}
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                            ${(deal.value || 0).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            ${Math.round(deal.weightedValue || 0).toLocaleString()} ({deal.probability}%)
                          </p>
                        </td>

                        {/* Stage */}
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${currentStage?.color || '#6366f1'}15`,
                              color: currentStage?.color || '#6366f1',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: currentStage?.color || '#6366f1' }}
                            />
                            {currentStage?.name || deal.status}
                          </span>
                        </td>

                        {/* Company & Contact */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {deal.companyId && (
                            <p className="font-medium truncate max-w-[150px]">
                              {deal.companyId.name}
                            </p>
                          )}
                          {deal.contactId && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {deal.contactId.firstName} {deal.contactId.lastName}
                            </p>
                          )}
                          {!deal.companyId && !deal.contactId && (
                            <span className="text-slate-400 italic">No account linked</span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="py-3.5 px-4">
                          {deal.ownerId ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {deal.ownerId.firstName} {deal.ownerId.lastName}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>

                        {/* Close Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {deal.expectedClose
                            ? new Date(deal.expectedClose).toLocaleDateString()
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(deal, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDeal(deal._id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {tablePagination.totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {tableDeals.length} of {tablePagination.total} opportunities
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={tablePagination.page <= 1}
                  onClick={() => fetchTable(tablePagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Page {tablePagination.page} of {tablePagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={tablePagination.page >= tablePagination.totalPages}
                  onClick={() => fetchTable(tablePagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deal Form Modal */}
      <DealFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingDeal}
        defaultPipelineId={selectedPipelineId}
        defaultStageId={targetStageIdForNewDeal}
        onSuccess={() => {
          if (viewMode === 'kanban') fetchKanban();
          else fetchTable(tablePagination.page);
        }}
      />
    </div>
  );
};
