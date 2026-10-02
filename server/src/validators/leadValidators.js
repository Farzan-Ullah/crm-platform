import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }).min(1, 'First name is required').trim(),
    lastName: z.string({ required_error: 'Last name is required' }).min(1, 'Last name is required').trim(),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alternatePhone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    jobTitle: z.string().optional().or(z.literal('')),
    source: z
      .enum([
        'Website',
        'Referral',
        'Cold Call',
        'Email',
        'Social Media',
        'Advertisement',
        'Campaign',
        'Partner',
        'Other',
      ])
      .default('Website'),
    status: z
      .enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'])
      .default('New'),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    notes: z.string().optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alternatePhone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    jobTitle: z.string().optional().or(z.literal('')),
    source: z
      .enum([
        'Website',
        'Referral',
        'Cold Call',
        'Email',
        'Social Media',
        'Advertisement',
        'Campaign',
        'Partner',
        'Other',
      ])
      .optional(),
    status: z
      .enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'])
      .optional(),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    notes: z.string().optional(),
  }),
});

export const assignLeadSchema = z.object({
  body: z.object({
    ownerId: z.string({ required_error: 'Owner ID is required' }),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string()).min(1, 'At least one lead ID must be provided'),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost']),
  }),
});

export const bulkAssignSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string()).min(1, 'At least one lead ID must be provided'),
    ownerId: z.string({ required_error: 'Owner ID or round-robin keyword is required' }),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string()).min(1, 'At least one lead ID must be provided'),
  }),
});

export const publicLeadCaptureSchema = z.object({
  body: z.object({
    tenantSubdomain: z.string({ required_error: 'Tenant identifier is required' }),
    firstName: z.string({ required_error: 'First name is required' }).min(1),
    lastName: z.string({ required_error: 'Last name is required' }).min(1),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    source: z.string().optional().default('Website'),
    // Honeypot field for anti-spam bots (must remain empty for legitimate human submissions)
    hpField: z.string().optional(),
  }),
});
