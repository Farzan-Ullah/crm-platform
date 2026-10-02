import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Task', 'Call', 'Meeting', 'Note'],
      required: [true, 'Activity type is required'],
      default: 'Task',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    dueDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // Duration in minutes for calls/meetings
      default: 30,
      min: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignee is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Polymorphic Entity Link
    entityType: {
      type: String,
      enum: ['Lead', 'Contact', 'Company', 'Deal', 'Quote', null],
      default: null,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityType',
      default: null,
      index: true,
    },

    // Convenient direct foreign keys for fast lookups
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
      index: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
      index: true,
    },

    // Call-specific properties
    callOutcome: {
      type: String,
      enum: [
        'Connected',
        'Left Voicemail',
        'No Answer',
        'Wrong Number',
        'Busy',
        'Scheduled Callback',
        'Other',
        null,
      ],
      default: null,
    },
    callDirection: {
      type: String,
      enum: ['Inbound', 'Outbound'],
      default: 'Outbound',
    },
    phoneNumber: {
      type: String,
      default: '',
    },

    // Meeting-specific properties
    location: {
      type: String,
      default: '',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    attendees: {
      type: [String],
      default: [],
    },

    // Reminders
    reminderEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    reminderTime: {
      type: Date,
      default: null,
      index: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderJobId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for overdue check
activitySchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed' || this.status === 'Cancelled') return false;
  return this.dueDate && new Date(this.dueDate) < new Date();
});

// Compound indexes
activitySchema.index({ tenantId: 1, type: 1, status: 1 });
activitySchema.index({ tenantId: 1, assignedTo: 1, dueDate: 1 });
activitySchema.index({ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 });
activitySchema.index({ tenantId: 1, reminderEnabled: 1, reminderSent: 1, reminderTime: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
