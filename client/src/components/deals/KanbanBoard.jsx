import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Building2,
  User,
  Plus,
  Flame,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { DealLostModal } from '../modals/DealLostModal.jsx';
import { dealsApi } from '../../api/dealsApi.js';
import toast from 'react-hot-toast';

export const KanbanBoard = ({
  stages = [],
  onStageChange,
  onAddDealToStage,
  onEditDeal,
  onDeleteDeal,
  onRefresh,
}) => {
  const navigate = useNavigate();

  // Lost modal state if dropped into a Lost stage
  const [lostModalDeal, setLostModalDeal] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;
    const dealId = draggableId;

    const destStage = stages.find((s) => s._id.toString() === destStageId.toString());

    // If destination is a "Closed Lost" stage, prompt for lost reason
    if (destStage?.isLost) {
      // Find deal
      const sourceStage = stages.find((s) => s._id.toString() === sourceStageId.toString());
      const deal = sourceStage?.deals?.find((d) => d._id.toString() === dealId.toString());
      setLostModalDeal(deal || { _id: dealId, title: 'Opportunity' });
      setPendingMove({
        dealId,
        stageId: destStageId,
        order: destination.index,
      });
      return;
    }

    // Execute standard move
    try {
      // Notify parent for optimistic local update
      onStageChange?.({
        dealId,
        sourceStageId,
        destStageId,
        sourceIndex: source.index,
        destIndex: destination.index,
      });

      await dealsApi.updateDealStage(dealId, {
        stageId: destStageId,
        order: destination.index,
      });

      toast.success(
        destStage?.isWon
          ? '🎉 Deal closed WON!'
          : `Moved to ${destStage?.name || 'stage'}`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update deal stage');
      onRefresh?.();
    }
  };

  const handleConfirmLost = async (lostReason) => {
    if (!pendingMove) return;
    try {
      await dealsApi.updateDealStage(pendingMove.dealId, {
        stageId: pendingMove.stageId,
        order: pendingMove.order,
        lostReason,
      });
      toast.success('Deal marked Closed Lost');
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || 'Failed to update deal status');
    } finally {
      setPendingMove(null);
      setLostModalDeal(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-4 min-w-max">
          {stages.map((stage) => {
            const stageDeals = stage.deals || [];
            const columnColor = stage.color || '#6366f1';

            return (
              <div
                key={stage._id}
                className="w-72 sm:w-80 flex-shrink-0 flex flex-col rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm max-h-[calc(100vh-210px)]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 rounded-t-2xl backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: columnColor }}
                      />
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {stage.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {stage.probability}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {stageDeals.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddDealToStage?.(stage._id)}
                        title="Add deal to this stage"
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Value Metric */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Total Stage Value:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${(stage.totalValue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Droppable Card Column */}
                <Droppable droppableId={stage._id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[150px] transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                          : ''
                      }`}
                    >
                      {stageDeals.map((deal, index) => {
                        const isWon = deal.status === 'Won' || stage.isWon;
                        const isLost = deal.status === 'Lost' || stage.isLost;

                        return (
                          <Draggable
                            key={deal._id}
                            draggableId={deal._id.toString()}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => navigate(`/deals/${deal._id}`)}
                                className={`group p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                  dragSnapshot.isDragging
                                    ? 'rotate-2 scale-105 shadow-xl ring-2 ring-indigo-500/50 z-50'
                                    : ''
                                }`}
                              >
                                {/* Header: Priority & Actions */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {deal.priority === 'High' && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                        <Flame className="w-2.5 h-2.5" /> High
                                      </span>
                                    )}
                                    {isWon && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Won
                                      </span>
                                    )}
                                    {isLost && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                        <XCircle className="w-2.5 h-2.5" /> Lost
                                      </span>
                                    )}
                                    {!isWon && !isLost && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {deal.probability}% win
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => onEditDeal?.(deal)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                      title="Edit deal"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Title */}
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {deal.title}
                                </h4>

                                {/* Contact & Company */}
                                <div className="space-y-1 mb-2.5 text-[11px] text-slate-500">
                                  {deal.companyId && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                        {deal.companyId.name || 'Company Account'}
                                      </span>
                                    </div>
                                  )}
                                  {deal.contactId && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">
                                        {deal.contactId.firstName} {deal.contactId.lastName}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Card Footer: Value, Close Date & Owner */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
                                    ${(deal.value || 0).toLocaleString()}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {deal.expectedClose && (
                                      <span
                                        className="text-[10px] text-slate-400 flex items-center gap-1"
                                        title={`Target Close: ${new Date(deal.expectedClose).toLocaleDateString()}`}
                                      >
                                        <Calendar className="w-3 h-3" />
                                        {new Date(deal.expectedClose).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    )}

                                    {/* Owner Avatar */}
                                    <div
                                      className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold"
                                      title={deal.ownerId ? `${deal.ownerId.firstName} ${deal.ownerId.lastName}` : 'Unassigned'}
                                    >
                                      {deal.ownerId?.firstName?.[0] || 'U'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {stageDeals.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          No deals in stage
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Lost Reason Modal */}
      {lostModalDeal && (
        <DealLostModal
          isOpen={!!lostModalDeal}
          dealTitle={lostModalDeal.title}
          onClose={() => {
            setLostModalDeal(null);
            setPendingMove(null);
            onRefresh?.();
          }}
          onConfirm={handleConfirmLost}
        />
      )}
    </div>
  );
};
