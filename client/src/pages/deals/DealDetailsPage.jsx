import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Tag,
  Edit2,
  Trash2,
  Save,
  Layers,
  TrendingUp,
  Award,
  Mail,
  FileText,
  Plus,
} from 'lucide-react';
import { dealsApi } from '../../api/dealsApi.js';
import { quotesApi } from '../../api/quotesApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { DealFormModal } from '../../components/forms/DealFormModal.jsx';
import { DealLostModal } from '../../components/modals/DealLostModal.jsx';
import { SendEmailModal } from '../../components/forms/SendEmailModal.jsx';
import { QuoteFormModal } from '../../components/forms/QuoteFormModal.jsx';
import { QuoteDetailsModal } from '../../components/modals/QuoteDetailsModal.jsx';
import { ActivityTimeline } from '../../components/activities/ActivityTimeline.jsx';
import toast from 'react-hot-toast';

export const DealDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [dealQuotes, setDealQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const fetchDealDetails = async () => {
    try {
      setIsLoading(true);
      const [res, quotesRes] = await Promise.all([
        dealsApi.getDeal(id),
        quotesApi.getQuotes({ dealId: id }),
      ]);
      if (res.success) {
        setDeal(res.data);
        setNoteContent(res.data.description || '');
      }
      if (quotesRes?.data?.quotes) {
        setDealQuotes(quotesRes.data.quotes);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch opportunity profile');
      navigate('/deals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealDetails();
  }, [id]);

  const handleStageClick = async (targetStage) => {
    if (targetStage._id.toString() === deal.stageId?.toString()) return;

    if (targetStage.isLost) {
      setIsLostModalOpen(true);
      return;
    }

    try {
      await dealsApi.updateDealStage(deal._id, {
        stageId: targetStage._id,
      });
      toast.success(
        targetStage.isWon ? '🎉 Deal closed WON!' : `Moved to ${targetStage.name}`
      );
      fetchDealDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    }
  };

  const handleMarkWon = async () => {
    const pipeline = deal.pipelineId;
    const wonStage = pipeline?.stages?.find((s) => s.isWon);
    if (!wonStage) {
      toast.error('No Closed Won stage configured for this pipeline');
      return;
    }
    try {
      await dealsApi.updateDealStage(deal._id, {
        stageId: wonStage._id,
      });
      toast.success('🎉 Opportunity marked Closed Won!');
      fetchDealDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to mark won');
    }
  };

  const handleConfirmLost = async (lostReason) => {
    const pipeline = deal.pipelineId;
    const lostStage = pipeline?.stages?.find((s) => s.isLost);
    if (!lostStage) {
      toast.error('No Closed Lost stage configured');
      return;
    }
    try {
      await dealsApi.updateDealStage(deal._id, {
        stageId: lostStage._id,
        lostReason,
      });
      toast.success('Deal marked Closed Lost');
      fetchDealDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update deal');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNote(true);
      await dealsApi.updateDeal(id, { description: noteContent });
      toast.success('Notes saved successfully');
      fetchDealDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this opportunity?')) return;
    try {
      await dealsApi.deleteDeal(id);
      toast.success('Opportunity deleted');
      navigate('/deals');
    } catch (err) {
      toast.error(err.message || 'Failed to delete deal');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!deal) return null;

  const pipeline = deal.pipelineId;
  const stages = (pipeline?.stages || []).sort((a, b) => a.order - b.order);
  const currentStageIndex = stages.findIndex((s) => s._id.toString() === deal.stageId?.toString());
  const weightedVal = Math.round((deal.value || 0) * ((deal.probability || 0) / 100));

  const isWon = deal.status === 'Won';
  const isLost = deal.status === 'Lost';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/deals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals Pipeline
        </button>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shrink-0">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {deal.title}
              </h1>
              {isWon && (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Closed Won
                </Badge>
              )}
              {isLost && (
                <Badge variant="danger" size="md">
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Closed Lost
                </Badge>
              )}
              {!isWon && !isLost && (
                <Badge variant="primary" size="md">
                  {deal.currentStage?.name || 'In Progress'}
                </Badge>
              )}
              {deal.priority === 'High' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  <Flame className="w-3 h-3" /> High Priority
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pipeline: <span className="font-semibold text-slate-700 dark:text-slate-300">{pipeline?.name}</span>
              {deal.companyId && (
                <span>
                  {' '}• Account:{' '}
                  <Link
                    to={`/companies/${deal.companyId._id}`}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {deal.companyId.name}
                  </Link>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {!isWon && (
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleMarkWon}
            >
              Mark Won
            </Button>
          )}

          {!isLost && (
            <Button
              size="sm"
              variant="outline"
              icon={XCircle}
              onClick={() => setIsLostModalOpen(true)}
            >
              Mark Lost
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            icon={FileText}
            onClick={() => setIsQuoteFormOpen(true)}
          >
            New Quote
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={Mail}
            onClick={() => setIsEmailOpen(true)}
          >
            Send Email
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={Edit2}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Lost Reason Alert Banner if applicable */}
      {isLost && deal.lostReason && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Closed Lost Debrief</p>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5 font-medium">{deal.lostReason}</p>
          </div>
        </div>
      )}

      {/* Interactive Pipeline Progression Stepper */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pipeline Progression (Click any stage to advance deal)
        </p>

        <div className="flex items-center gap-2 min-w-max">
          {stages.map((stage, idx) => {
            const isCurrent = stage._id.toString() === deal.stageId?.toString();
            const isPast = idx < currentStageIndex && !isLost;

            return (
              <button
                key={stage._id}
                type="button"
                onClick={() => handleStageClick(stage)}
                className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/30'
                    : isPast
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isCurrent ? '#ffffff' : stage.color || '#6366f1',
                  }}
                />
                <span>{stage.name}</span>
                <span className={`text-[10px] font-normal opacity-80`}>
                  {stage.probability}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details + Timeline + Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Financials, Stage History, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Breakdown Card */}
          <Card title="Financial Valuation & Win Probability" subtitle="Deal financials and expected closing terms">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Deal Value</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  ${(deal.value || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Contract face value</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Win Probability</p>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {deal.probability}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Forecast weight</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Weighted Value</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  ${weightedVal.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Expected revenue</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Target Close Date:</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {deal.expectedClose
                    ? new Date(deal.expectedClose).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Unscheduled'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Lead Source Channel:</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {deal.source || 'Outbound'}
                </p>
              </div>
            </div>

            {/* Tags */}
            {deal.tags && deal.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {deal.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Stage Progression History Timeline */}
          <Card title="Stage Velocity & Audit History" subtitle="Milestones reached along the sales cycle">
            {deal.stageHistory && deal.stageHistory.length > 0 ? (
              <div className="space-y-4">
                {deal.stageHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Advanced to {item.stageName || 'Pipeline Stage'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.movedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No previous stage movements recorded.
              </div>
            )}
          </Card>

          {/* Notes Card */}
          <Card title="Deal Strategy & Notes" subtitle="Context, meeting summaries, and negotiation blockers">
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record strategic action items, budget notes, decision-makers involved..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                icon={Save}
                isLoading={isSavingNote}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </Card>

          {/* Associated Quotations Card */}
          <Card
            title={`Quotations & Proposals (${dealQuotes.length})`}
            subtitle="Commercial price proposals and branded PDF contracts linked to this opportunity"
            actions={
              <Button
                size="xs"
                variant="outline"
                icon={Plus}
                onClick={() => setIsQuoteFormOpen(true)}
              >
                Create Quote
              </Button>
            }
          >
            {dealQuotes.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p>No proposals generated for this deal yet.</p>
                <Button
                  size="xs"
                  variant="primary"
                  className="mt-2"
                  onClick={() => setIsQuoteFormOpen(true)}
                >
                  Generate First Quotation
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {dealQuotes.map((q) => (
                  <div
                    key={q._id}
                    onClick={() => setSelectedQuote(q)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/50 rounded-lg px-2 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {q.quoteNumber}
                        </span>
                        <Badge
                          variant={
                            q.status === 'Accepted' || q.status === 'Approved'
                              ? 'success'
                              : q.status === 'Pending Approval'
                              ? 'warning'
                              : q.status === 'Rejected'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {q.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {q.title}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {q.currency} ${q.grandTotal?.toLocaleString()}
                      </p>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                        View / PDF &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Activity & Timeline Feed */}
          <ActivityTimeline
            entityType="Deal"
            entityId={deal._id}
            entityName={deal.title}
          />
        </div>

        {/* Right Col: Associated Account & Contact & Owner */}
        <div className="space-y-6">
          {/* Associated Company Card */}
          <Card title="Company Account" subtitle="Client organization">
            {deal.companyId ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white">{deal.companyId.name}</p>
                  <p className="text-slate-500">{deal.companyId.domain || 'No domain'}</p>
                  {deal.companyId.industry && (
                    <Badge variant="neutral" size="sm" className="mt-2">
                      {deal.companyId.industry}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/companies/${deal.companyId._id}`)}
                >
                  View Company Profile
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p>No company attached.</p>
              </div>
            )}
          </Card>

          {/* Associated Contact Card */}
          <Card title="Primary Contact" subtitle="Key stakeholder">
            {deal.contactId ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {deal.contactId.firstName} {deal.contactId.lastName}
                  </p>
                  <p className="text-slate-500">{deal.contactId.jobTitle || 'Stakeholder'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{deal.contactId.email || deal.contactId.phone}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/contacts/${deal.contactId._id}`)}
                >
                  View Contact Profile
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <User className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p>No primary contact linked.</p>
              </div>
            )}
          </Card>

          {/* Account Owner Card */}
          <Card title="Opportunity Owner" subtitle="Assigned sales representative">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                {deal.ownerId?.firstName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {deal.ownerId ? `${deal.ownerId.firstName} ${deal.ownerId.lastName}` : 'Unassigned'}
                </p>
                <p className="text-slate-400">{deal.ownerId?.email || 'Assign a sales rep'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Deal Modal */}
      <DealFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={deal}
        onSuccess={fetchDealDetails}
      />

      {/* Deal Lost Modal */}
      <DealLostModal
        isOpen={isLostModalOpen}
        dealTitle={deal.title}
        onClose={() => setIsLostModalOpen(false)}
        onConfirm={handleConfirmLost}
      />

      {/* Send Direct Email Modal */}
      <SendEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        defaultTo={deal.contactId?.email || ''}
        defaultSubject={`Regarding Opportunity: ${deal.title}`}
        entityType="Deal"
        entityId={deal._id}
        entityData={{
          dealTitle: deal.title,
          dealValue: `$${deal.value?.toLocaleString()}`,
          firstName: deal.contactId?.firstName || '',
          lastName: deal.contactId?.lastName || '',
          company: deal.companyId?.name || '',
        }}
        onSuccess={fetchDealDetails}
      />

      {/* Quote Form Modal */}
      <QuoteFormModal
        isOpen={isQuoteFormOpen}
        defaultDealId={deal._id}
        defaultContactId={deal.contactId?._id || deal.contactId}
        defaultCompanyId={deal.companyId?._id || deal.companyId}
        onClose={() => setIsQuoteFormOpen(false)}
        onSuccess={fetchDealDetails}
      />

      {/* Quote Details & PDF Modal */}
      <QuoteDetailsModal
        isOpen={Boolean(selectedQuote)}
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onRefresh={fetchDealDetails}
      />
    </div>
  );
};
