import { EmailTemplate } from '../models/EmailTemplate.js';
import { AppError } from '../utils/AppError.js';
import { interpolateVariables } from './emailService.js';

export const getEmailTemplatesList = async ({
  tenantId,
  page = 1,
  limit = 50,
  category = '',
  search = '',
}) => {
  const query = { tenantId };

  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { subject: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [templates, total] = await Promise.all([
    EmailTemplate.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    EmailTemplate.countDocuments(query),
  ]);

  return {
    templates,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getTemplateById = async ({ tenantId, id }) => {
  const template = await EmailTemplate.findOne({ _id: id, tenantId })
    .populate('createdBy', 'firstName lastName email');
  if (!template) throw new AppError('Email template not found', 404);
  return template;
};

export const createNewTemplate = async ({
  tenantId,
  userId,
  name,
  subject,
  category = 'Sales',
  bodyHtml,
  bodyText = '',
  variables = ['firstName', 'lastName', 'company', 'jobTitle', 'ownerName', 'dealTitle'],
  isShared = true,
}) => {
  const existing = await EmailTemplate.findOne({ tenantId, name: name.trim() });
  if (existing) {
    throw new AppError(`A template named '${name}' already exists in your workspace`, 409);
  }

  const template = await EmailTemplate.create({
    tenantId,
    name: name.trim(),
    subject: subject.trim(),
    category,
    bodyHtml,
    bodyText,
    variables,
    isShared,
    createdBy: userId,
  });

  return template;
};

export const updateTemplateById = async ({ tenantId, id, data }) => {
  const template = await EmailTemplate.findOne({ _id: id, tenantId });
  if (!template) throw new AppError('Email template not found', 404);

  if (data.name && data.name.trim() !== template.name) {
    const existing = await EmailTemplate.findOne({
      tenantId,
      name: data.name.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new AppError(`A template named '${data.name}' already exists`, 409);
    }
  }

  Object.assign(template, data);
  await template.save();
  return template;
};

export const deleteTemplateById = async ({ tenantId, id }) => {
  const template = await EmailTemplate.findOneAndDelete({ _id: id, tenantId });
  if (!template) throw new AppError('Email template not found', 404);
  return { id: template._id, deleted: true };
};

export const previewTemplate = async ({ tenantId, templateId, sampleVariables = {} }) => {
  const template = await getTemplateById({ tenantId, id: templateId });
  const defaultSample = {
    firstName: 'Alex',
    lastName: 'Morgan',
    company: 'Acme Global Corp',
    jobTitle: 'VP of Technology',
    ownerName: 'Jordan Lee',
    dealTitle: 'Enterprise Cloud Transformation',
    dealValue: '$75,000',
    ...sampleVariables,
  };

  return {
    renderedSubject: interpolateVariables(template.subject, defaultSample),
    renderedHtml: interpolateVariables(template.bodyHtml, defaultSample),
    renderedText: interpolateVariables(template.bodyText, defaultSample),
  };
};
