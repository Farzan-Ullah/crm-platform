import { z } from 'zod';

const lineItemSchema = z.object({
  name: z.string().min(1, 'Product or service name is required').trim(),
  description: z.string().optional().default(''),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').default(1),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
});

export const createQuoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Quotation title is required').trim(),
    dealId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
    currency: z.string().optional().default('USD'),
    terms: z.string().optional(),
    notes: z.string().optional(),
    validUntil: z.string().optional().nullable(),
    status: z.enum(['Draft', 'Pending Approval', 'Approved']).optional(),
  }),
});

export const updateQuoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    dealId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    lineItems: z.array(lineItemSchema).min(1).optional(),
    currency: z.string().optional(),
    terms: z.string().optional(),
    notes: z.string().optional(),
    validUntil: z.string().optional().nullable(),
  }),
});

export const rejectQuoteSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').trim(),
  }),
});

export const declineQuoteSchema = z.object({
  body: z.object({
    reason: z.string().optional().default(''),
  }),
});
