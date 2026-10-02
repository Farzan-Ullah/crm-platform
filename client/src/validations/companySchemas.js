import { z } from 'zod';

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required').trim(),
  domain: z.string().optional().or(z.literal('')),
  industry: z.string().default('Technology'),
  size: z.string().default('11-50'),
  website: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});
