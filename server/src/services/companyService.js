import { Company } from '../models/Company.js';
import { Contact } from '../models/Contact.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const getCompaniesList = async ({
  tenantId,
  page = 1,
  limit = 20,
  search = '',
  industry = '',
  size = '',
  ownerId = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const query = { tenantId };

  if (industry && industry !== 'all') query.industry = industry;
  if (size && size !== 'all') query.size = size;
  if (ownerId && ownerId !== 'all') query.ownerId = ownerId;

  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { domain: searchRegex }, { website: searchRegex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [companies, total] = await Promise.all([
    Company.find(query)
      .populate('ownerId', 'firstName lastName email avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Company.countDocuments(query),
  ]);

  // Aggregate contact counts per company in one query
  const companyIds = companies.map((c) => c._id);
  const contactCounts = await Contact.aggregate([
    { $match: { tenantId, companyId: { $in: companyIds }, mergedInto: null } },
    { $group: { _id: '$companyId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  contactCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const companiesWithCounts = companies.map((c) => ({
    ...c,
    contactsCount: countMap.get(c._id.toString()) || 0,
  }));

  return {
    companies: companiesWithCounts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getCompanyDetails = async (companyId, tenantId) => {
  const company = await Company.findOne({ _id: companyId, tenantId })
    .populate('ownerId', 'firstName lastName email avatar role')
    .lean();

  if (!company) {
    throw new AppError('Company not found.', 404, 'NOT_FOUND');
  }

  const contacts = await Contact.find({ companyId: company._id, tenantId, mergedInto: null })
    .populate('ownerId', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...company,
    contacts,
  };
};

export const createNewCompany = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  // Check domain conflict if domain provided
  if (data.domain && data.domain.trim()) {
    const existing = await Company.findOne({
      tenantId,
      domain: data.domain.toLowerCase().trim(),
    });
    if (existing) {
      throw new AppError(
        `A company with domain '${data.domain}' already exists (${existing.name}).`,
        409,
        'CONFLICT'
      );
    }
  }

  const company = await Company.create({
    ...data,
    tenantId,
    domain: data.domain ? data.domain.toLowerCase().trim() : '',
  });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Company',
    entityId: company._id,
    after: { name: company.name, domain: company.domain },
    ip,
    userAgent,
  });

  return company;
};

export const updateCompanyById = async ({
  companyId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const company = await Company.findOne({ _id: companyId, tenantId });
  if (!company) {
    throw new AppError('Company not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = company.toObject();

  if (updates.domain && updates.domain.toLowerCase().trim() !== company.domain) {
    const existing = await Company.findOne({
      tenantId,
      domain: updates.domain.toLowerCase().trim(),
      _id: { $ne: company._id },
    });
    if (existing) {
      throw new AppError(`A company with domain '${updates.domain}' already exists.`, 409, 'CONFLICT');
    }
  }

  Object.assign(company, updates);
  if (updates.domain) company.domain = updates.domain.toLowerCase().trim();
  await company.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Company',
    entityId: company._id,
    before: beforeSnapshot,
    after: company.toObject(),
    ip,
    userAgent,
  });

  return company;
};

export const deleteCompanyById = async ({
  companyId,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const company = await Company.findOneAndDelete({ _id: companyId, tenantId });
  if (!company) {
    throw new AppError('Company not found.', 404, 'NOT_FOUND');
  }

  // Unlink associated contacts
  await Contact.updateMany({ companyId: company._id, tenantId }, { $set: { companyId: null } });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Company',
    entityId: company._id,
    before: { name: company.name },
    ip,
    userAgent,
  });

  return true;
};
