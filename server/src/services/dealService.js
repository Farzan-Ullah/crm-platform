import mongoose from 'mongoose';
import { Deal } from '../models/Deal.js';
import { Pipeline } from '../models/Pipeline.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';
import { getPipelinesList } from './pipelineService.js';
import { createNotification } from './notificationService.js';

export const getDealsList = async ({
  tenantId,
  page = 1,
  limit = 20,
  search = '',
  pipelineId = '',
  stageId = '',
  status = '',
  priority = '',
  ownerId = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const query = { tenantId };

  if (pipelineId) query.pipelineId = pipelineId;
  if (stageId) query.stageId = stageId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (ownerId) query.ownerId = ownerId;

  if (search) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      { source: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [deals, total] = await Promise.all([
    Deal.find(query)
      .populate('contactId', 'firstName lastName email phone')
      .populate('companyId', 'name domain industry')
      .populate('ownerId', 'firstName lastName email avatar')
      .populate('pipelineId', 'name stages')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit)),
    Deal.countDocuments(query),
  ]);

  return {
    deals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getDealsKanban = async ({
  tenantId,
  pipelineId = '',
  ownerId = '',
  search = '',
}) => {
  // 1. Resolve target pipeline
  let pipeline;
  if (pipelineId) {
    pipeline = await Pipeline.findOne({ _id: pipelineId, tenantId });
  }
  if (!pipeline) {
    pipeline = await Pipeline.findOne({ tenantId, isDefault: true });
    if (!pipeline) {
      const list = await getPipelinesList(tenantId);
      pipeline = list[0];
    }
  }

  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }

  // 2. Fetch all deals for this pipeline
  const dealQuery = {
    tenantId,
    pipelineId: pipeline._id,
  };

  if (ownerId) {
    dealQuery.ownerId = ownerId;
  }

  if (search) {
    dealQuery.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
    ];
  }

  const deals = await Deal.find(dealQuery)
    .populate('contactId', 'firstName lastName email phone')
    .populate('companyId', 'name domain industry')
    .populate('ownerId', 'firstName lastName email avatar')
    .sort({ order: 1, createdAt: -1 });

  // 3. Group deals by stages in pipeline
  const stageMap = {};
  const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  sortedStages.forEach((stage) => {
    stageMap[stage._id.toString()] = {
      _id: stage._id,
      name: stage.name,
      order: stage.order,
      probability: stage.probability,
      color: stage.color || '#6366f1',
      isWon: stage.isWon || false,
      isLost: stage.isLost || false,
      deals: [],
      count: 0,
      totalValue: 0,
      weightedValue: 0,
    };
  });

  let totalPipelineValue = 0;
  let weightedForecastValue = 0;

  deals.forEach((deal) => {
    const sId = deal.stageId?.toString();
    if (stageMap[sId]) {
      stageMap[sId].deals.push(deal);
      stageMap[sId].count += 1;
      stageMap[sId].totalValue += deal.value || 0;
      stageMap[sId].weightedValue += deal.weightedValue || 0;

      if (!stageMap[sId].isLost) {
        totalPipelineValue += deal.value || 0;
        weightedForecastValue += deal.weightedValue || 0;
      }
    }
  });

  const columns = sortedStages.map((s) => stageMap[s._id.toString()]);

  return {
    pipeline: {
      _id: pipeline._id,
      name: pipeline.name,
      isDefault: pipeline.isDefault,
    },
    stages: columns,
    totalDeals: deals.length,
    totalPipelineValue,
    weightedForecastValue,
  };
};

export const getDealForecast = async ({
  tenantId,
  pipelineId = '',
  ownerId = '',
  startDate = null,
  endDate = null,
}) => {
  const match = { tenantId: new mongoose.Types.ObjectId(tenantId) };

  if (pipelineId) {
    match.pipelineId = new mongoose.Types.ObjectId(pipelineId);
  }
  if (ownerId) {
    match.ownerId = new mongoose.Types.ObjectId(ownerId);
  }
  if (startDate || endDate) {
    match.expectedClose = {};
    if (startDate) match.expectedClose.$gte = new Date(startDate);
    if (endDate) match.expectedClose.$lte = new Date(endDate);
  }

  // 1. Overall Metrics
  const metricsAggregation = await Deal.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        openCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] },
        },
        wonCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] },
        },
        lostCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] },
        },
        totalOpenValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Open'] }, '$value', 0],
          },
        },
        weightedForecastValue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Open'] },
              { $multiply: ['$value', { $divide: ['$probability', 100] }] },
              0,
            ],
          },
        },
        totalWonValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Won'] }, '$value', 0],
          },
        },
        totalLostValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Lost'] }, '$value', 0],
          },
        },
      },
    },
  ]);

  const summary = metricsAggregation[0] || {
    totalCount: 0,
    openCount: 0,
    wonCount: 0,
    lostCount: 0,
    totalOpenValue: 0,
    weightedForecastValue: 0,
    totalWonValue: 0,
    totalLostValue: 0,
  };

  const closedTotal = summary.wonCount + summary.lostCount;
  const winRate = closedTotal > 0 ? Math.round((summary.wonCount / closedTotal) * 100) : 0;
  const avgDealSize = summary.openCount > 0 ? Math.round(summary.totalOpenValue / summary.openCount) : 0;

  // 2. Stage Breakdown
  const stageAggregation = await Deal.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stageId',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        weightedValue: {
          $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] },
        },
      },
    },
  ]);

  // Lookup stages details from Pipeline
  const pipeline = pipelineId
    ? await Pipeline.findOne({ _id: pipelineId, tenantId })
    : await Pipeline.findOne({ tenantId, isDefault: true });

  const stageBreakdown = (pipeline?.stages || []).map((stage) => {
    const found = stageAggregation.find((s) => s._id?.toString() === stage._id.toString());
    return {
      stageId: stage._id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      probability: stage.probability,
      isWon: stage.isWon,
      isLost: stage.isLost,
      count: found?.count || 0,
      totalValue: found?.totalValue || 0,
      weightedValue: Math.round(found?.weightedValue || 0),
    };
  });

  // 3. Monthly Close Projections
  const monthlyAggregation = await Deal.aggregate([
    {
      $match: {
        ...match,
        expectedClose: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$expectedClose' } },
        totalValue: { $sum: '$value' },
        weightedValue: {
          $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyBreakdown = monthlyAggregation.map((m) => ({
    month: m._id,
    totalValue: m.totalValue,
    weightedValue: Math.round(m.weightedValue),
    count: m.count,
  }));

  return {
    metrics: {
      ...summary,
      winRate,
      avgDealSize,
    },
    stageBreakdown,
    monthlyBreakdown,
  };
};

export const getDealDetails = async (dealId, tenantId) => {
  const deal = await Deal.findOne({ _id: dealId, tenantId })
    .populate('contactId')
    .populate('companyId')
    .populate('ownerId', 'firstName lastName email avatar')
    .populate('pipelineId');

  if (!deal) {
    throw new AppError('Deal not found.', 404, 'NOT_FOUND');
  }

  // Find stage meta
  let currentStage = null;
  if (deal.pipelineId?.stages) {
    currentStage = deal.pipelineId.stages.find((s) => s._id.toString() === deal.stageId.toString());
  }

  return {
    ...deal.toObject(),
    currentStage,
  };
};

export const createNewDeal = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  // Resolve pipeline
  let pipeline;
  if (data.pipelineId) {
    pipeline = await Pipeline.findOne({ _id: data.pipelineId, tenantId });
  } else {
    pipeline = await Pipeline.findOne({ tenantId, isDefault: true });
    if (!pipeline) {
      const list = await getPipelinesList(tenantId);
      pipeline = list[0];
    }
  }

  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }

  // Resolve stage
  let stage;
  if (data.stageId) {
    stage = pipeline.stages.find((s) => s._id.toString() === data.stageId.toString());
  } else {
    stage = pipeline.stages[0];
  }

  if (!stage) {
    throw new AppError('Stage not found in selected pipeline.', 400, 'INVALID_STAGE');
  }

  // Inherit status and probability if not explicitly provided
  let status = data.status;
  if (!status) {
    if (stage.isWon) status = 'Won';
    else if (stage.isLost) status = 'Lost';
    else status = 'Open';
  }

  const probability = data.probability !== undefined ? data.probability : stage.probability;

  // Compute order within column
  const countInStage = await Deal.countDocuments({
    tenantId,
    pipelineId: pipeline._id,
    stageId: stage._id,
  });

  const deal = await Deal.create({
    ...data,
    tenantId,
    pipelineId: pipeline._id,
    stageId: stage._id,
    probability,
    status,
    order: data.order !== undefined ? data.order : countInStage,
    stageHistory: [
      {
        stageId: stage._id,
        stageName: stage.name,
        movedAt: new Date(),
      },
    ],
  });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Deal',
    entityId: deal._id,
    after: { title: deal.title, value: deal.value, stage: stage.name },
    ip,
    userAgent,
  });

  return deal;
};

export const updateDealById = async ({
  dealId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const deal = await Deal.findOne({ _id: dealId, tenantId });
  if (!deal) {
    throw new AppError('Deal not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = deal.toObject();

  // If stage changed, check pipeline stage rules
  if (updates.stageId && updates.stageId.toString() !== deal.stageId.toString()) {
    const pipeline = await Pipeline.findOne({ _id: deal.pipelineId, tenantId });
    const targetStage = pipeline?.stages.find((s) => s._id.toString() === updates.stageId.toString());

    if (targetStage) {
      if (targetStage.isWon) {
        updates.status = 'Won';
        updates.probability = 100;
      } else if (targetStage.isLost) {
        updates.status = 'Lost';
        updates.probability = 0;
      } else {
        updates.status = 'Open';
        if (updates.probability === undefined) {
          updates.probability = targetStage.probability;
        }
      }

      deal.stageHistory.push({
        stageId: targetStage._id,
        stageName: targetStage.name,
        movedAt: new Date(),
      });
    }
  }

  Object.assign(deal, updates);
  await deal.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Deal',
    entityId: deal._id,
    before: beforeSnapshot,
    after: deal.toObject(),
    ip,
    userAgent,
  });

  return deal;
};

export const updateDealStageOnly = async ({
  dealId,
  tenantId,
  stageId,
  order = 0,
  lostReason = '',
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const deal = await Deal.findOne({ _id: dealId, tenantId });
  if (!deal) {
    throw new AppError('Deal not found.', 404, 'NOT_FOUND');
  }

  const pipeline = await Pipeline.findOne({ _id: deal.pipelineId, tenantId });
  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }

  const targetStage = pipeline.stages.find((s) => s._id.toString() === stageId.toString());
  if (!targetStage) {
    throw new AppError('Target stage does not exist in pipeline.', 400, 'INVALID_STAGE');
  }

  const beforeSnapshot = {
    stageId: deal.stageId,
    status: deal.status,
    order: deal.order,
  };

  deal.stageId = targetStage._id;
  deal.order = order;

  if (targetStage.isWon) {
    deal.status = 'Won';
    deal.probability = 100;
  } else if (targetStage.isLost) {
    deal.status = 'Lost';
    deal.probability = 0;
    if (lostReason) deal.lostReason = lostReason;
  } else {
    deal.status = 'Open';
    deal.probability = targetStage.probability;
  }

  deal.stageHistory.push({
    stageId: targetStage._id,
    stageName: targetStage.name,
    movedAt: new Date(),
  });

  await deal.save();

  if (targetStage.isWon && deal.ownerId) {
    createNotification({
      tenantId,
      userId: deal.ownerId,
      title: 'Deal Closed Won! 🎉',
      message: `Deal "${deal.title}" ($${(deal.value || 0).toLocaleString()}) has reached Closed Won!`,
      type: 'deal',
      link: `/deals/${deal._id}`,
    }).catch(() => {});
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'STAGE_CHANGE',
    entity: 'Deal',
    entityId: deal._id,
    before: beforeSnapshot,
    after: { stageId: deal.stageId, status: deal.status, order: deal.order, lostReason: deal.lostReason },
    ip,
    userAgent,
  });

  return deal;
};

export const deleteDealById = async ({
  dealId,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const deal = await Deal.findOneAndDelete({ _id: dealId, tenantId });
  if (!deal) {
    throw new AppError('Deal not found.', 404, 'NOT_FOUND');
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Deal',
    entityId: deal._id,
    before: { title: deal.title, value: deal.value },
    ip,
    userAgent,
  });

  return true;
};
