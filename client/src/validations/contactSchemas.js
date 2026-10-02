import { z } from 'zod';

export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  alternatePhone: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
});
