import { z } from 'zod';

export const activityFormSchema = z.object({
  type: z.enum(['Task', 'Call', 'Meeting', 'Note']).default('Task'),
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().optional().default(''),
  status: z.enum(['Pending', 'Completed', 'Cancelled']).default('Pending'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z.string().min(1, 'Scheduled date/time is required'),
  duration: z.coerce.number().min(0).default(30),
  assignedTo: z.string().optional().nullable(),

  // Polymorphic entity
  entityType: z.enum(['Lead', 'Contact', 'Company', 'Deal', '']).optional().nullable(),
  entityId: z.string().optional().nullable(),

  // Call fields
  callOutcome: z.string().optional().nullable(),
  callDirection: z.enum(['Inbound', 'Outbound']).default('Outbound'),
  phoneNumber: z.string().optional(),

  // Meeting fields
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  attendees: z.string().optional(),

  // Reminders
  reminderEnabled: z.boolean().default(true),
  reminderOffsetMinutes: z.coerce.number().default(15),
});
