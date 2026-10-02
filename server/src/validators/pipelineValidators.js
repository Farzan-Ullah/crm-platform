import { z } from 'zod';

const stageItemSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Stage name is required').trim(),
  order: z.number().int().min(0).optional(),
  probability: z.number().min(0).max(100).default(10),
  color: z.string().optional().default('#6366f1'),
  isWon: z.boolean().optional().default(false),
  isLost: z.boolean().optional().default(false),
});

export const createPipelineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Pipeline name is required').trim(),
    isDefault: z.boolean().optional().default(false),
    stages: z.array(stageItemSchema).min(1, 'Pipeline must have at least one stage'),
  }),
});

export const updatePipelineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Pipeline name is required').trim().optional(),
    isDefault: z.boolean().optional(),
    stages: z.array(stageItemSchema).min(1, 'Pipeline must have at least one stage').optional(),
  }),
});
