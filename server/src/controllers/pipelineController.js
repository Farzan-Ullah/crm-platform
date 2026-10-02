import {
  getPipelinesList,
  getPipelineDetails,
  createNewPipeline,
  updatePipelineById,
  deletePipelineById,
} from '../services/pipelineService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getPipelines = async (req, res, next) => {
  try {
    const pipelines = await getPipelinesList(req.tenantId);
    return sendSuccess(res, 'Pipelines fetched successfully', pipelines);
  } catch (err) {
    return next(err);
  }
};

export const getPipeline = async (req, res, next) => {
  try {
    const pipeline = await getPipelineDetails(req.params.id, req.tenantId);
    return sendSuccess(res, 'Pipeline details fetched successfully', pipeline);
  } catch (err) {
    return next(err);
  }
};

export const createPipeline = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const pipeline = await createNewPipeline({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Pipeline created successfully', pipeline, 201);
  } catch (err) {
    return next(err);
  }
};

export const updatePipeline = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const pipeline = await updatePipelineById({
      pipelineId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Pipeline updated successfully', pipeline);
  } catch (err) {
    return next(err);
  }
};

export const deletePipeline = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await deletePipelineById({
      pipelineId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ip,
      userAgent,
    });
    return sendSuccess(res, 'Pipeline deleted successfully');
  } catch (err) {
    return next(err);
  }
};
