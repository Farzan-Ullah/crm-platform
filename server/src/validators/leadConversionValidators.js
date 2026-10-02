import { z } from 'zod';

export const convertLeadSchema = z.object({
  body: z.object({
    companyChoice: z.enum(['existing', 'new']).default('new'),
    companyId: z.string().optional().nullable(),
    newCompanyName: z.string().optional(),
    newCompanyDomain: z.string().optional(),

    contactChoice: z.enum(['existing', 'new']).default('new'),
    contactId: z.string().optional().nullable(),
    newContactFirstName: z.string().optional(),
    newContactLastName: z.string().optional(),
    newContactEmail: z.string().email().optional().or(z.literal('')),
    newContactPhone: z.string().optional(),
    newContactJobTitle: z.string().optional(),

    createDeal: z.boolean().default(false),
    dealTitle: z.string().optional(),
    dealValue: z.number().min(0).optional(),
    dealExpectedClose: z.string().optional(),
    dealPipelineId: z.string().optional().nullable(),
    dealStageId: z.string().optional().nullable(),
  }),
});
