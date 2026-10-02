import {
  getEmailTemplatesList,
  getTemplateById,
  createNewTemplate,
  updateTemplateById,
  deleteTemplateById,
  previewTemplate,
} from '../services/emailTemplateService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getTemplates = async (req, res, next) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await getEmailTemplatesList({
      tenantId: req.tenantId,
      page,
      limit,
      category,
      search,
    });
    return sendSuccess(res, 'Email templates fetched', result.templates, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getTemplate = async (req, res, next) => {
  try {
    const template = await getTemplateById({
      tenantId: req.tenantId,
      id: req.params.id,
    });
    return sendSuccess(res, 'Email template fetched', template);
  } catch (err) {
    return next(err);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, subject, category, bodyHtml, bodyText, variables, isShared } = req.body;
    const template = await createNewTemplate({
      tenantId: req.tenantId,
      userId: req.user._id,
      name,
      subject,
      category,
      bodyHtml,
      bodyText,
      variables,
      isShared,
    });
    return sendSuccess(res, 'Email template created successfully', template, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await updateTemplateById({
      tenantId: req.tenantId,
      id: req.params.id,
      data: req.body,
    });
    return sendSuccess(res, 'Email template updated successfully', template);
  } catch (err) {
    return next(err);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const result = await deleteTemplateById({
      tenantId: req.tenantId,
      id: req.params.id,
    });
    return sendSuccess(res, 'Email template deleted successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const previewTemplateContent = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const preview = await previewTemplate({
      tenantId: req.tenantId,
      templateId,
      sampleVariables: req.body.variables || {},
    });
    return sendSuccess(res, 'Template preview generated', preview);
  } catch (err) {
    return next(err);
  }
};
