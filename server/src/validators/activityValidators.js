import { z } from 'zod';

export const createActivitySchema = z.object({
  body: z.object({
    type: z.enum(['Task', 'Call', 'Meeting', 'Note']).default('Task'),
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().optional().default(''),
    status: z.enum(['Pending', 'Completed', 'Cancelled']).optional().default('Pending'),
    priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
    dueDate: z.string().optional().nullable(),
    duration: z.coerce.number().min(0).optional().default(30),
    assignedTo: z.string().optional().nullable(),

    // Polymorphic association
    entityType: z.enum(['Lead', 'Contact', 'Company', 'Deal']).optional().nullable(),
    entityId: z.string().optional().nullable(),

    // Call-specific
    callOutcome: z.string().optional().nullable(),
    callDirection: z.enum(['Inbound', 'Outbound']).optional().default('Outbound'),
    phoneNumber: z.string().optional().default(''),

    // Meeting-specific
    location: z.string().optional().default(''),
    meetingLink: z.string().optional().default(''),
    attendees: z.array(z.string()).optional().default([]),

    // Reminders
    reminderEnabled: z.boolean().optional().default(true),
    reminderOffsetMinutes: z.coerce.number().optional().default(15),
    reminderTime: z.string().optional().nullable(),
  }),
});

export const updateActivitySchema = z.object({
  body: z.object({
    type: z.enum(['Task', 'Call', 'Meeting', 'Note']).optional(),
    title: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    status: z.enum(['Pending', 'Completed', 'Cancelled']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().optional().nullable(),
    duration: z.coerce.number().min(0).optional(),
    assignedTo: z.string().optional().nullable(),

    entityType: z.enum(['Lead', 'Contact', 'Company', 'Deal']).optional().nullable(),
    entityId: z.string().optional().nullable(),

    callOutcome: z.string().optional().nullable(),
    callDirection: z.enum(['Inbound', 'Outbound']).optional(),
    phoneNumber: z.string().optional(),

    location: z.string().optional(),
    meetingLink: z.string().optional(),
    attendees: z.array(z.string()).optional(),

    reminderEnabled: z.boolean().optional(),
    reminderOffsetMinutes: z.coerce.number().optional(),
    reminderTime: z.string().optional().nullable(),
  }),
});
