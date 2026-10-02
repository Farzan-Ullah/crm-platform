import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { QuoteRejectModal } from './QuoteRejectModal.jsx';
import { quotesApi } from '../../api/quotesApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  AlertTriangle,
  Building,
  User,
  DollarSign,
  Briefcase,
} from 'lucide-react';

export const QuoteDetailsModal = ({ isOpen, onClose, quote, onRefresh }) => {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pdf'
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!quote) return null;

  const isManagerOrAdmin = role === ROLES.ADMIN || role === ROLES.SALES_MANAGER;
  const isPendingApproval = quote.status === 'Pending Approval';
  const isApproved = quote.status === 'Approved';
  const isSent = quote.status === 'Sent';
  const isAccepted = quote.status === 'Accepted';
  const isRejected = quote.status === 'Rejected';

  const handleApprove = async () => {
    try {
      setIsActionLoading(true);
      await quotesApi.approveQuote(quote._id);
      toast.success('Quotation approved for client distribution! 🎉');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to approve quotation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await quotesApi.rejectQuote(quote._id, { reason });
      toast.success('Quotation rejected with manager feedback');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to reject quotation');
    }
  };

  const handleSend = async () => {
    const toEmail = quote.contactId?.email || '';
    const recipient = window.prompt('Enter recipient client email address:', toEmail);
    if (!recipient) return;

    try {
      setIsActionLoading(true);
      await quotesApi.sendQuote(quote._id, {
        to: recipient,
        subject: `Quotation ${quote.quoteNumber}: ${quote.title}`,
      });
      toast.success(`Quotation marked as sent to ${recipient} 🚀`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to send quotation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Mark this quotation as Officially Accepted by the client?')) return;
    try {
      setIsActionLoading(true);
      await quotesApi.acceptQuote(quote._id, { syncDeal: true });
      toast.success('Quotation marked Accepted! Deal value updated. 🏆');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to accept quotation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const reason = window.prompt('Enter client reason for declining quote:');
    if (reason === null) return;
    try {
      setIsActionLoading(true);
      await quotesApi.declineQuote(quote._id, { reason });
      toast.success('Quotation marked as Declined');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to decline quotation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (quote.status) {
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
        return <Badge variant="primary">Sent to Client</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${quote.quoteNumber} - ${quote.title}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <span className="text-xs text-slate-500">
                Issued:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </strong>
              </span>
              <span className="text-xs text-slate-500">
                Expires:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {new Date(quote.validUntil).toLocaleDateString()}
                </strong>
              </span>
            </div>

            {/* Workflow Control Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Manager Approval Buttons */}
              {isManagerOrAdmin && isPendingApproval && (
                <>
                  <Button
                    size="xs"
                    variant="primary"
                    icon={CheckCircle2}
                    isLoading={isActionLoading}
                    onClick={handleApprove}
                  >
                    Approve Quote
                  </Button>
                  <Button
                    size="xs"
                    variant="danger"
                    icon={XCircle}
                    onClick={() => setIsRejectOpen(true)}
                  >
                    Reject...
                  </Button>
                </>
              )}

              {/* Send Button */}
              {(isApproved || (!quote.approvalDetails?.requiresApproval && quote.status === 'Draft')) && (
                <Button
                  size="xs"
                  variant="outline"
                  icon={Send}
                  isLoading={isActionLoading}
                  onClick={handleSend}
                >
                  Send to Client
                </Button>
              )}

              {/* Accept / Decline for Sent / Approved */}
              {(isSent || isApproved) && (
                <>
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={CheckCircle2}
                    isLoading={isActionLoading}
                    onClick={handleAccept}
                  >
                    Mark Accepted
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    icon={XCircle}
                    isLoading={isActionLoading}
                    onClick={handleDecline}
                  >
                    Declined
                  </Button>
                </>
              )}

              {/* PDF Actions */}
              <a
                href={quotesApi.getPdfUrl(quote._id, false)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PDF
              </a>

              <a
                href={quotesApi.getPdfUrl(quote._id, true)}
                download={`${quote.quoteNumber}.pdf`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
          </div>

          {/* Workflow Status Banners */}
          {isPendingApproval && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pending Sales Manager Approval</p>
                <p className="text-[11px] mt-0.5">
                  {quote.approvalDetails?.approvalReason ||
                    'High discount pricing applied. Quotation must be authorized by a Sales Manager before releasing to customer.'}
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quotation Rejected by Management</p>
                <p className="text-[11px] mt-0.5">
                  <strong>Reason:</strong> {quote.approvalDetails?.rejectionReason || 'No reason specified'}
                </p>
                {quote.approvalDetails?.rejectedBy && (
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1">
                    Reviewed by {quote.approvalDetails.rejectedBy.firstName} {quote.approvalDetails.rejectedBy.lastName} on {new Date(quote.approvalDetails.rejectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {isApproved && quote.approvalDetails?.approvedBy && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p>
                Authorized by <strong>{quote.approvalDetails.approvedBy.firstName} {quote.approvalDetails.approvedBy.lastName}</strong> on {new Date(quote.approvalDetails.approvedAt).toLocaleDateString()}.
              </p>
            </div>
          )}

          {isAccepted && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p>
                Customer officially accepted quotation on {new Date(quote.acceptedAt).toLocaleDateString()}. Linked opportunity value synced.
              </p>
            </div>
          )}

          {/* Tab Navigation: Overview vs Live PDF Stream */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Summary & Line Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'pdf'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Live PDF Document Stream
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Account & Opportunity Context */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Client Contact</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {quote.contactId ? `${quote.contactId.firstName} ${quote.contactId.lastName}` : 'Direct Client'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{quote.contactId?.email || '—'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Account / Company</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {quote.companyId?.name || 'Individual Prospect'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{quote.companyId?.industry || 'Enterprise'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Associated Deal</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {quote.dealId?.title || 'Standalone Quote'}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                      {quote.dealId ? `$${quote.dealId.value?.toLocaleString()}` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item / Service</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-right">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quote.lineItems?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500">{item.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                          ${item.unitPrice?.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          {item.discountPercent > 0 ? (
                            <span className="font-semibold text-rose-600">
                              {item.discountPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {item.taxPercent > 0 ? `${item.taxPercent}%` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          ${item.itemTotal?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Terms Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Terms & Payment Conditions
                    </h5>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {quote.terms || 'Payment due within 30 days.'}
                    </p>
                  </div>

                  {quote.notes && (
                    <div>
                      <h5 className="font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Client Scope & Deliverable Notes
                      </h5>
                      <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {quote.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      ${quote.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span className={`font-semibold ${quote.totalDiscount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      -${quote.totalDiscount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Tax:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      +${quote.totalTax?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline text-sm font-bold text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-lg text-indigo-600 dark:text-indigo-400">
                      {quote.currency} ${quote.grandTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Live PDF Document Stream */
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
              <iframe
                title="Quotation PDF Stream"
                src={quotesApi.getPdfUrl(quote._id, false)}
                className="w-full h-[650px] border-0"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Reject Modal */}
      <QuoteRejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        quoteNumber={quote.quoteNumber}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
};
