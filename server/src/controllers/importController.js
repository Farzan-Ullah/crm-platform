import {
  getPreviewAndMappings,
  executeBulkImport,
  generateTemplateCsv,
  generateErrorsCsv,
} from '../services/importService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please select a file to upload (.csv or .xlsx)', 400);
    }

    const { entity = 'Lead' } = req.body;
    const result = await getPreviewAndMappings(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      entity
    );

    return sendSuccess(res, 'File parsed successfully for preview', result);
  } catch (err) {
    return next(err);
  }
};

export const runImport = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a file to import', 400);
    }

    const { entity = 'Lead', duplicateStrategy = 'skip' } = req.body;
    let mappings = {};

    if (typeof req.body.mappings === 'string') {
      try {
        mappings = JSON.parse(req.body.mappings);
      } catch (e) {
        mappings = {};
      }
    } else if (typeof req.body.mappings === 'object' && req.body.mappings !== null) {
      mappings = req.body.mappings;
    }

    const result = await executeBulkImport({
      tenantId: req.tenantId || req.user.tenantId,
      actorId: req.user._id,
      entity,
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
      mappings,
      duplicateStrategy,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    return sendSuccess(
      res,
      `Import processed: ${result.importedCount} created, ${result.updatedCount} updated, ${result.skippedCount} skipped, ${result.failedCount} failed`,
      result
    );
  } catch (err) {
    return next(err);
  }
};

export const downloadTemplate = async (req, res, next) => {
  try {
    const { entity = 'Lead' } = req.params;
    const csv = generateTemplateCsv(entity);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${entity.toLowerCase()}_sample_template.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};

export const downloadErrorReport = async (req, res, next) => {
  try {
    const { errors } = req.body;
    if (!Array.isArray(errors) || errors.length === 0) {
      throw new AppError('No errors provided to generate failure report', 400);
    }

    const csv = generateErrorsCsv(errors);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};
