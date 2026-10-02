import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Team name is required' }).min(1).trim(),
    managerId: z.string().optional().nullable(),
    memberIds: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    managerId: z.string().optional().nullable(),
    memberIds: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});
