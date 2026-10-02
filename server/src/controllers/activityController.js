import {
  getActivitiesList,
  getCalendarActivities,
  getUpcomingActivities,
  getEntityTimeline,
  getActivityDetails,
  createNewActivity,
  updateActivityById,
  toggleActivityComplete,
  deleteActivityById,
} from '../services/activityService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getActivities = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      type,
      status,
      priority,
      assignedTo,
      entityType,
      entityId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await getActivitiesList({
      tenantId: req.tenantId,
      page,
      limit,
      search,
      type,
      status,
      priority,
      assignedTo,
      entityType,
      entityId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    const responseData = {
      activities: result.activities,
      stats: result.stats,
    };

    return sendSuccess(res, 'Activities fetched successfully', responseData, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getCalendar = async (req, res, next) => {
  try {
    const { start, end, assignedTo, type } = req.query;
    const activities = await getCalendarActivities({
      tenantId: req.tenantId,
      start: start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: end || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo,
      type,
    });
    return sendSuccess(res, 'Calendar activities fetched successfully', activities);
  } catch (err) {
    return next(err);
  }
};

export const getUpcoming = async (req, res, next) => {
  try {
    const activities = await getUpcomingActivities({
      tenantId: req.tenantId,
      userId: req.user._id,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    });
    return sendSuccess(res, 'Upcoming activities fetched successfully', activities);
  } catch (err) {
    return next(err);
  }
};

export const getTimeline = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const timeline = await getEntityTimeline({
      tenantId: req.tenantId,
      entityType,
      entityId,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    return sendSuccess(res, 'Entity timeline fetched successfully', timeline);
  } catch (err) {
    return next(err);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const activity = await getActivityDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Activity details fetched successfully', activity);
  } catch (err) {
    return next(err);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const activity = await createNewActivity({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Activity created successfully', activity, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateActivity = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const activity = await updateActivityById({
      activityId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Activity updated successfully', activity);
  } catch (err) {
    return next(err);
  }
};

export const toggleComplete = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const activity = await toggleActivityComplete({
      activityId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Activity status toggled', activity);
  } catch (err) {
    return next(err);
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deleteActivityById({
      activityId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Activity deleted successfully');
  } catch (err) {
    return next(err);
  }
};
