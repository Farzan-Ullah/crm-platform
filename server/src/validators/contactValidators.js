import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }).min(1).trim(),
    lastName: z.string({ required_error: 'Last name is required' }).min(1).trim(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alternatePhone: z.string().optional().or(z.literal('')),
    jobTitle: z.string().optional().or(z.literal('')),
    companyId: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).trim().optional(),
    lastName: z.string().min(1).trim().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alternatePhone: z.string().optional().or(z.literal('')),
    jobTitle: z.string().optional().or(z.literal('')),
    companyId: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
  }),
});

export const mergeContactsSchema = z.object({
  body: z.object({
    primaryContactId: z.string({ required_error: 'Primary contact ID is required' }),
    secondaryContactId: z.string({ required_error: 'Secondary contact ID is required' }),
    mergedFields: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional().or(z.literal('')),
      alternatePhone: z.string().optional().or(z.literal('')),
      jobTitle: z.string().optional().or(z.literal('')),
      companyId: z.string().optional().nullable(),
      description: z.string().optional(),
    }),
  }),
});
