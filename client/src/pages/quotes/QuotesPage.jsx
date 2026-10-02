import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { QuoteFormModal } from '../../components/forms/QuoteFormModal.jsx';
import { QuoteDetailsModal } from '../../components/modals/QuoteDetailsModal.jsx';
import { quotesApi } from '../../api/quotesApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import toast from 'react-hot-toast';

export const QuotesPage = () => {
  const { role, user } = useAuth();
  const isManagerOrAdmin = role === ROLES.ADMIN || role === ROLES.SALES_MANAGER;

  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const [quotesRes, statsRes] = await Promise.all([
        quotesApi.getQuotes({
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          status: selectedStatus || undefined,
        }),
        quotesApi.getQuoteStats(),
      ]);

      if (quotesRes?.data) {
        setQuotes(quotesRes.data.quotes || []);
        setTotalQuotes(quotesRes.data.total || 0);
        setTotalPages(quotesRes.data.totalPages || 1);
      }

      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load quotes:', err);
      toast.error('Failed to fetch quotation records');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleQuickApprove = async (quoteId, e) => {
    e.stopPropagation();
    try {
      await quotesApi.approveQuote(quoteId);
      toast.success('Quotation approved for client release! ✅');
      fetchQuotes();
    } catch (err) {
      toast.error(err.message || 'Failed to approve quotation');
    }
  };

  const handleDelete = async (quoteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this quotation?')) return;
    try {
      await quotesApi.deleteQuote(quoteId);
      toast.success('Quotation deleted successfully');
      fetchQuotes();
    } catch (err) {
      toast.error(err.message || 'Failed to delete quote');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success">Approved</Badge>;
      case 'Accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'Pending Approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'Declined':
        return <Badge variant="danger">Declined</Badge>;
      case 'Sent':
        return <Badge variant="primary">Sent</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            Quotations & Proposals
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Generate branded PDF quotations, enforce manager discount approvals, and track commercial lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingQuote(null);
              setIsFormOpen(true);
            }}
          >
            New Quotation
          </Button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Quoted Value
            </p>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${stats ? stats.totalQuotedAmount?.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {stats?.totalQuotes || 0} quotes
            </span>
          </div>
        </Card>

        <Card className="hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Approval
            </p>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.pendingApprovalCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ${stats ? stats.pendingApprovalAmount?.toLocaleString() : '0'}
            </span>
          </div>
        </Card>

        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Approved for Release
            </p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.approvedCount || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ${stats ? stats.approvedAmount?.toLocaleString() : '0'}
            </span>
          </div>
        </Card>

        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accepted Proposals
            </p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${stats ? stats.acceptedAmount?.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {stats?.acceptedCount || 0} accepted
            </span>
          </div>
        </Card>
      </div>

      {/* Filters & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: '', label: 'All Quotes' },
            { id: 'Pending Approval', label: 'Pending Approval' },
            { id: 'Approved', label: 'Approved' },
            { id: 'Sent', label: 'Sent' },
            { id: 'Accepted', label: 'Accepted' },
            { id: 'Rejected', label: 'Rejected' },
            { id: 'Draft', label: 'Drafts' },
          ].map((statusTab) => (
            <button
              key={statusTab.id}
              type="button"
              onClick={() => {
                setSelectedStatus(statusTab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === statusTab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {statusTab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quote number or title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Quotations Data Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No quotations found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedStatus
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first commercial proposal with branded PDF streaming.'}
            </p>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingQuote(null);
                setIsFormOpen(true);
              }}
            >
              Create Quotation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Quote Number</th>
                  <th className="py-3 px-4">Title & Project</th>
                  <th className="py-3 px-4">Client / Opportunity</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotes.map((quote) => (
                  <tr
                    key={quote._id}
                    onClick={() => {
                      setSelectedQuote(quote);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {quote.quoteNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                        {quote.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {quote.lineItems?.length || 0} items
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      {quote.contactId ? (
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {quote.contactId.firstName} {quote.contactId.lastName}
                        </p>
                      ) : quote.companyId ? (
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {quote.companyId.name}
                        </p>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {quote.dealId && (
                        <p className="text-[11px] text-indigo-500 font-medium truncate">
                          {quote.dealId.title}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {quote.currency} ${quote.grandTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(quote.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Approve for manager */}
                        {isManagerOrAdmin && quote.status === 'Pending Approval' && (
                          <button
                            type="button"
                            title="Approve Quotation"
                            onClick={(e) => handleQuickApprove(quote._id, e)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* View & PDF */}
                        <button
                          type="button"
                          title="View Details & PDF Stream"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit (if not accepted) */}
                        {quote.status !== 'Accepted' && (
                          <button
                            type="button"
                            title="Edit Quotation"
                            onClick={() => {
                              setEditingQuote(quote);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete (if manager/admin) */}
                        {isManagerOrAdmin && (
                          <button
                            type="button"
                            title="Delete Quotation"
                            onClick={(e) => handleDelete(quote._id, e)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalQuotes} total quotes)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                icon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Quote Form Modal (Create / Edit) */}
      <QuoteFormModal
        isOpen={isFormOpen}
        initialData={editingQuote}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuote(null);
        }}
        onSuccess={fetchQuotes}
      />

      {/* Quote Details & PDF Preview Modal */}
      <QuoteDetailsModal
        isOpen={isDetailsOpen}
        quote={selectedQuote}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedQuote(null);
        }}
        onRefresh={() => {
          fetchQuotes();
          if (selectedQuote) {
            quotesApi.getQuote(selectedQuote._id).then((res) => {
              if (res.data) setSelectedQuote(res.data);
            });
          }
        }}
      />
    </div>
  );
};
