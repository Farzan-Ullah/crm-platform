import {
  getCompaniesList,
  getCompanyDetails,
  createNewCompany,
  updateCompanyById,
  deleteCompanyById,
} from '../services/companyService.js';
import { detectDuplicates } from '../services/duplicateDetectionService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getCompanies = async (req, res, next) => {
  try {
    const { page, limit, search, industry, size, ownerId, sortBy, sortOrder } = req.query;
    const result = await getCompaniesList({
      tenantId: req.tenantId,
      page,
      limit,
      search,
      industry,
      size,
      ownerId,
      sortBy,
      sortOrder,
    });
    return sendSuccess(res, 'Companies fetched successfully', result.companies, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    const company = await getCompanyDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Company details fetched successfully', company);
  } catch (err) {
    return next(err);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const company = await createNewCompany({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Company created successfully', company, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const company = await updateCompanyById({
      companyId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Company updated successfully', company);
  } catch (err) {
    return next(err);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deleteCompanyById({
      companyId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Company deleted successfully');
  } catch (err) {
    return next(err);
  }
};

export const checkCompanyDuplicates = async (req, res, next) => {
  try {
    const { domain, name, excludeId } = req.query;
    const result = await detectDuplicates({
      tenantId: req.tenantId,
      type: 'company',
      domain,
      name,
      excludeId,
    });
    return sendSuccess(res, result.hasDuplicates ? 'Possible duplicate companies detected' : 'No duplicates found', result);
  } catch (err) {
    return next(err);
  }
};
