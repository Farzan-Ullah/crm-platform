import { Pipeline } from '../models/Pipeline.js';
import { Deal } from '../models/Deal.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const getPipelinesList = async (tenantId) => {
  let pipelines = await Pipeline.find({ tenantId }).sort({ isDefault: -1, createdAt: 1 });

  // If no pipeline exists for this tenant, auto-seed default pipeline
  if (!pipelines || pipelines.length === 0) {
    const defaultPipeline = await Pipeline.create({
      tenantId,
      name: 'Standard Sales Pipeline',
      isDefault: true,
      stages: [
        { name: 'New Lead', order: 0, probability: 10, color: '#3b82f6', isWon: false, isLost: false },
        { name: 'Discovery & Qualified', order: 1, probability: 25, color: '#6366f1', isWon: false, isLost: false },
        { name: 'Proposal / Demo', order: 2, probability: 50, color: '#8b5cf6', isWon: false, isLost: false },
        { name: 'Negotiation', order: 3, probability: 75, color: '#f59e0b', isWon: false, isLost: false },
        { name: 'Closed Won', order: 4, probability: 100, color: '#10b981', isWon: true, isLost: false },
        { name: 'Closed Lost', order: 5, probability: 0, color: '#ef4444', isWon: false, isLost: true },
      ],
    });
    pipelines = [defaultPipeline];
  }

  return pipelines;
};

export const getPipelineDetails = async (pipelineId, tenantId) => {
  const pipeline = await Pipeline.findOne({ _id: pipelineId, tenantId });
  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }
  return pipeline;
};

export const createNewPipeline = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  if (data.isDefault) {
    await Pipeline.updateMany({ tenantId }, { $set: { isDefault: false } });
  }

  // Ensure stages have sequential order
  if (data.stages && Array.isArray(data.stages)) {
    data.stages = data.stages.map((stage, idx) => ({
      ...stage,
      order: stage.order ?? idx,
    }));
  }

  const pipeline = await Pipeline.create({
    ...data,
    tenantId,
  });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Pipeline',
    entityId: pipeline._id,
    after: { name: pipeline.name, isDefault: pipeline.isDefault, stageCount: pipeline.stages.length },
    ip,
    userAgent,
  });

  return pipeline;
};

export const updatePipelineById = async ({
  pipelineId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const pipeline = await Pipeline.findOne({ _id: pipelineId, tenantId });
  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = pipeline.toObject();

  if (updates.isDefault) {
    await Pipeline.updateMany(
      { tenantId, _id: { $ne: pipeline._id } },
      { $set: { isDefault: false } }
    );
  }

  if (updates.stages && Array.isArray(updates.stages)) {
    updates.stages = updates.stages.map((stage, idx) => ({
      ...stage,
      order: stage.order ?? idx,
    }));
  }

  Object.assign(pipeline, updates);
  await pipeline.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Pipeline',
    entityId: pipeline._id,
    before: beforeSnapshot,
    after: pipeline.toObject(),
    ip,
    userAgent,
  });

  return pipeline;
};

export const deletePipelineById = async ({
  pipelineId,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const pipeline = await Pipeline.findOne({ _id: pipelineId, tenantId });
  if (!pipeline) {
    throw new AppError('Pipeline not found.', 404, 'NOT_FOUND');
  }

  const dealsCount = await Deal.countDocuments({ pipelineId, tenantId });
  if (dealsCount > 0) {
    throw new AppError(
      `Cannot delete pipeline with ${dealsCount} active deal(s). Reassign or delete these deals first.`,
      400,
      'PIPELINE_HAS_DEALS'
    );
  }

  const totalPipelines = await Pipeline.countDocuments({ tenantId });
  if (totalPipelines <= 1) {
    throw new AppError('Cannot delete the only remaining pipeline in your CRM account.', 400, 'CANNOT_DELETE_LAST');
  }

  await Pipeline.deleteOne({ _id: pipelineId, tenantId });

  // If deleted was default, make another one default
  if (pipeline.isDefault) {
    const another = await Pipeline.findOne({ tenantId });
    if (another) {
      another.isDefault = true;
      await another.save();
    }
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Pipeline',
    entityId: pipeline._id,
    before: { name: pipeline.name },
    ip,
    userAgent,
  });

  return true;
};
