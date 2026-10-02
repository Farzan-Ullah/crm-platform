import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { Deal } from '../models/Deal.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { Quote } from '../models/Quote.js';
import { ROLES } from '../constants/roles.js';

/**
 * Builds standard MongoDB date range match object
 */
const buildDateMatch = (startDate, endDate, dateField = 'createdAt') => {
  const match = {};
  if (startDate || endDate) {
    match[dateField] = {};
    if (startDate) match[dateField].$gte = new Date(startDate);
    if (endDate) match[dateField].$lte = new Date(endDate);
  }
  return match;
};

/**
 * 1. Lead Conversion Funnel Aggregation
 * Ingested -> Contacted -> Qualified -> Converted -> Won
 */
export const getFunnelMetrics = async ({ tenantId, startDate, endDate, pipelineId }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const leadDateMatch = buildDateMatch(startDate, endDate, 'createdAt');
  const dealDateMatch = buildDateMatch(startDate, endDate, 'createdAt');

  // Lead Funnel Stages
  const leadPipeline = [
    { $match: { tenantId: tenantObjectId, ...leadDateMatch } },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        contacted: {
          $sum: {
            $cond: [{ $in: ['$status', ['Contacted', 'Qualified', 'Converted']] }, 1, 0],
          },
        },
        qualified: {
          $sum: {
            $cond: [{ $in: ['$status', ['Qualified', 'Converted']] }, 1, 0],
          },
        },
        converted: {
          $sum: {
            $cond: [{ $eq: ['$isConverted', true] }, 1, 0],
          },
        },
      },
    },
  ];

  // Deal Won Stage
  const dealMatch = {
    tenantId: tenantObjectId,
    status: 'Won',
    ...dealDateMatch,
  };
  if (pipelineId) {
    dealMatch.pipelineId = new mongoose.Types.ObjectId(pipelineId);
  }

  const dealPipeline = [
    { $match: dealMatch },
    {
      $group: {
        _id: null,
        dealsWon: { $sum: 1 },
        totalWonRevenue: { $sum: '$value' },
      },
    },
  ];

  const [leadStats, dealStats] = await Promise.all([
    Lead.aggregate(leadPipeline),
    Deal.aggregate(dealPipeline),
  ]);

  const lData = leadStats[0] || { totalLeads: 0, contacted: 0, qualified: 0, converted: 0 };
  const dData = dealStats[0] || { dealsWon: 0, totalWonRevenue: 0 };

  const total = lData.totalLeads;
  const contacted = lData.contacted;
  const qualified = lData.qualified;
  const converted = lData.converted;
  const won = dData.dealsWon;

  const calculateRates = (count, prevCount) => {
    const fromPrev = prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 0;
    const overall = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    return { fromPrev, overall };
  };

  const stages = [
    {
      stage: '1. Ingested Leads',
      count: total,
      conversionFromPrevious: 100,
      overallConversionRate: 100,
      dropoff: total - contacted,
    },
    {
      stage: '2. Contacted',
      count: contacted,
      conversionFromPrevious: calculateRates(contacted, total).fromPrev,
      overallConversionRate: calculateRates(contacted, total).overall,
      dropoff: contacted - qualified,
    },
    {
      stage: '3. Qualified Prospect',
      count: qualified,
      conversionFromPrevious: calculateRates(qualified, contacted).fromPrev,
      overallConversionRate: calculateRates(qualified, contacted).overall,
      dropoff: qualified - converted,
    },
    {
      stage: '4. Converted to Deal',
      count: converted,
      conversionFromPrevious: calculateRates(converted, qualified).fromPrev,
      overallConversionRate: calculateRates(converted, qualified).overall,
      dropoff: converted - won,
    },
    {
      stage: '5. Closed Won',
      count: won,
      conversionFromPrevious: calculateRates(won, converted).fromPrev,
      overallConversionRate: calculateRates(won, converted).overall,
      revenueWon: dData.totalWonRevenue,
      dropoff: 0,
    },
  ];

  return {
    stages,
    summary: {
      totalLeads: total,
      contactedRate: calculateRates(contacted, total).overall,
      qualificationRate: calculateRates(qualified, total).overall,
      conversionRate: calculateRates(converted, total).overall,
      winRate: calculateRates(won, total).overall,
      totalWonRevenue: dData.totalWonRevenue,
    },
  };
};

/**
 * 2. Revenue Forecast & Weighted Pipeline
 * Monthly cohorts based on expectedClose date
 */
export const getRevenueForecast = async ({ tenantId, startDate, endDate, pipelineId }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const dealMatch = {
    tenantId: tenantObjectId,
    ...buildDateMatch(startDate, endDate, 'expectedClose'),
  };

  if (pipelineId) {
    dealMatch.pipelineId = new mongoose.Types.ObjectId(pipelineId);
  }

  const pipeline = [
    { $match: dealMatch },
    {
      $project: {
        value: { $ifNull: ['$value', 0] },
        probability: { $ifNull: ['$probability', 0] },
        status: 1,
        closeMonth: {
          $dateToString: {
            format: '%Y-%m',
            date: { $ifNull: ['$expectedClose', '$createdAt'] },
          },
        },
      },
    },
    {
      $group: {
        _id: '$closeMonth',
        totalDeals: { $sum: 1 },
        totalPipeline: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Open'] }, '$value', 0],
          },
        },
        weightedForecast: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Open'] },
              { $multiply: ['$value', { $divide: ['$probability', 100] }] },
              0,
            ],
          },
        },
        actualWon: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Won'] }, '$value', 0],
          },
        },
        lostAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Lost'] }, '$value', 0],
          },
        },
        wonCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Won'] }, 1, 0],
          },
        },
        lostCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const cohorts = await Deal.aggregate(pipeline);

  let grandPipeline = 0;
  let grandWeighted = 0;
  let grandWon = 0;
  let grandLost = 0;
  let grandWonCount = 0;
  let grandLostCount = 0;

  const formattedCohorts = cohorts.map((c) => {
    grandPipeline += c.totalPipeline;
    grandWeighted += c.weightedForecast;
    grandWon += c.actualWon;
    grandLost += c.lostAmount;
    grandWonCount += c.wonCount;
    grandLostCount += c.lostCount;

    return {
      month: c._id || 'Unscheduled',
      totalDeals: c.totalDeals,
      openPipeline: Math.round(c.totalPipeline),
      weightedForecast: Math.round(c.weightedForecast),
      actualWon: Math.round(c.actualWon),
      lostAmount: Math.round(c.lostAmount),
    };
  });

  const totalClosed = grandWonCount + grandLostCount;
  const overallWinRate = totalClosed > 0 ? Math.round((grandWonCount / totalClosed) * 1000) / 10 : 0;

  return {
    cohorts: formattedCohorts,
    summary: {
      totalPipelineValue: Math.round(grandPipeline),
      totalWeightedForecast: Math.round(grandWeighted),
      totalActualWon: Math.round(grandWon),
      totalLostAmount: Math.round(grandLost),
      overallWinRate,
    },
  };
};

/**
 * 3. Sales Representative Performance Leaderboard
 */
export const getRepLeaderboard = async ({ tenantId, startDate, endDate }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const dealDateMatch = buildDateMatch(startDate, endDate, 'createdAt');
  const activityDateMatch = buildDateMatch(startDate, endDate, 'createdAt');

  // Find all active sales team members
  const reps = await User.find({
    tenantId: tenantObjectId,
    role: { $in: [ROLES.SALES_EXECUTIVE, ROLES.SALES_MANAGER, ROLES.ADMIN] },
    isActive: true,
  }).select('firstName lastName email role');

  const repIds = reps.map((r) => r._id);

  // Deals aggregated per owner
  const dealStats = await Deal.aggregate([
    {
      $match: {
        tenantId: tenantObjectId,
        ownerId: { $in: repIds },
        ...dealDateMatch,
      },
    },
    {
      $group: {
        _id: '$ownerId',
        totalDeals: { $sum: 1 },
        wonCount: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
        lostCount: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
        revenueWon: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$value', 0] } },
        openPipeline: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, '$value', 0] } },
        avgCycleDays: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'Won'] },
              { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
              null,
            ],
          },
        },
      },
    },
  ]);

  // Activities aggregated per rep
  const activityStats = await Activity.aggregate([
    {
      $match: {
        tenantId: tenantObjectId,
        assignedTo: { $in: repIds },
        ...activityDateMatch,
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        totalActivities: { $sum: 1 },
        completedActivities: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        callsMade: { $sum: { $cond: [{ $eq: ['$type', 'Call'] }, 1, 0] } },
        meetingsHeld: { $sum: { $cond: [{ $eq: ['$type', 'Meeting'] }, 1, 0] } },
      },
    },
  ]);

  // Combine into leaderboard objects
  const dealMap = new Map(dealStats.map((d) => [String(d._id), d]));
  const actMap = new Map(activityStats.map((a) => [String(a._id), a]));

  const leaderboard = reps.map((rep) => {
    const repIdStr = String(rep._id);
    const d = dealMap.get(repIdStr) || {};
    const a = actMap.get(repIdStr) || {};

    const wonCount = d.wonCount || 0;
    const lostCount = d.lostCount || 0;
    const closedCount = wonCount + lostCount;
    const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 1000) / 10 : 0;

    return {
      userId: rep._id,
      name: `${rep.firstName} ${rep.lastName}`,
      email: rep.email,
      role: rep.role,
      totalDeals: d.totalDeals || 0,
      wonCount,
      lostCount,
      revenueWon: Math.round(d.revenueWon || 0),
      openPipeline: Math.round(d.openPipeline || 0),
      winRate,
      avgSalesCycleDays: d.avgCycleDays ? Math.round(d.avgCycleDays * 10) / 10 : 0,
      totalActivities: a.totalActivities || 0,
      completedActivities: a.completedActivities || 0,
      callsMade: a.callsMade || 0,
      meetingsHeld: a.meetingsHeld || 0,
    };
  });

  // Sort by Revenue Won descending
  leaderboard.sort((a, b) => b.revenueWon - a.revenueWon);

  // Add ranking positions
  return leaderboard.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
};

/**
 * 4. Lead Source Attribution & ROI Analysis
 */
export const getSourceAttribution = async ({ tenantId, startDate, endDate }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const dateMatch = buildDateMatch(startDate, endDate, 'createdAt');

  // Aggregate Leads by Source
  const leadSourceStats = await Lead.aggregate([
    { $match: { tenantId: tenantObjectId, ...dateMatch } },
    {
      $group: {
        _id: { $ifNull: ['$source', 'Other'] },
        totalLeads: { $sum: 1 },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$isConverted', true] }, 1, 0] } },
        avgScore: { $avg: '$score' },
      },
    },
  ]);

  // Aggregate Deals by Source
  const dealSourceStats = await Deal.aggregate([
    { $match: { tenantId: tenantObjectId, ...dateMatch } },
    {
      $group: {
        _id: { $ifNull: ['$source', 'Other'] },
        totalDeals: { $sum: 1 },
        wonDeals: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
        revenueWon: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$value', 0] } },
      },
    },
  ]);

  const dealMap = new Map(dealSourceStats.map((d) => [d._id, d]));
  const allSources = new Set([
    ...leadSourceStats.map((l) => l._id),
    ...dealSourceStats.map((d) => d._id),
  ]);

  let grandRevenue = 0;
  dealSourceStats.forEach((d) => {
    grandRevenue += d.revenueWon;
  });

  const attribution = Array.from(allSources).map((source) => {
    const l = leadSourceStats.find((item) => item._id === source) || { totalLeads: 0, convertedLeads: 0, avgScore: 0 };
    const d = dealMap.get(source) || { totalDeals: 0, wonDeals: 0, revenueWon: 0 };

    const conversionRate = l.totalLeads > 0 ? Math.round((l.convertedLeads / l.totalLeads) * 1000) / 10 : 0;
    const winRate = d.totalDeals > 0 ? Math.round((d.wonDeals / d.totalDeals) * 1000) / 10 : 0;
    const avgDealSize = d.wonDeals > 0 ? Math.round(d.revenueWon / d.wonDeals) : 0;
    const revenueShare = grandRevenue > 0 ? Math.round((d.revenueWon / grandRevenue) * 1000) / 10 : 0;

    return {
      source,
      totalLeads: l.totalLeads,
      convertedLeads: l.convertedLeads,
      conversionRate,
      avgLeadScore: Math.round(l.avgScore || 0),
      totalDeals: d.totalDeals,
      wonDeals: d.wonDeals,
      winRate,
      revenueWon: Math.round(d.revenueWon),
      avgDealSize,
      revenueShare,
    };
  });

  attribution.sort((a, b) => b.revenueWon - a.revenueWon);
  return attribution;
};

/**
 * 5. Win / Loss Analysis & Lost Reasons
 */
export const getWinLossAnalysis = async ({ tenantId, startDate, endDate, pipelineId }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const dealMatch = {
    tenantId: tenantObjectId,
    status: { $in: ['Won', 'Lost'] },
    ...buildDateMatch(startDate, endDate, 'createdAt'),
  };

  if (pipelineId) {
    dealMatch.pipelineId = new mongoose.Types.ObjectId(pipelineId);
  }

  // Summary aggregation
  const summaryStats = await Deal.aggregate([
    { $match: dealMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' },
      },
    },
  ]);

  let wonCount = 0;
  let wonValue = 0;
  let avgWonValue = 0;
  let lostCount = 0;
  let lostValue = 0;
  let avgLostValue = 0;

  summaryStats.forEach((s) => {
    if (s._id === 'Won') {
      wonCount = s.count;
      wonValue = s.totalValue;
      avgWonValue = Math.round(s.avgValue || 0);
    } else if (s._id === 'Lost') {
      lostCount = s.count;
      lostValue = s.totalValue;
      avgLostValue = Math.round(s.avgValue || 0);
    }
  });

  const totalClosed = wonCount + lostCount;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 1000) / 10 : 0;
  const lossRate = totalClosed > 0 ? Math.round((lostCount / totalClosed) * 1000) / 10 : 0;

  // Lost reasons aggregation
  const lostReasonsStats = await Deal.aggregate([
    {
      $match: {
        ...dealMatch,
        status: 'Lost',
      },
    },
    {
      $group: {
        _id: { $ifNull: ['$lostReason', 'Unspecified'] },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const reasons = lostReasonsStats.map((r) => ({
    reason: r._id || 'Unspecified',
    count: r.count,
    totalValue: Math.round(r.totalValue),
    percentage: lostCount > 0 ? Math.round((r.count / lostCount) * 1000) / 10 : 0,
  }));

  return {
    metrics: {
      totalClosed,
      wonCount,
      wonValue: Math.round(wonValue),
      avgWonValue,
      lostCount,
      lostValue: Math.round(lostValue),
      avgLostValue,
      winRate,
      lossRate,
    },
    lostReasons: reasons,
  };
};

/**
 * 6. Activity & Engagement Trends
 */
export const getActivityTrends = async ({ tenantId, startDate, endDate }) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const match = {
    tenantId: tenantObjectId,
    ...buildDateMatch(startDate, endDate, 'createdAt'),
  };

  const [typeStats, timelineStats] = await Promise.all([
    Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        },
      },
    ]),
    Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: 1 },
          calls: { $sum: { $cond: [{ $eq: ['$type', 'Call'] }, 1, 0] } },
          meetings: { $sum: { $cond: [{ $eq: ['$type', 'Meeting'] }, 1, 0] } },
          tasks: { $sum: { $cond: [{ $eq: ['$type', 'Task'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    byType: typeStats.map((t) => ({
      type: t._id,
      total: t.total,
      completed: t.completed,
      pending: t.pending,
      completionRate: t.total > 0 ? Math.round((t.completed / t.total) * 1000) / 10 : 0,
    })),
    timeline: timelineStats.map((d) => ({
      date: d._id,
      total: d.total,
      calls: d.calls,
      meetings: d.meetings,
      tasks: d.tasks,
    })),
  };
};

/**
 * 7. High-Level Executive Dashboard Summary
 */
export const getExecutiveSummary = async ({ tenantId, startDate, endDate }) => {
  const [funnel, forecast, winLoss, activities] = await Promise.all([
    getFunnelMetrics({ tenantId, startDate, endDate }),
    getRevenueForecast({ tenantId, startDate, endDate }),
    getWinLossAnalysis({ tenantId, startDate, endDate }),
    getActivityTrends({ tenantId, startDate, endDate }),
  ]);

  const totalActivities = activities.byType.reduce((acc, curr) => acc + curr.total, 0);
  const completedActivities = activities.byType.reduce((acc, curr) => acc + curr.completed, 0);

  return {
    revenueWon: forecast.summary.totalActualWon,
    openPipelineValue: forecast.summary.totalPipelineValue,
    weightedForecastValue: forecast.summary.totalWeightedForecast,
    winRate: winLoss.metrics.winRate,
    avgWonDealSize: winLoss.metrics.avgWonValue,
    totalLeads: funnel.summary.totalLeads,
    leadConversionRate: funnel.summary.conversionRate,
    totalClosedDeals: winLoss.metrics.totalClosed,
    totalActivitiesLogged: totalActivities,
    activitiesCompletedRate: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
  };
};
