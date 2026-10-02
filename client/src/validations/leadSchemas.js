import { z } from 'zod';

export const leadFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  alternatePhone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  source: z.string().default('Website'),
  status: z.string().default('New'),
  ownerId: z.string().optional().nullable(),
  tags: z.string().optional(), // Entered as comma separated string in form, parsed on submit
  notes: z.string().optional(),
});
