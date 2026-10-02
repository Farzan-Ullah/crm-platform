import { z } from 'zod';

export const sendEmailFormSchema = z.object({
  to: z.string().email('Please enter a valid recipient email address'),
  subject: z.string().min(1, 'Subject is required').trim(),
  bodyHtml: z.string().min(1, 'Email content is required'),
  templateId: z.string().optional().nullable(),
  entityType: z.enum(['Lead', 'Contact', 'Company', 'Deal', '']).optional().nullable(),
  entityId: z.string().optional().nullable(),
});

export const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required').trim(),
  subject: z.string().min(1, 'Subject line is required').trim(),
  category: z.enum(['Sales', 'Marketing', 'FollowUp', 'Onboarding', 'Transactional', 'Other']).default('Sales'),
  bodyHtml: z.string().min(1, 'Template HTML body is required'),
  bodyText: z.string().optional().default(''),
  isShared: z.boolean().default(true),
});

export const campaignFormSchema = z.object({
  name: z.string().min(1, 'Campaign title is required').trim(),
  subject: z.string().optional(),
  templateId: z.string().min(1, 'Please select an email template'),
  entityType: z.enum(['Lead', 'Contact']).default('Lead'),
  statusFilter: z.string().optional().default(''),
  scoreMin: z.coerce.number().min(0).max(100).default(0),
  scoreMax: z.coerce.number().min(0).max(100).default(100),
  scheduledAt: z.string().optional().nullable(),
});
