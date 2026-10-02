import { z } from 'zod';

export const quoteLineItemSchema = z.object({
  name: z.string().min(1, 'Product or service name is required').trim(),
  description: z.string().optional().default(''),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').default(1),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
});

export const quoteFormSchema = z.object({
  title: z.string().min(1, 'Quotation title is required').trim(),
  dealId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  currency: z.string().optional().default('USD'),
  validUntil: z.string().optional().nullable(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z
    .array(quoteLineItemSchema)
    .min(1, 'You must include at least one item in the quotation'),
});

export const quoteRejectSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason for rejecting this quotation').trim(),
});
