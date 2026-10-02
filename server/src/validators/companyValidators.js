import { z } from 'zod';

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Company name is required' }).min(1, 'Company name is required').trim(),
    domain: z.string().optional().or(z.literal('')),
    industry: z.string().optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    website: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    domain: z.string().optional().or(z.literal('')),
    industry: z.string().optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    website: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});
