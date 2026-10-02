import { Contact } from '../models/Contact.js';
import { Deal } from '../models/Deal.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const getContactsList = async ({
  tenantId,
  page = 1,
  limit = 20,
  search = '',
  companyId = '',
  ownerId = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const query = { tenantId, mergedInto: null };

  if (companyId && companyId !== 'all') query.companyId = companyId;
  if (ownerId && ownerId !== 'all') query.ownerId = ownerId;

  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { jobTitle: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [contacts, total] = await Promise.all([
    Contact.find(query)
      .populate('companyId', 'name domain website')
      .populate('ownerId', 'firstName lastName email avatar role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Contact.countDocuments(query),
  ]);

  return {
    contacts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getContactDetails = async (contactId, tenantId) => {
  const contact = await Contact.findOne({ _id: contactId, tenantId, mergedInto: null })
    .populate('companyId', 'name domain website phone email address')
    .populate('ownerId', 'firstName lastName email avatar role')
    .lean();

  if (!contact) {
    throw new AppError('Contact not found.', 404, 'NOT_FOUND');
  }

  // Fetch associated deals
  const deals = await Deal.find({ contactId: contact._id, tenantId })
    .populate('stageId', 'name color')
    .populate('pipelineId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...contact,
    deals,
  };
};

export const createNewContact = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  // Check duplicate email in this tenant
  if (data.email && data.email.trim()) {
    const existing = await Contact.findOne({
      tenantId,
      email: data.email.toLowerCase().trim(),
      mergedInto: null,
    });
    if (existing) {
      throw new AppError(
        `A contact with email '${data.email}' already exists (${existing.firstName} ${existing.lastName}).`,
        409,
        'CONFLICT'
      );
    }
  }

  const contact = await Contact.create({
    ...data,
    tenantId,
    email: data.email ? data.email.toLowerCase().trim() : '',
  });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Contact',
    entityId: contact._id,
    after: { name: contact.fullName, email: contact.email },
    ip,
    userAgent,
  });

  return contact;
};

export const updateContactById = async ({
  contactId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const contact = await Contact.findOne({ _id: contactId, tenantId, mergedInto: null });
  if (!contact) {
    throw new AppError('Contact not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = contact.toObject();

  if (updates.email && updates.email.toLowerCase().trim() !== contact.email) {
    const existing = await Contact.findOne({
      tenantId,
      email: updates.email.toLowerCase().trim(),
      mergedInto: null,
      _id: { $ne: contact._id },
    });
    if (existing) {
      throw new AppError(`A contact with email '${updates.email}' already exists.`, 409, 'CONFLICT');
    }
  }

  Object.assign(contact, updates);
  if (updates.email) contact.email = updates.email.toLowerCase().trim();
  await contact.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Contact',
    entityId: contact._id,
    before: beforeSnapshot,
    after: contact.toObject(),
    ip,
    userAgent,
  });

  return contact;
};

export const deleteContactById = async ({
  contactId,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const contact = await Contact.findOneAndDelete({ _id: contactId, tenantId });
  if (!contact) {
    throw new AppError('Contact not found.', 404, 'NOT_FOUND');
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Contact',
    entityId: contact._id,
    before: { name: contact.fullName, email: contact.email },
    ip,
    userAgent,
  });

  return true;
};

export const mergeTwoContacts = async ({
  primaryContactId,
  secondaryContactId,
  mergedFields,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  if (primaryContactId === secondaryContactId) {
    throw new AppError('Cannot merge a contact into itself.', 400, 'BAD_REQUEST');
  }

  const [primary, secondary] = await Promise.all([
    Contact.findOne({ _id: primaryContactId, tenantId, mergedInto: null }),
    Contact.findOne({ _id: secondaryContactId, tenantId, mergedInto: null }),
  ]);

  if (!primary || !secondary) {
    throw new AppError('Both primary and secondary contacts must exist and not be already merged.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = {
    primary: primary.toObject(),
    secondary: secondary.toObject(),
  };

  // Apply chosen field values to primary
  Object.assign(primary, mergedFields);
  await primary.save();

  // Relink deals from secondary to primary
  await Deal.updateMany(
    { contactId: secondary._id, tenantId },
    { $set: { contactId: primary._id } }
  );

  // Soft-deprecate secondary record
  secondary.mergedInto = primary._id;
  await secondary.save();

  // Log audit event for compliance
  await logAuditEvent({
    tenantId,
    actorId,
    action: 'MERGE',
    entity: 'Contact',
    entityId: primary._id,
    before: beforeSnapshot,
    after: {
      primaryId: primary._id,
      secondaryId: secondary._id,
      mergedFields,
    },
    ip,
    userAgent,
  });

  return primary;
};
