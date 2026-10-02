import {
  getExecutiveSummary,
  getFunnelMetrics,
  getRevenueForecast,
  getRepLeaderboard,
  getSourceAttribution,
  getWinLossAnalysis,
  getActivityTrends,
} from '../services/analyticsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await getExecutiveSummary({
      tenantId: req.tenantId,
      startDate,
      endDate,
    });
    return sendSuccess(res, 'Executive summary retrieved successfully', summary);
  } catch (err) {
    return next(err);
  }
};

export const getFunnel = async (req, res, next) => {
  try {
    const { startDate, endDate, pipelineId } = req.query;
    const funnel = await getFunnelMetrics({
      tenantId: req.tenantId,
      startDate,
      endDate,
      pipelineId,
    });
    return sendSuccess(res, 'Lead conversion funnel retrieved', funnel);
  } catch (err) {
    return next(err);
  }
};

export const getForecast = async (req, res, next) => {
  try {
    const { startDate, endDate, pipelineId } = req.query;
    const forecast = await getRevenueForecast({
      tenantId: req.tenantId,
      startDate,
      endDate,
      pipelineId,
    });
    return sendSuccess(res, 'Revenue forecast cohorts retrieved', forecast);
  } catch (err) {
    return next(err);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const leaderboard = await getRepLeaderboard({
      tenantId: req.tenantId,
      startDate,
      endDate,
    });
    return sendSuccess(res, 'Sales rep leaderboard retrieved', leaderboard);
  } catch (err) {
    return next(err);
  }
};

export const getSources = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const sources = await getSourceAttribution({
      tenantId: req.tenantId,
      startDate,
      endDate,
    });
    return sendSuccess(res, 'Source ROI attribution retrieved', sources);
  } catch (err) {
    return next(err);
  }
};

export const getWinLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, pipelineId } = req.query;
    const winLoss = await getWinLossAnalysis({
      tenantId: req.tenantId,
      startDate,
      endDate,
      pipelineId,
    });
    return sendSuccess(res, 'Win/Loss debrief analysis retrieved', winLoss);
  } catch (err) {
    return next(err);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const activities = await getActivityTrends({
      tenantId: req.tenantId,
      startDate,
      endDate,
    });
    return sendSuccess(res, 'Activity engagement trends retrieved', activities);
  } catch (err) {
    return next(err);
  }
};
