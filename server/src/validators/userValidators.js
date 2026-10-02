import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }).min(1).trim(),
    lastName: z.string({ required_error: 'Last name is required' }).min(1).trim(),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
    role: z.enum(Object.values(ROLES)).default(ROLES.SALES_EXECUTIVE),
    teamId: z.string().optional().nullable(),
    phone: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.enum(Object.values(ROLES)).optional(),
    teamId: z.string().optional().nullable(),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  }),
});
