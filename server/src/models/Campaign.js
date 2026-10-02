import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Campaign email subject is required'],
      trim: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: [true, 'Email template is required'],
    },
    targetAudience: {
      entityType: {
        type: String,
        enum: ['Lead', 'Contact'],
        default: 'Lead',
      },
      filters: {
        status: { type: [String], default: [] },
        scoreMin: { type: Number, default: 0 },
        scoreMax: { type: Number, default: 100 },
        tags: { type: [String], default: [] },
        source: { type: [String], default: [] },
      },
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Sending', 'Completed', 'Cancelled', 'Failed'],
      default: 'Draft',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
      bouncedCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ tenantId: 1, scheduledAt: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);
