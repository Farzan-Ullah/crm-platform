import { z } from 'zod';

export const dealFormSchema = z.object({
  title: z.string().min(1, 'Opportunity title is required').trim(),
  value: z.coerce.number().min(0, 'Value must be greater than or equal to 0'),
  pipelineId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Open', 'Won', 'Lost']).default('Open'),
  source: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
});
