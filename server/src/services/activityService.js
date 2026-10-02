import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';
import {
  scheduleActivityReminder,
  cancelActivityReminder,
} from '../queues/reminderQueue.js';

export const getActivitiesList = async ({
  tenantId,
  page = 1,
  limit = 25,
  search = '',
  type = '',
  status = '',
  priority = '',
  assignedTo = '',
  entityType = '',
  entityId = '',
  startDate = null,
  endDate = null,
  sortBy = 'dueDate',
  sortOrder = 'asc',
}) => {
  const query = { tenantId };

  if (type) query.type = type;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  if (entityType && entityId) {
    query.$or = [
      { entityType, entityId },
      ...(entityType === 'Lead' ? [{ leadId: entityId }] : []),
      ...(entityType === 'Contact' ? [{ contactId: entityId }] : []),
      ...(entityType === 'Company' ? [{ companyId: entityId }] : []),
      ...(entityType === 'Deal' ? [{ dealId: entityId }] : []),
    ];
  }

  if (startDate || endDate) {
    query.dueDate = {};
    if (startDate) query.dueDate.$gte = new Date(startDate);
    if (endDate) query.dueDate.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { location: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = sortOrder === 'desc' ? -1 : 1;

  const [activities, total, statsAggregation] = await Promise.all([
    Activity.find(query)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email')
      .populate('leadId', 'firstName lastName company email')
      .populate('contactId', 'firstName lastName email phone')
      .populate('companyId', 'name domain')
      .populate('dealId', 'title value')
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(Number(limit)),
    Activity.countDocuments(query),
    Activity.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Pending'] },
                    { $lt: ['$dueDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const stats = statsAggregation[0] || { total: 0, pending: 0, completed: 0, overdue: 0 };

  return {
    activities,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
    stats,
  };
};

export const getCalendarActivities = async ({
  tenantId,
  start,
  end,
  assignedTo = '',
  type = '',
}) => {
  const query = {
    tenantId,
    dueDate: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
  };

  if (assignedTo) query.assignedTo = assignedTo;
  if (type) query.type = type;

  const activities = await Activity.find(query)
    .populate('assignedTo', 'firstName lastName email')
    .populate('leadId', 'firstName lastName company')
    .populate('contactId', 'firstName lastName')
    .populate('companyId', 'name')
    .populate('dealId', 'title')
    .sort({ dueDate: 1 });

  return activities;
};

export const getUpcomingActivities = async ({ tenantId, userId, limit = 10 }) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activities = await Activity.find({
    tenantId,
    assignedTo: userId,
    status: 'Pending',
    dueDate: { $lte: nextWeek },
  })
    .populate('leadId', 'firstName lastName company')
    .populate('contactId', 'firstName lastName')
    .populate('companyId', 'name')
    .populate('dealId', 'title')
    .sort({ dueDate: 1 })
    .limit(limit);

  return activities;
};

export const getEntityTimeline = async ({
  tenantId,
  entityType,
  entityId,
  limit = 50,
}) => {
  const matchFilter = {
    tenantId,
    $or: [
      { entityType, entityId },
      ...(entityType === 'Lead' ? [{ leadId: entityId }] : []),
      ...(entityType === 'Contact' ? [{ contactId: entityId }] : []),
      ...(entityType === 'Company' ? [{ companyId: entityId }] : []),
      ...(entityType === 'Deal' ? [{ dealId: entityId }] : []),
    ],
  };

  const [activities, auditLogs] = await Promise.all([
    Activity.find(matchFilter)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit),
    AuditLog.find({
      tenantId,
      entity: entityType,
      entityId,
    })
      .populate('actorId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit),
  ]);

  // Combine into unified polymorphic timeline
  const combined = [
    ...activities.map((a) => ({
      timelineType: 'activity',
      id: a._id,
      activityType: a.type,
      title: a.title,
      description: a.description,
      status: a.status,
      priority: a.priority,
      dueDate: a.dueDate,
      completedAt: a.completedAt,
      duration: a.duration,
      callOutcome: a.callOutcome,
      callDirection: a.callDirection,
      location: a.location,
      meetingLink: a.meetingLink,
      actor: a.createdBy || a.assignedTo,
      timestamp: a.createdAt,
    })),
    ...auditLogs.map((log) => ({
      timelineType: 'audit',
      id: log._id,
      action: log.action,
      entity: log.entity,
      actor: log.actorId,
      details: log.after || log.before,
      timestamp: log.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return combined.slice(0, limit);
};

export const getActivityDetails = async (activityId, tenantId) => {
  const activity = await Activity.findOne({ _id: activityId, tenantId })
    .populate('assignedTo', 'firstName lastName email avatar phone')
    .populate('createdBy', 'firstName lastName email')
    .populate('leadId')
    .populate('contactId')
    .populate('companyId')
    .populate('dealId');

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'NOT_FOUND');
  }

  return activity;
};

export const createNewActivity = async ({
  tenantId,
  data,
  actorId,
  ip = '',
  userAgent = '',
}) => {
  // Resolve assignedTo & createdBy
  const assignedTo = data.assignedTo || actorId;
  const createdBy = actorId;

  // Auto-map direct foreign keys if polymorphic entity is selected
  const entityData = {};
  if (data.entityType && data.entityId) {
    entityData.entityType = data.entityType;
    entityData.entityId = data.entityId;
    if (data.entityType === 'Lead') entityData.leadId = data.entityId;
    if (data.entityType === 'Contact') entityData.contactId = data.entityId;
    if (data.entityType === 'Company') entityData.companyId = data.entityId;
    if (data.entityType === 'Deal') entityData.dealId = data.entityId;
  }

  // Calculate reminderTime if offset minutes given
  let reminderTime = data.reminderTime ? new Date(data.reminderTime) : null;
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date();

  if (!reminderTime && data.reminderEnabled && data.reminderOffsetMinutes) {
    reminderTime = new Date(dueDate.getTime() - Number(data.reminderOffsetMinutes) * 60000);
  } else if (!reminderTime && data.reminderEnabled) {
    // Default reminder: 15 minutes before
    reminderTime = new Date(dueDate.getTime() - 15 * 60000);
  }

  const activity = await Activity.create({
    ...data,
    ...entityData,
    tenantId,
    assignedTo,
    createdBy,
    dueDate,
    reminderTime,
    reminderSent: false,
  });

  // Schedule background reminder
  await scheduleActivityReminder(activity);

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Activity',
    entityId: activity._id,
    after: { title: activity.title, type: activity.type, dueDate: activity.dueDate },
    ip,
    userAgent,
  });

  return activity;
};

export const updateActivityById = async ({
  activityId,
  tenantId,
  updates,
  actorId,
  ip = '',
  userAgent = '',
}) => {
  const activity = await Activity.findOne({ _id: activityId, tenantId });
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = activity.toObject();

  if (updates.status === 'Completed' && activity.status !== 'Completed') {
    updates.completedAt = new Date();
  } else if (updates.status === 'Pending') {
    updates.completedAt = null;
  }

  // Update polymorphic entity links if changed
  if (updates.entityType && updates.entityId) {
    if (updates.entityType === 'Lead') updates.leadId = updates.entityId;
    if (updates.entityType === 'Contact') updates.contactId = updates.entityId;
    if (updates.entityType === 'Company') updates.companyId = updates.entityId;
    if (updates.entityType === 'Deal') updates.dealId = updates.entityId;
  }

  Object.assign(activity, updates);
  await activity.save();

  // Handle reminder changes
  if (updates.dueDate || updates.reminderTime || updates.reminderEnabled !== undefined) {
    await cancelActivityReminder(activity._id, activity.reminderJobId);
    activity.reminderSent = false;
    await scheduleActivityReminder(activity);
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Activity',
    entityId: activity._id,
    before: beforeSnapshot,
    after: activity.toObject(),
    ip,
    userAgent,
  });

  return activity;
};

export const toggleActivityComplete = async ({
  activityId,
  tenantId,
  actorId,
  ip = '',
  userAgent = '',
}) => {
  const activity = await Activity.findOne({ _id: activityId, tenantId });
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'NOT_FOUND');
  }

  const isCompleted = activity.status === 'Completed';
  activity.status = isCompleted ? 'Pending' : 'Completed';
  activity.completedAt = isCompleted ? null : new Date();

  await activity.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Activity',
    entityId: activity._id,
    after: { status: activity.status, completedAt: activity.completedAt },
    ip,
    userAgent,
  });

  return activity;
};

export const deleteActivityById = async ({
  activityId,
  tenantId,
  actorId,
  ip = '',
  userAgent = '',
}) => {
  const activity = await Activity.findOneAndDelete({ _id: activityId, tenantId });
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'NOT_FOUND');
  }

  await cancelActivityReminder(activity._id, activity.reminderJobId);

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Activity',
    entityId: activity._id,
    before: { title: activity.title, type: activity.type },
    ip,
    userAgent,
  });

  return true;
};
