import {
  getDealsList,
  getDealsKanban,
  getDealForecast,
  getDealDetails,
  createNewDeal,
  updateDealById,
  updateDealStageOnly,
  deleteDealById,
} from '../services/dealService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getDeals = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      pipelineId,
      stageId,
      status,
      priority,
      ownerId,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await getDealsList({
      tenantId: req.tenantId,
      page,
      limit,
      search,
      pipelineId,
      stageId,
      status,
      priority,
      ownerId,
      sortBy,
      sortOrder,
    });

    return sendSuccess(res, 'Deals fetched successfully', result.deals, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getKanban = async (req, res, next) => {
  try {
    const { pipelineId, ownerId, search } = req.query;
    const result = await getDealsKanban({
      tenantId: req.tenantId,
      pipelineId,
      ownerId,
      search,
    });
    return sendSuccess(res, 'Kanban board fetched successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const getForecast = async (req, res, next) => {
  try {
    const { pipelineId, ownerId, startDate, endDate } = req.query;
    const result = await getDealForecast({
      tenantId: req.tenantId,
      pipelineId,
      ownerId,
      startDate,
      endDate,
    });
    return sendSuccess(res, 'Revenue forecast fetched successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const getDeal = async (req, res, next) => {
  try {
    const deal = await getDealDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Deal details fetched successfully', deal);
  } catch (err) {
    return next(err);
  }
};

export const createDeal = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const deal = await createNewDeal({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Deal created successfully', deal, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateDeal = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const deal = await updateDealById({
      dealId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Deal updated successfully', deal);
  } catch (err) {
    return next(err);
  }
};

export const updateDealStage = async (req, res, next) => {
  try {
    const { stageId, order, lostReason } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const deal = await updateDealStageOnly({
      dealId: req.params.id,
      tenantId: req.tenantId,
      stageId,
      order,
      lostReason,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Deal stage updated successfully', deal);
  } catch (err) {
    return next(err);
  }
};

export const deleteDeal = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deleteDealById({
      dealId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Deal deleted successfully');
  } catch (err) {
    return next(err);
  }
};
