import { z } from 'zod';

export const createDealSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Deal title is required').trim(),
    value: z.number().min(0, 'Deal value must be non-negative'),
    pipelineId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
    expectedClose: z.string().optional().nullable(),
    expectedCloseDate: z.string().optional().nullable(),
    probability: z.number().min(0).max(100).optional(),
    status: z.enum(['Open', 'Won', 'Lost']).optional().default('Open'),
    priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
    source: z.string().optional().default('Outbound'),
    lostReason: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    description: z.string().optional().default(''),
  }),
});

export const updateDealSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    value: z.number().min(0).optional(),
    pipelineId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
    expectedClose: z.string().optional().nullable(),
    expectedCloseDate: z.string().optional().nullable(),
    probability: z.number().min(0).max(100).optional(),
    status: z.enum(['Open', 'Won', 'Lost']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    source: z.string().optional(),
    lostReason: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const updateDealStageSchema = z.object({
  body: z.object({
    stageId: z.string().min(1, 'stageId is required'),
    order: z.number().int().min(0).optional().default(0),
    lostReason: z.string().optional().default(''),
  }),
});
