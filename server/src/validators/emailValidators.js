import { z } from 'zod';

export const sendEmailSchema = z.object({
  body: z.object({
    to: z.string().email('Valid recipient email address is required'),
    subject: z.string().min(1, 'Subject is required').trim(),
    bodyHtml: z.string().min(1, 'HTML body content is required'),
    bodyText: z.string().optional().default(''),
    templateId: z.string().optional().nullable(),
    entityType: z.enum(['Lead', 'Contact', 'Company', 'Deal']).optional().nullable(),
    entityId: z.string().optional().nullable(),
    variables: z.record(z.any()).optional().default({}),
    cc: z.array(z.string().email()).optional().default([]),
    bcc: z.array(z.string().email()).optional().default([]),
  }),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Template name is required').trim(),
    subject: z.string().min(1, 'Subject is required').trim(),
    category: z.enum(['Sales', 'Marketing', 'FollowUp', 'Onboarding', 'Transactional', 'Other']).default('Sales'),
    bodyHtml: z.string().min(1, 'HTML body content is required'),
    bodyText: z.string().optional().default(''),
    variables: z.array(z.string()).optional().default([]),
    isShared: z.boolean().optional().default(true),
  }),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    subject: z.string().min(1).trim().optional(),
    category: z.enum(['Sales', 'Marketing', 'FollowUp', 'Onboarding', 'Transactional', 'Other']).optional(),
    bodyHtml: z.string().min(1).optional(),
    bodyText: z.string().optional(),
    variables: z.array(z.string()).optional(),
    isShared: z.boolean().optional(),
  }),
});

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Campaign name is required').trim(),
    subject: z.string().optional(),
    templateId: z.string().min(1, 'Template selection is required'),
    targetAudience: z.object({
      entityType: z.enum(['Lead', 'Contact']).default('Lead'),
      filters: z.object({
        status: z.array(z.string()).optional().default([]),
        scoreMin: z.coerce.number().optional().default(0),
        scoreMax: z.coerce.number().optional().default(100),
        tags: z.array(z.string()).optional().default([]),
        source: z.array(z.string()).optional().default([]),
      }).optional().default({}),
    }).optional().default({ entityType: 'Lead', filters: {} }),
    scheduledAt: z.string().optional().nullable(),
  }),
});

export const updateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    subject: z.string().optional(),
    templateId: z.string().optional(),
    targetAudience: z.object({
      entityType: z.enum(['Lead', 'Contact']).optional(),
      filters: z.record(z.any()).optional(),
    }).optional(),
    scheduledAt: z.string().optional().nullable(),
  }),
});
