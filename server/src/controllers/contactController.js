import {
  getContactsList,
  getContactDetails,
  createNewContact,
  updateContactById,
  deleteContactById,
  mergeTwoContacts,
} from '../services/contactService.js';
import { detectDuplicates } from '../services/duplicateDetectionService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getContacts = async (req, res, next) => {
  try {
    const { page, limit, search, companyId, ownerId, sortBy, sortOrder } = req.query;
    const result = await getContactsList({
      tenantId: req.tenantId,
      page,
      limit,
      search,
      companyId,
      ownerId,
      sortBy,
      sortOrder,
    });
    return sendSuccess(res, 'Contacts fetched successfully', result.contacts, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getContact = async (req, res, next) => {
  try {
    const contact = await getContactDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Contact details fetched successfully', contact);
  } catch (err) {
    return next(err);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const contact = await createNewContact({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Contact created successfully', contact, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const contact = await updateContactById({
      contactId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Contact updated successfully', contact);
  } catch (err) {
    return next(err);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deleteContactById({
      contactId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Contact deleted successfully');
  } catch (err) {
    return next(err);
  }
};

export const mergeContacts = async (req, res, next) => {
  try {
    const { primaryContactId, secondaryContactId, mergedFields } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const merged = await mergeTwoContacts({
      primaryContactId,
      secondaryContactId,
      mergedFields,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Contacts merged successfully', merged);
  } catch (err) {
    return next(err);
  }
};

export const checkContactDuplicates = async (req, res, next) => {
  try {
    const { email, phone, excludeId } = req.query;
    const result = await detectDuplicates({
      tenantId: req.tenantId,
      type: 'contact',
      email,
      phone,
      excludeId,
    });
    return sendSuccess(res, result.hasDuplicates ? 'Possible duplicate contacts detected' : 'No duplicates found', result);
  } catch (err) {
    return next(err);
  }
};
