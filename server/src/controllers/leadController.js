import {
  createNewLead,
  getLeadsList,
  getLeadDetails,
  updateLeadById,
  deleteLeadById,
  bulkUpdateLeadStatus,
  bulkAssignLeads,
  bulkDeleteLeads,
  checkForDuplicateLead,
} from '../services/leadService.js';
import { assignLeadToRep } from '../services/leadAssignmentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getLeads = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      status,
      source,
      ownerId,
      scoreRange,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await getLeadsList({
      tenantId: req.tenantId,
      user: req.user,
      page,
      limit,
      search,
      status,
      source,
      ownerId,
      scoreRange,
      sortBy,
      sortOrder,
    });

    return sendSuccess(res, 'Leads fetched successfully', result.leads, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const lead = await createNewLead({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Lead created successfully', lead, 201);
  } catch (err) {
    return next(err);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const lead = await getLeadDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Lead details fetched successfully', lead);
  } catch (err) {
    return next(err);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const lead = await updateLeadById({
      leadId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Lead updated successfully', lead);
  } catch (err) {
    return next(err);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deleteLeadById({
      leadId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Lead deleted successfully');
  } catch (err) {
    return next(err);
  }
};

export const assignLead = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const lead = await assignLeadToRep({
      leadId: req.params.id,
      tenantId: req.tenantId,
      ownerId: req.body.ownerId,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Lead assigned successfully', lead);
  } catch (err) {
    return next(err);
  }
};

export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { leadIds, status } = req.body;
    const result = await bulkUpdateLeadStatus({
      leadIds,
      status,
      tenantId: req.tenantId,
      actorId: req.user._id,
    });
    return sendSuccess(res, `Updated status for ${result.modifiedCount} leads`, result);
  } catch (err) {
    return next(err);
  }
};

export const bulkAssign = async (req, res, next) => {
  try {
    const { leadIds, ownerId } = req.body;
    const result = await bulkAssignLeads({
      leadIds,
      ownerId,
      tenantId: req.tenantId,
      actorId: req.user._id,
    });
    return sendSuccess(res, `Assigned ${result.modifiedCount} leads successfully`, result);
  } catch (err) {
    return next(err);
  }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    const result = await bulkDeleteLeads({
      leadIds,
      tenantId: req.tenantId,
      actorId: req.user._id,
    });
    return sendSuccess(res, `Deleted ${result.deletedCount} leads successfully`, result);
  } catch (err) {
    return next(err);
  }
};

export const checkDuplicate = async (req, res, next) => {
  try {
    const { email, phone, excludeId } = req.query;
    const duplicate = await checkForDuplicateLead({
      email,
      phone,
      tenantId: req.tenantId,
      excludeId,
    });
    return sendSuccess(res, duplicate ? 'Possible duplicate found' : 'No duplicates found', {
      isDuplicate: !!duplicate,
      lead: duplicate,
    });
  } catch (err) {
    return next(err);
  }
};
